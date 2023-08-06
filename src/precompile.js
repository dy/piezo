import {INT,FLOAT} from './const.js';

// Static optimizations, denormalizations

export default function precompile (node) {
  return expr(node)
}

// bottom-up mapping
function expr(node) {
  if (Array.isArray(node)) {
    node = node.map((e,i) => i ? expr(e) : e)
    let newNode
    while (newNode = expr[node[0]]?.(node)) node = newNode;
  }

  return node
}

// expr receives optimized components and expects to return optimized result (no need to internally call expr)
// returning undefined means node is good to go
Object.assign(expr, {
  '('([,a]) {
    if (!a) return
    // ((x)) -> (a)
    if (a[0] === '(') return a
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

  '+'([, a, b]) { return unroll('+', a, b) },
  '-'([,a,b]) {
    // [-,[INT,1]] -> [INT,-1]
    if (!b) if (a[0] == INT || a[0] == FLOAT) return [a[0], -a[1]]

    return unroll('-', a, b)
  },
  '*'([, a, b]) {
    if (!b) return unroll('*', a)
    return unroll('*', a, b)
  },
  '/'([, a, b]) { return unroll('/', a, b) },
  '%'([, a, b]) { return unroll('%', a, b) }
})

// if a,b contain multiple elements - try regrouping to simple ops
function unroll(operator, a, b) {
  if (!b) {
    // -(a,b) -> (-a,-b)
    if (a[0] === '(' && a[1]?.[0] === ',') {
      const [, ...as] = a[1]
      return ['(', [',', ...as.map((a) => [operator, a])]]
    }
    return
  }

  if (a[0] === '(' && a[1]?.[0] === ',') {
    // (a0,a1) * (b0,b1); -> (a0 * b0, a1 * b1)
    const [, ...as] = a[1]
    if (b[0] === '(' && b[1]?.[0] === ',') {
      const [, ...bs] = b[1]
      if (as.length !== bs.length) err(`Mismatched group operation sizes`)
      return ['(', [',', ...as.map((a, i) => [operator, a, bs[i]])]]
    }

    // (a0, a1) * b -> (a0 * b, a1 * b)
    if (typeof b === 'string' || b[0] === INT || b[0] === FLOAT) {
      return ['(', [',', ...as.map(a => [operator, a, b])]]
    }

    // FIXME: to make more complex mapping we have to know arity of internal result
    // (a0, a1) * expr() -> tmp=b; (a0 * tmp, a1 * tmp)
    // return [';',['=','__tmp',b], ['(', [',', ...as.map(a => [operator, a, '__tmp'])]]]
  }

  // a * (b0, b1) -> tmp=a; (a * b0, a * b1)
  if ((typeof a === 'string' || a[0] === INT || a[0] === FLOAT) && b[0] === '(' && b[1]?.[0] === ',') {
    const [, ...bs] = b[1]
    return ['(', [',', ...bs.map(b => [operator, a, b])]]
  }
}

