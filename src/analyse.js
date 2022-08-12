export default tree => {
  // language-level sections
  // `type` section is built on stage of WAT compiling
  // `memory`/`table` sections are covered by arrays
  //
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
  '.': ([,statement], ir) => {
    // TODO: ir.export
    tmod[statement[0]]?.(statement, ir)
  },

  '=': ([,left,right], ir) => {
    // a() = b
    if (left[0] === '(') {
      let [, name, args] = left

      // FIXME: make more meaningful arguments
      args = args[0]===',' ? args : args ? [args] : []

      let fun = ir.func[name] = {
        name,
        args,
        local: {},
        state: {},
        body: [],
        output: {}
      }

      // evaluate function body
      tfun[right[0]](right, fun)
    }
    // a = b
    else {
      ir.global[left] = right
    }
  },

}

// function-level transforms
const tfun  = {
  ';'([,...statements], fun){
    fun.body.push(...statements)
  },

  '('([,...statements], fun){
    // (a;b;c)
    if (Array.isArray(statements) && statements[0][0] === ';') {
      tfun[';'](statements[0], fun)
    }
  }
}
