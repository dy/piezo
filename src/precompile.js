// Static optimizations, denormalizations etc.
// Prepares tree for compiler.

import { INT, FLOAT } from './const.js';
import { err, ids, intersect } from './util.js';

let units, prev

export default function precompile(node) {
  prev = { units };
  units = {}; // currently defined units
  const result = expr(node);
  ({ units } = prev);
  return result
}

// we need top-bottom mapping, imagine `1k = expression;` - it would need
function expr(node) {
  if (Array.isArray(node)) {
    return expr[node[0]] ? expr[node[0]](node) : node
  }

  return node
}

// convert unit node to value
function applyUnits(n, unit, ext) {
  if (unit) n = expr(['*', [FLOAT, n], units[unit] || err(`Unknown unit \`${unit}\``)]);
  if (ext) n = expr(['+', n, applyUnits(...ext.slice(1))])
  return n
}

// takes input node, maps to processed output node
// takes handle of recursion: result is replaced as-is, no external recursion is performed
// + fixes units cases like 1k = expr
// + allows discarding unknow syntax nodes
// + allows simpler optimized walk-through
// + allows more precise errors
Object.assign(expr, {
  [FLOAT]([, n, unit, ext]) {
    if (unit) return applyUnits(n, unit, ext)
    return [FLOAT, n]
  },
  [INT]([, n, unit, ext]) {
    if (unit) return applyUnits(n, unit, ext)
    return [INT, n]
  },

  ';'(node) {
    let list = []
    for (let i = 1, out; i < node.length; i++) if (out = expr(node[i])) list.push(out)
    return list.length > 1 ? [';', ...list] : list[0]
  },
  ','(node) {
    return node.flatMap((a, i) => {
      if (!i || !a) return [a]
      a = expr(a)
      if (a[0] === '(') {
        // FIXME: if internal expr returns groups - must turn full group into heap expr
      }
      return [a]
    })
  },
  '^'([, a]) {
    return ['^', expr(a)]
  },
  '^^'([, a]) {
    return ['^^', expr(a)]
  },
  '^^^'([, a]) {
    return ['^^^', expr(a)]
  },

  '()'([, a]) {
    // NOTE: we make sure parens are present only if internal condition is dynamic
    // otherwise parents are unwrapped
    a = expr(a)
    // a=() -> a=(), ignore comment stubs
    if (!a || !a.length) return ['()']
    // ((x)) -> (x)
    if (a[0] === '()') return a
    // (0.5) -> 0.5
    if (typeof a[1] === 'number') return a
    // (0..10) -> 0..10
    if (a[1] === '..') return a
    // (a,b,c) -> a,b,c
    if (a[0] === ',') return a
    return ['()', a]
  },

  // f(a,b,c)
  '('([, name, args]) {
    console.log(123, args)
    args = !args ? [,] : args[0] === ',' ? args : [',', args]
    return ['(', name, args]
  },

  // [1,2,3]
  '[]'([, inits]) {
    inits = expr(inits)

    // normalize to [,] form
    inits = !inits ? [,] : inits[0] === ',' ? inits : [',', inits]

    // FIXME: [0..10 <| xxx, (1,2,3) <| xxx] - can be converted to static inits
    inits = inits.flatMap((el, i) => {
      if (!i) return [el]
      // [1..4] -> [1,2,3]
      if (el[0] === '..' && typeof el[1][1] === 'number' && typeof el[2][1] === 'number' && Math.abs(el[2][1] - el[1][1]) < 108) {
        let from = el[1][1], to = el[2][1], step = 1, els = []
        if (from === -Infinity) for (let i = 0; i < to; i += step) els.push([FLOAT, 0])
        else if (from < to) for (let i = from; i < to; i += step) els.push([FLOAT, i])
        else for (let i = from; i > to; i -= step) els.push([FLOAT, i])
        return els
      }
      return [el]
    })

    return ['[]', inits]
  },

  '..'([, a, b]) {
    // ..b
    if (!a) return ['..', [FLOAT, -Infinity], expr(b)]
    // a..
    if (!b) return ['..', expr(a), [FLOAT, Infinity]]
    // a..b
    a = expr(a), b = expr(b)
    return ['..', a, b]
  },

  '|>'([, a, b]) {
    a = expr(a), b = expr(b)

    // FIXME: 1..10 -> 1,2,3,4,5,6,7,8,9
    // if (typeof a[1] === 'number' && typeof b[1] === 'number' && Math.abs(b[1]-a[1]) < 108) {
    // }
    return ['|>', a, b]
  },

  // a[0]
  '['([, a, b]) {
    a = expr(a)

    if (!b) return ['[', a]

    b = expr(b)

    // a[0,1] -> a[0], a[1]
    return unroll('[', a, b) || (
      ['[', a, b]
    )
  },

  '='([, a, b]) {
    b = expr(b)

    // a() = ...
    // FIXME: can handle better: collect args, returns etc.
    if (a[0] === '(') {
      // normalize body to (a;b;) form
      b = b[0] === '()' ? b : ['()', b]
      b[1] = !b[1] ? [';'] : b[1][0] === ';' ? b[1] : [';', b[1]]

      // normalize args list
      let [, name, args] = a
      args = !args ? [,] : args[0] === ',' ? args : [',', args];

      return ['=', ['(', name, args], b]
    }

    // 1k = expr - define units
    if ((a[0] === INT || a[0] === FLOAT) && a[2]) {
      let [, n, unit] = a
      units[unit] = expr(['/', b, [FLOAT, n]])
      return
    }

    a = expr(a)

    // if b contains some members of a
    // (a,b)=(b,a) -> (t0=b,t1=a;a=t0,b=t1);
    if (a[0] === ',' && intersect(ids(a), ids(b))) {
      const n = a.length - 1
      return ['()', [';',
        unroll('=', [',', ...Array.from({ length: n }, (b, i) => `t:${i}`)], b),
        unroll('=', a, [',', ...Array.from({ length: n }, (a, i) => `t:${i}`)])
      ]]
    }

    // x[b]=b
    if (a[0] === '[]') {
      let [, arr, idx] = a
      idx = expr(idx)
      a = ['[]', arr, idx]
    }

    return unroll('=', a, b) || ['=', a, b]
  },

  '+='([, a, b]) { return expr(['=', a, ['+', a, b]]) },
  '-='([, a, b]) { return expr(['=', a, ['-', a, b]]) },
  '*='([, a, b]) { return expr(['=', a, ['*', a, b]]) },
  '/='([, a, b]) { return expr(['=', a, ['/', a, b]]) },
  '%='([, a, b]) { return expr(['=', a, ['%', a, b]]) },
  '**='([, a, b]) { return expr(['=', a, ['**', a, b]]) },
  '~='([, a, b]) { return expr(['=', a, ['~', a, b]]) },

  '+'([, a, b]) {
    a = expr(a), b = expr(b);
    return unroll('+', a, b) || (
      typeof b[1] === 'number' && typeof a[1] === 'number' ? [a[0] === INT && b[0] === INT ? INT : FLOAT, a[1] + b[1]] :
        b[1] === 0 ? a :
          a[1] === 0 ? b :
            ['+', a, b]
    )
  },
  '-'([, a, b]) {
    // [-,[INT,1]] -> [INT,-1]
    if (!b) {
      a = expr(a)
      if (typeof a[1] === 'number') return [a[0], -a[1]]
      return ['-', a]
    }

    a = expr(a), b = expr(b);
    return unroll('-', a, b) || (
      typeof a[1] === 'number' && typeof b[1] === 'number' ? [a[0] === INT && b[0] === INT ? INT : FLOAT, a[1] - b[1]] :
        a[1] === 0 ? ['-', b] :
          b[1] === 0 ? a :
            ['-', a, b]
    )
  },
  '*'([, a, b]) {
    a = expr(a)

    // *a
    if (!b) return unroll('*', a) || ['*', a]

    b = expr(b);
    return unroll('*', a, b) || (
      (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, a[1] * b[1]] :
        a[1] === 0 || b[1] === 0 ? [FLOAT, 0] :
          b[1] === 1 ? a :
            a[1] === 1 ? b :
              ['*', a, b]
    )
  },
  '/'([, a, b]) {
    a = expr(a), b = expr(b);
    return unroll('/', a, b) || (
      (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, a[1] / b[1]] :
        a[1] === 0 ? [FLOAT, 0] : // 0 / x
          b[1] === 1 ? a : // x / 1
            ['/', a, b]
    )
  },
  '%'([, a, b]) {
    a = expr(a), b = expr(b);
    return unroll('%', a, b) || (
      (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, a[1] % b[1]] :
        ['%', a, b]
    )
  },

  '%%'([, a, b]) {
    a = expr(a), b = expr(b);
    return unroll('%%', a, b) || (
      // FIXME
      // (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, a[1] %% b[1]] :
      ['%%', a, b]
    )
  },
  '**'([, a, b]) {
    a = expr(a), b = expr(b);
    return unroll('**', a, b) || (
      (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, a[1] ** b[1]] :
        (b[1] === 0) ? [FLOAT, 1] :
          (a[1] === 1) ? [FLOAT, 1] :
            (b[1] === 1) ? a :
              (b[1] === -1) ? ['/', [FLOAT, 1], b] :
                (typeof b[1] === 'number' && b[1] < 0) ? ['/', [FLOAT, 1], expr(['**', a, [FLOAT, Math.abs(b[1])]])] :
                  // a ** 3 -> a*a*a
                  (typeof a === 'string' && typeof b[1] === 'number' && b[1] % 1 === 0 && b[1] <= 3) ? Array(b[1]).fill(a).reduce((prev, a) => ['*', a, prev]) :
                    ['**', a, b]
    );
  },
  '//'([, a, b]) {
    a = expr(a), b = expr(b);
    return unroll('//', a, b) || (
      (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, Math.floor(a[1] / b[1])] :
        a[1] === 0 ? [FLOAT, 0] : // 0 // x
          b[1] === 1 ? a : // x // 1
            ['//', a, b]
    )
  },

  '!'([, a]) {
    a = expr(a); return unroll('!', a) || (typeof a[1] === 'number' ? [INT, !a[1]] : ['!', a])
  },
  '&'([, a, b]) {
    a = expr(a), b = expr(b); return unroll('&', a, b) || (
      typeof a[1] === 'number' && typeof b[1] === 'number' ? [INT, a[1] & b[1]] :
        // a & 0 -> 0
        a[1] === 0 || b[1] === 0 ? [INT, 0] :
          ['&', a, b]
    )
  },
  '|'([, a, b]) {
    a = expr(a), b = expr(b); return unroll('|', a, b) || (
      (typeof a[1] === 'number' && typeof b[1] === 'number') ? [INT, a[1] | b[1]] :
        // FIXME: a | 0 -> asInt(a)
        // (a[1] === 0 || b[1] === 0) ? ['|', b, a] :
        ['|', a, b]
    )
  },

  '^'([, a, b]) {
    a = expr(a), b = expr(b)

    return unroll('^', a, b) || (
      typeof a[1] === 'number' && typeof b[1] === 'number' ? [INT, a[1] ^ b[1]] :
        ['^', a, b]
    )
  },

  '<<'([, a, b]) {
    a = expr(a), b = expr(b); return unroll('<<', a, b) || (
      typeof a[1] === 'number' && typeof b[1] === 'number' ? [INT, a[1] << b[1]] :
        ['<<', a, b]
    )
  },
  '>>'([, a, b]) {
    a = expr(a), b = expr(b); return unroll('>>', a, b) || (
      typeof a[1] === 'number' && typeof b[1] === 'number' ? [INT, a[1] >> b[1]] :
        ['>>', a, b]
    )
  },

  '~'([, a]) { a = expr(a); return unroll('~', a) || (typeof a[1] === 'number' ? [INT, ~a[1]] : ['~', a]) },

  '>'([, a, b]) { a = expr(a), b = expr(b); return unroll('>', a, b) || ['>', a, b] },
  '>='([, a, b]) { a = expr(a), b = expr(b); return unroll('>=', a, b) || ['>=', a, b] },
  '<'([, a, b]) { a = expr(a), b = expr(b); return unroll('<', a, b) || ['<', a, b] },
  '<='([, a, b]) { a = expr(a), b = expr(b); return unroll('<=', a, b) || ['<=', a, b] },
  '=='([, a, b]) { a = expr(a), b = expr(b); return unroll('==', a, b) || ['==', a, b] },
  '!='([, a, b]) { a = expr(a), b = expr(b); return unroll('!=', a, b) || ['!=', a, b] },

  '&&'([, a, b]) {
    a = expr(a), b = expr(b); return unroll('&&', a, b) || (
      // 0 && b
      a[1] === 0 ? a :
        // a && 0
        b[1] === 0 ? b :
          // 1 && b
          (typeof a[1] === 'number' && a[1]) ? b :
            // a && 1
            (typeof b[1] === 'number' && b[1]) ? a :
              ['&&', a, b]
    )
  },

  '||'([, a, b]) {
    a = expr(a), b = expr(b); return unroll('||', a, b) || (
      // 0 || b
      a[1] === 0 ? b :
        // a || 0
        b[1] === 0 ? a :
          // 1 || b
          typeof a[1] === 'number' && a[1] ? b :
            // a || 1
            typeof b[1] === 'number' && b[1] ? a :
              ['||', a, b]
    )
  },
  '?'([, a, b]) { a = expr(a), b = expr(b); return unroll('?', a, b) || ['?', a, b] },
  '!'([, a]) { a = expr(a); return unroll('!', a) || ['!', a] },
  '?:'([, a, b, c]) { a = expr(a); return a[1] === 0 ? expr(c) : (typeof a[1] === 'number' && a[1]) ? expr(b) : ['?:', a, expr(b), expr(c)] }
})

// if a,b contain multiple elements - try regrouping to simple ops
function unroll(op, a, b) {
  if (!b) {
    // -(a,b) -> (-a,-b)
    if (a[0] === ',') {
      const [, ...as] = a
      return [',', ...as.map((a) => [op, expr(a)])]
    }
    return
  }

  if (a[0] === ',') {
    // (a0,a1) * (b0,b1); -> (a0 * b0, a1 * b1)
    // (a0,a1,a2) * (b0,b1) -> (a0*b0, a1*b1, a2)
    // (a0,a1) * (b0,b1,b2) -> (a0*b0, a1*b1, b2)
    // (a0,,a2) * (b0,b1,b2) -> (a0*b0, b1, a2*b2)
    const [, ...as] = a
    if (b[0] === ',') {
      const [, ...bs] = b
      if (as.length !== bs.length) err(`Mismatching number of elements in \`${op}\` operation`)
      return [',',
        ...Array.from({ length: Math.max(as.length, bs.length) }, (_, i) => [op, expr(as[i] || bs[i]), expr(bs[i] || as[i])])
      ]
    }

    // (a0, a1) * b -> (a0 * b, a1 * b)
    return (b = expr(b), [',', ...as.map(a => [op, expr(a), b])])

    // FIXME: to make more complex mapping we have to know arity of internal result
    // (a0, a1) * expr() -> tmp=b; (a0 * tmp, a1 * tmp)
    // return [';',['=','__tmp',b], ['(', [',', ...as.map(a => [op, a, '__tmp'])]]]
  }

  // a * (b0, b1) -> tmp=a; (a * b0, a * b1)
  if (b[0] === ',') {
    const [, ...bs] = b
    return a = expr(a), [',', ...bs.map(b => [op, a, expr(b)])]
  }
}
