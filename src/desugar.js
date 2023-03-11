// expands short AST nodes into verbose form
// eg. a,b=1,2 becomes a=1; b=2;

export default function desugar (node) {
  if (!Array.isArray(node)) return node

  node = unbracket(node)
  node = flatten(node)

  if (node.length > 2) {
    let [op, left, right] = node
    // a,b=b,a  becomes  _a=b;_b=a;a=_a;_b=_b
    if (left[0] === ',' || right[0] === ',') {
      // normalize number of left/right arguments
      let largs = left[0] === ',' ? left.slice(1) : left,
      rargs = right[0] === ',' ? right.slice(1) : right
      console.log(123,largs, rargs)
    }
  }

  return node
}

// (a,(b,(c))) -> a,b,c
export function unbracket(node) {
  if (!Array.isArray(node)) return node
  if (node[0] === '(') return unbracket(node[1])
  return [node[0], ...node.slice(1).map(unbracket)]
}


// [,a[,b]] -> [,ab]
export function flatten(node) {
  if (!Array.isArray(node)) return node
  if (node[0] === ',') return [',', ...node.slice(1).flatMap(subnode => subnode[0]===',' ? subnode.slice(1) : [subnode])]
  return [node[0], ...node.slice(1).map(flatten)]
}