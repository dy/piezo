import {INT,FLOAT} from './const.js';

// static precompilation stage

export default function precompile (node) {
  return expr(node)
}

function expr(node) {
  if (Array.isArray(node)) {
    node = node.map((e,i) => i ? expr(e) : e)
    while (expr[node[0]]) node = expr[node[0]](node)
  }

  return node
}

Object.assign(expr, {
  '++'([, a]) { return ['+=', a, [INT, 1]] },
  '--'([, a]) { return ['-=', a, [INT, 1]] },
  '+='([, a, b]) { return ['=', a, ['+', a, b]] },
  '-='([, a, b]) { return ['=', a, ['-', a, b]] },
  '*='([, a, b]) { return ['=', a, ['*', a, b]] },
  '/='([, a, b]) { return ['=', a, ['/', a, b]] },
  '%='([, a, b]) { return ['=', a, ['%', a, b]] },
  '**='([, a, b]) { return ['=', a, ['**', a, b]] },
  '<?='([, a, b]) { return ['=', a, ['<?', a, b]] },
})

// check if a,b contain multiple elements to allow regrouping
// FIXME: we need to figure out how to make regrouping properly, so that it regroups from children up
function unroll([operator, a, b]) {
  if (a[0] === '(' && a[1]?.[0] === ',') {
    // (a0,a1) * (b0,b1); -> (a0 * b0, a1 * b1)
    const [, ...as] = a[1]
    if (b[0] === '(' && b[1]?.[0] === ',') {
      const [, ...bs] = b[1]
      if (as.length !== bs.length) err(`Mismatched group operation sizes`)
      return ['(', [',', ...as.map((a, i) => [operator, a, bs[i]])]]
    }

    // (a0, a1) * b -> tmp=b; (a0 * tmp, a1 * tmp)
    const bop = expr(b)
    if (bop.type.length === 1) {
      // if (bop.static)
      return ['(', [',', ...as.map(a => [operator, a, b])]]
      // FIXME: more complex case
      const tmp = define('__tmp','f64',true)
      return [';',['=',tmp,b], ['(', [',', ...as.map(a => [operator, a, tmp])]]]
    }
  }

  // a * (b0, b1) -> tmp=a; (a * b0, a * b1)
  if (expr(a).type.length === 1 && b[0] === '(' && b[1]?.[0] === ',') {
    const [, ...bs] = b[1]
    return ['(', [',', ...bs.map(b => [operator, a, b])]]

    // const tmp = define('__tmp','f64',true)
    // return [';',['=',tmp,a], ['(', [',', ...bs.map(b => [operator, tmp, b])]]]
  }
}
