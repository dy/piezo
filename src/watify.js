// convert sonr source to wat source

// function-level operators
const transform = {
  ';': ([_, ...statements], ctx) => {
      // wat doesn't require special order of declarations
      // return ['module', types, imports, functions, tables, memorys, globals, exports, starts, elements, codes, datas]
  },

  '=': ([op, l, r]) => {

  },

  '.': ([_, statement]) => {
    return ['return', statement]
  },

  '*': ([op, l, r]) => ['f64.mul', l, r]
}

const t = (node, ...args) => transform[node[0]](node, ...args)

// module-level parser
export default node => {
  //a. → //a.;
  if (node[0] === '.') node = [';', node]
  let [_, ...nodes] = node

  let statements = [], exports = []

  for (let node of nodes.filter(Boolean)) {
    // a. → (export a)
    let exported = false
    if (node[0] === '.') node = node[1], exported = true

    let [op, l, r] = node
    // a(x) = b → (func params, body)
    if (op === '=') {
      if (l[0] === '(') {
        let [_, fnName, params] = l,
            // =b, =(a+b.), =(a+b;b.)
            body = r[0] === '(' ?  r[1][0] === ';' ? r[1].slice(1) : [r[1]] : [r]

        params = params[0] === ',' ? params.slice(1) : params ? [params] : []

        statements.push(['func', fnName, ...params.map(name => ['param', name, 'f64']), ...body.map(t)])

        if (exported) exports.push(['export', fnName, ['func', fnName]])
      }
    }
  }

  return ['module', ...statements, ...exports]
};

