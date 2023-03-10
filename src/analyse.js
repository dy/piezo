// analyser converts AST into IR, able to be compiled after

export default tree => {
  // language-level sections
  // `type` section is built on stage of WAT compiling
  // `memory`/`table` sections are covered by arrays
  // intermediate module representation
  let ir = {
    func: {},
    export: {},
    import: {},
    global: {},
    data: {},
    range: {}
  }

  if (tree[0] !== ';') tree = [';',tree]
  globalTr[tree[0]](tree, ir)

  return ir
}

// global-level transforms
const globalTr = {
  ';': ([,...statements], ir) => {
    for (let statement of statements) statement && globalTr[statement[0]]?.(statement, ir)

    // provide exports
    let last = statements[statements.length - 1]
    if (typeof last === 'string') ir.export[last] = true
    if (last[0]==='=') {
      if (typeof last[1] === 'string') ir.export[last[1]] = true
      else if (last[1][0] === ',') last[1].slice(1).map(item => (ir.export[item] = true))
    }
    else if (last[0]===',') last.slice(1).map(item => ir.export[item] = true)
  },

  // @ 'math#sin', @ 'path/to/lib'
  '@': ([,[,path]], ir) => {
    let url = new URL('import:'+path)
    let {hash, pathname} = url
    ir.import[pathname] = hash ? hash.slice(1).split(',') : []
  },

  // a = b., a() = b().
  '.': ([_,statement], ir) => {
    globalTr[statement[0]]?.(statement, ir)
  },

  '=': (node, ir) => {
    let [,left,right] = node

    // a = () -> b
    if (right[0] === '->') {
      let name = left, [, args, body] = right

      if (args[0]==='(') [,args] = args
      args = args?.[0]===',' ? args.slice(1) : args ? [args] : []

      // init args by name
      // args.forEach(arg => args[arg] = {})

      // detect overload
      // if (ir.func[name]) throw Error(`Function \`${name}\` is already defined`)

      // flatten body
      if (body[0] === '(') body = body[1]

      let fn = ir.func[name] = {
        name,
        args,
        local: {},
        state: {},
        body,
        return: body[0] === ';' ? body[body.length - 1] : body
      }
      analyzeExpr(null, fn.body, fn)
    }
    // a = b
    else {
      if (typeof left !== 'string' && left[0] !== ',') throw ReferenceError(`Invalid left-hand side assignment`)
      ir.global[left] = right
    }
  },
}

// maps node & analyzes internals
function analyzeExpr(parent, node, fn) {
  let [op, ...args] = node

  // *a = init
  if (op === '*') {
    if (args.length === 1) {
      // detect state variables
      fn.state[args[0]] = parent[0] === '=' ? parent[2] : null
    }
  }

  return [op, ...args.map(arg => Array.isArray(arg) ? analyzeExpr(node, arg, fn) : arg)]
}
