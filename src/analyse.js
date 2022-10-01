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

  // [., ...statement] → [;, [., ...statement]]
  // if (tree[0] !== ';') tree = [';',tree]
  tmod[tree[0]](tree, ir)

  return ir
}

// module-level transforms
const tmod = {
  ';': ([,...statements], ir) => {
    for (let statement of statements) statement && tmod[statement[0]]?.(statement, ir)
  },

  // @ 'math#sin', @ 'path/to/lib'
  '@': ([,[,path]], ir) => {
    let url = new URL('import:'+path)
    let {hash, pathname} = url
    ir.import[pathname] = hash ? hash.slice(1).split(',') : []
  },

  // a = b., a() = b().
  '.': ([_,statement], ir) => {
    tmod[statement[0]]?.(statement, ir)
  },

  '=': (node, ir) => {
    let [,left,right] = node

    // a() = b
    if (left[0] === '(') {
      let [, name, args] = left

      args = args?.[0]===',' ? args.slice(1) : args ? [args] : []

      // init args by name
      args.forEach(arg => args[arg] = {})

      // detect overload
      if (ir.func[name]) throw Error(`Function \`${name}\` is already defined`)

      let fun = ir.func[name] = {
        name,
        args,
        local: {},
        state: {},
        body: [],
        output: []
      }

      // evaluate function body
      fun.body = mapNode(node, right, fun)
    }
    // a = b
    else {
      ir.global[left] = right
    }
  },
}

// maps node & analyzes internals
function mapNode(parent, node, fun) {
  let [op, ...args] = node

  // *a = init
  if (op === '*') {
    if (args.length === 1) {
      // detect state variables
      fun.state[args[0]] = parent[0] === '=' ? parent[2] : null
    }
  }

  // [a, b].
  // FIXME: detect output
  if (op === '[' && parent[0] === '.') {
    fun.output.push(...args)
  }

  return [op, ...args.map(arg => Array.isArray(arg) ? mapNode(node, arg, fun) : arg)]
}
