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
    range: {} // is that needed?
  }

  // [., ...statement] → [;, [., ...statement]]
  // if (tree[0] !== ';') tree = [';',tree]

  tm[tree[0]](tree, ir)

  return ir
}

// module-level transforms
const tm = {
  ';': ([,...statements], ir) => {
    for (let statement of statements) tm[statement[0]]?.(statement, ir)
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
    tm[statement[0]]?.(statement, ir)
  },

  '=': ([,left,right], ir) => {
    // a() = b
    if (left[0] === '(') {
      let [, name, args] = left
      console.log(name, args)
      ir.func[name] = {
        name,
        args: args[0]===',' ? args : args ? [args] : [],
        state: [],
        output: null
      }
    }
    // a = b
    else {
      ir.global[left] = right
    }
  },

}

// function-level transforms
const tf = {
  ';'(){}
}
