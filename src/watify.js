// convert sonr source to wat source

const transform = {
  ';': (statements, root=true) => {
    if (root) return ['module', ...statements.map(n => t(n, true))]
      // wat doesn't require special order of declarations
      // return ['module', types, imports, functions, tables, memorys, globals, exports, starts, elements, codes, datas]
  },

  '=': ([op, left, right], root) => {
    // a(x) = b → (func params, body)
    if (left[0] === '(') {
      let [_, fnName, params] = left,
          body = right[0] !== '(' ? [right] : t(right)

      params = params[0] === ',' ? params.slice(1) : params ? [params] : []

      return ['func', fnName, ...params.map(name => ['param', name, 'f64']), ...body]
    }
  },

  '.': ([_, statement], root=true) => {
    if (root) return [
      'module',
      statement = t(statement, true),
      statement[0]==='func' && ['export', statement[1], statement.slice(0,2)]
    ]
  },

  '': () => {

  }
}

const t = (node, ...args) => {
  return transform[node[0]](node, ...args)
}

export default t

