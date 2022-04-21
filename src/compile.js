import watr from 'watr'

// convert sonr source to wat source

// module-level parser
const transformModule = node => {
  //a. → //a.;
  if (node[0] !== ';') node = [';', node]
  let [_, ...nodes] = node

  let exports = [], toExport = new Set(), functions = [], globals = []

  // unmap & handle explicit exports
  nodes = nodes.filter(Boolean).map(node => {
    if (node[0] !== '.') return node
    let def = node[1]

    // a,b,c.
    if (def[0] === ',') def.slice(1).map(name => toExport.add(name))

    else if (def[0] === '=') {
      let l = def[1]
      // a(x)=b.
      if (l[0] === '(') toExport.add(l[1])

      // a,b,c=d.
      else if (l[0] === ',') def.slice(1).map(name => toExport.add(name))

      // a=b.
      else if (!Array.isArray(l)) toExport.add(l)

      else throw SyntaxError('Unknown definintion', def)
    }

    return def
  })

  // collect functions
  for (let node of nodes) {
    let [op, l, r] = node
    // a(x) = b → (func params, body)
    if (op === '=') {
      if (l[0] === '(') {
        let [_,fnName,params] = l
        functions.push(transformFunction(fnName, params, r))
        if (toExport.has(fnName)) toExport.delete(fnName), exports.push(['export', fnName, ['func', fnName]])
      }
    }
  }

  if (toExport.size) throw SyntaxError('Exporting unknown ' + [...toExport.entries()].map(e => e[1]).join(', '))

  return ['module', ...functions, ...exports]
};

const transformFunction = (fnName, params, nodes) => {
  // =b, =(a+b.), =(a+b;b.)
  nodes = nodes[0] === '(' ?  nodes[1][0] === ';' ? nodes[1].slice(1) : [nodes[1]] : [nodes]
  params = params[0] === ',' ? params.slice(1) : params ? [params] : []

  let body = []
  for (let node of nodes) {
    body.push(t(node))
  }

  return ['func', fnName, ...params.map(name => ['param', name, 'f64']), ['result', 'f64'], ...body]
}

// function-level operators
const transform = {
  ';': ([_, ...statements], ctx) => {

  },

  '=': ([op, l, r]) => {

  },

  '.': ([_, statement]) => { throw SyntaxError('End operator . cannot be nested') },

  '*': ([op, l, r]) => ['f64.mul', t(l), t(r)]
}

const t = (node, ctx) => Array.isArray(node) ? transform[node[0]](node, ctx) : ['local.get', node]


export default transformModule
