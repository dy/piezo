// convert sonr source to wat source
const transform = {
  ';': ([_, ...statements], ctx) => {
    if (ctx?.root) return ['module', ...statements.filter(Boolean).map(n => t(n, {root:true}))]
      // wat doesn't require special order of declarations
      // return ['module', types, imports, functions, tables, memorys, globals, exports, starts, elements, codes, datas]
  },

  '=': ([op, l, r]) => {
    // a(x) = b → (func params, body)
    if (l[0] === '(') {
      let [_, fnName, params] = l,
          // =b, =(a+b.), =(a+b;b.)
          body = r[0] === '(' ?  r[1][0] === ';' ? r[1].slice(1) : [r[1]] : [r]

      params = params[0] === ',' ? params.slice(1) : params ? [params] : []

      return ['func', fnName, ...params.map(name => ['param', name, 'f64']), ...body.map(t)]
    }
  },

  '.': ([_, statement], ctx) => {
    if (ctx?.root) return [
      'module',
      statement = t(statement, {root:true}),
      statement[0]==='func' && ['export', statement[1], statement.slice(0,2)]
    ]
    return ['return', statement]
  },

  '*': ([op, l, r]) => ['f64.mul', l, r]
}

const t = (node, ...args) => {
  return transform[node[0]](node, ...args)
}

export default node => t(node, {root: true});

