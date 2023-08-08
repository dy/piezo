import {INT,FLOAT} from './const.js';
import { err, ids, intersect } from './util.js';

// Static optimizations, denormalizations

export default function precompile (node) {
  return expr(node)
}

// bottom-up mapping
function expr(node) {
  if (Array.isArray(node)) {
    for (let i = 1; i < node.length; i++) node[i] = expr(node[i])
    let newNode
    while ((newNode = expr[node[0]]?.(node)) != null) node = newNode;
  }

  return node
}

// expr receives optimized components and expects to return optimized result (no need to internally call expr)
// returning undefined means node is good to go
Object.assign(expr, {
  [FLOAT]([,v]){  },
  [INT]([,v]){  },

  '('([,a]) {
    if (!a) return
    // ((x)) -> (x)
    if (a[0] === '(') return a
    // (0.5) -> 0.5
    if (typeof a[1] === 'number') return a
  },

  '='([,a,b]) {
    // ignore fns a()
    if (a[0]==='()') return

    // if b contains some members of a
    // (a,b)=(b,a) -> (t0=b,t1=a;a=t0,b=t1);
    if (a[0]==='(' && a[1][0] ===',' && intersect(ids(a), ids(b))) {
      const n = a[1].length - 1
      return ['(',[';',
        unroll('=', ['(',[',',...Array.from({length:n},(b,i)=>`t:${i}`)]], b),
        unroll('=', a, ['(',[',',...Array.from({length:n},(a,i)=>`t:${i}`)]])
      ]]
    }
    return unroll('=',a,b)
  },

  // FIXME: move it to parser, ++ for a++, += for ++a
  '++'([, a]) { return ['+=', a, [INT, 1]] },
  '--'([, a]) { return ['-=', a, [INT, 1]] },
  '+='([, a, b]) { return ['=', a, ['+', a, b]] },
  '-='([, a, b]) { return ['=', a, ['-', a, b]] },
  '*='([, a, b]) { return ['=', a, ['*', a, b]] },
  '/='([, a, b]) { return ['=', a, ['/', a, b]] },
  '%='([, a, b]) { return ['=', a, ['%', a, b]] },
  '**='([, a, b]) { return ['=', a, ['**', a, b]] },
  '<?='([, a, b]) { return ['=', a, ['<?', a, b]] },

  '+'([, a, b]) {
    return unroll('+', a, b) || (
      typeof b[1] === 'number' && typeof a[1] === 'number' ? [a[0]===INT&&b[0]===INT?INT:FLOAT, a[1]+b[1]] :
      b[1] === 0 ? a :
      a[1] === 0 ? b :
      null
    )
  },
  '-'([,a,b]) {
    // [-,[INT,1]] -> [INT,-1]
    if (!b) {
      if (typeof a[1] === 'number') return [a[0], -a[1]]
      return
    }

    return unroll('-', a, b) || (
      typeof a[1] === 'number' && typeof b[1] === 'number' ? [a[0]===INT&&b[0]===INT?INT:FLOAT, a[1]-b[1]] :
      a[1] === 0 ? ['-', b] :
      b[1] === 0 ? a :
      null
    )
  },
  '*'([, a, b]) {
    if (!b) return unroll('*', a)
    return unroll('*', a, b) || (
      (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, a[1] * b[1]] :
      a[1] === 0 || b[1] === 0 ? [FLOAT, 0] :
      b[1] === 1 ? a :
      a[1] === 1 ? b :
      null
    )
  },
  '/'([, a, b]) {
    return unroll('/', a, b) || (
      (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, a[1] / b[1]] :
      a[1] === 0 ? [FLOAT, 0] : // 0 / x
      b[1] === 1 ? a : // x / 1
      null
    )
  },
  '%'([, a, b]) { return unroll('%', a, b) },

  '%%'([, a, b]) { return unroll('%%', a, b) },
  '**'([, a, b]) {
    return unroll('**', a, b) || (
      (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, a[1] ** b[1]] :
      (b[1] === 0) ? [FLOAT, 1] :
      (a[1] === 1) ? [FLOAT, 1] :
      (b[1] === 1) ? a :
      (b[1] === 0.5) ? ['/*',a] :
      (b[1] === -1) ? ['/',[FLOAT,1], b] :
      (b[1] === -0.5) ? ['/',[FLOAT,1],['/*',a]] :
      // FIXME: here we exceptionally handle internal expr. Maybe we should generally handle expressions like that?
      (typeof b[1] === 'number' && b[1] < 0) ? ['/',[FLOAT,1], expr(['**', a, [FLOAT, Math.abs(b[1])]])] :
      // a ** 24 -> a*[a*[a...*a]]
      (b[1]%1 === 0 && b[1] < 24) ? Array(b[1]).fill(a).reduce((prev,a) => ['*',a,prev]) :
      null
    );
  },
  '//'([, a, b]) { return unroll('//', a, b) },

  '&'([, a, b]) { return unroll('&', a, b) },
  '|'([, a, b]) { return unroll('|', a, b) || (
    // 0 | a -> a | 0
    (a[1] === 0) ? ['|', b, a] :
    (typeof a[1] === 'number' && typeof b[1] === 'number') ? [INT, a[1] | b[1]] :
      null
    )
  },
  '~'([, a, b]) { return unroll('~', a, b) },
  '^'([, a, b]) { return unroll('^', a, b) },

  '>'([, a, b]) { return unroll('>', a, b) },
  '>='([, a, b]) { return unroll('>=', a, b) },
  '<'([, a, b]) { return unroll('<', a, b) },
  '<='([, a, b]) { return unroll('<=', a, b) },
  '=='([, a, b]) { return unroll('==', a, b) },
  '!='([, a, b]) { return unroll('!=', a, b) },

  '&&'([, a, b]) { return unroll('&&', a, b) || (
    // 0 && b
    a[1] === 0 ? a :
    // a && 0
    b[1] === 0 ? b :
    // 1 && b
    (typeof a[1] === 'number' && a[1]) ? b :
    // a && 1
    (typeof b[1] === 'number' && b[1]) ? a :
    null
  ) },
  '||'([, a, b]) { return unroll('||', a, b) || (
    // 0 || a
    a[1] === 0 ? b :
    // a || 0
    b[1] === 0 ? a :
    // 1 || b
    typeof a[1] === 'number' && a[1] ? b :
    // a || 1
    typeof b[1] === 'number' && b[1] ? a :
    null
  ) },
  '<<'([, a, b]) { return unroll('<<', a, b) },
  '>>'([, a, b]) { return unroll('>>', a, b) },
  '!'([, a, b]) { return unroll('!', a, b) },
  '?'([, a, b]) { return unroll('?', a, b) },
  '?:'([, a, b, c]) { return a[1] === 0 ? c : (typeof a[1] === 'number' && a[1]) ? b : null }
})

// if a,b contain multiple elements - try regrouping to simple ops
// FIXME: we cannot unroll (a,b)=(b,a) -> (a=b, b=a), we must (t0=b,t1=a); (a=t0,b=t1)
function unroll(op, a, b) {
  if (!b) {
    // -(a,b) -> (-a,-b)
    if (a[0] === '(' && a[1]?.[0] === ',') {
      const [, ...as] = a[1]
      return ['(', [',', ...as.map((a) => [op, a])]]
    }
    return
  }

  if (a[0] === '(' && a[1]?.[0] === ',') {
    // (a0,a1) * (b0,b1); -> (a0 * b0, a1 * b1)
    // (a0,a1,a2) * (b0,b1) -> (a0*b0, a1*b1, a2)
    // (a0,a1) * (b0,b1,b2) -> (a0*b0, a1*b1, b2)
    // (a0,,a2) * (b0,b1,b2) -> (a0*b0, b1, a2*b2)
    const [, ...as] = a[1]
    if (b[0] === '(' && b[1]?.[0] === ',') {
      const [, ...bs] = b[1]
      if (as.length !== bs.length) err(`Mismatching number of elements in \`${op}\` operation`)
      return ['(', [',',
        ...Array.from({length:Math.max(as.length,bs.length)}, (_,i) => [op, as[i]||bs[i], bs[i]||as[i] ])
      ]]
    }

    // (a0, a1) * b -> (a0 * b, a1 * b)
    return ['(', [',', ...as.map(a => [op, a, b])]]

    // FIXME: to make more complex mapping we have to know arity of internal result
    // (a0, a1) * expr() -> tmp=b; (a0 * tmp, a1 * tmp)
    // return [';',['=','__tmp',b], ['(', [',', ...as.map(a => [op, a, '__tmp'])]]]
  }

  // a * (b0, b1) -> tmp=a; (a * b0, a * b1)
  if (b[0] === '(' && b[1]?.[0] === ',') {
    const [, ...bs] = b[1]
    return ['(', [',', ...bs.map(b => [op, a, b])]]
  }
}
