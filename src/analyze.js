export default (tree) => {
  let functions = {}, exports = {}

  const analyze = {
    module(node) {
      let statements, op

      if (node[0] === ';') [op,...statements] = node
      else statements = [node]

      statements.forEach(this.statement)

      return { functions, exports }
    },

    statement(node) {
      let isExported = false
      if (node[0] === '.') {
        isExported = true
        node = node[1]
      }

      // collect function definitions
      if (node[0] === '=' && node[1][0] === '(') {
        let [_, name, list] = node[1]
        let args = analyze.list(list)
        let fnBody = analyze.block(node[2])

        ;(functions[name] ||= []).push({
          args,
          body: fnBody,
          // if input or output argument is block
          processor: args.some(arg=>arg[0]==='[') || fnBody.slice(-1)[0] === '['
        })

        if (isExported) exports[name] = 'function'
      }
    },

    list(node) {
      let list, _
      if (node[0] === ',') [_, ...list] = node
      else if (node) list = [node]
      else list = []
      return list
    },

    block(node) {
      let statements
      // (a, b, c)
      if (node[0] === '(') [_, ...statements] = node
      else statements = [node]
      return statements
    }
  }

  return analyze.module(tree)
}

