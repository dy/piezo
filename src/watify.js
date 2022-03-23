// convert sonr source to wat source

// module-level parser
const transformModule = node => {
  //a. → //a.;
  if (node[0] !== ';') node = [';', node]
  let [_, ...nodes] = node

  let statements = [], exports = []

  for (let node of nodes.filter(Boolean)) {
    // ∀. → (export ∀)
    let exported = false
    if (node[0] === '.') node = node[1], exported = true

    let [op, l, r] = node
    // a(x) = b → (func params, body)
    if (op === '=') {
      if (l[0] === '(') {
        let [_,fnName,params] = l
        statements.push(transformFunction(fnName, params, r))
        if (exported) exports.push(['export', fnName, ['func', fnName]])
      }
    }
  }

  return ['module', ...statements, ...exports]
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
      // wat doesn't require special order of declarations
      // return ['module', types, imports, functions, tables, memorys, globals, exports, starts, elements, codes, datas]
  },

  '=': ([op, l, r]) => {

  },

  '.': ([_, statement]) => { throw SyntaxError('End operator . cannot be nested') },

  '*': ([op, l, r]) => ['f64.mul', t(l), t(r)]
}

const t = (node, ctx) => Array.isArray(node) ? transform[node[0]](node, ctx) : ['local.get', node]


export default transformModule
