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
      fun.body = tfun[right[0]](right, fun)
    }
    // a = b
    else {
      ir.global[left] = right
    }
  },

}

const _op = Symbol('default_op')

// function-level transforms
// FIXME: there's big deal of duplication going on
const tfun  = {
  ';'([,...statements], ir_func){
    // a=1; b=2; ...
    return [';', statements.map( expr => (Array.isArray(expr) ? (tfun[expr[0]] || tfun[_op])(expr, ir_func) : expr) )]
  },

  '('([,...statements], ir_func){
    // (a...)
    if (Array.isArray(statements) && statements[0][0] === ';') {
      // FIXME: does that just unwrap braces? why?
      return tfun[';'](statements[0], ir_func)
    }
    // sin(phase) as [(, sin, phase]
    return ['(', statements.map( expr => (Array.isArray(expr) ? (tfun[expr[0]] || tfun[_op])(expr, ir_func) : expr) )]
  },

  '*'([,...args], ir_func) {
    // *a = 1;
    if (args.length === 1) {
      // detect state variables
      ir_func.state[args[0]] = null
      return ['*', args[0]]
    }

    return ['*', ...args.map( expr => (Array.isArray(expr) ? (tfun[expr[0]] || tfun[_op])(expr, ir_func) : expr)  )]
  },

  // default operator, like a=b+1
  [_op]([op, ...args], ir_func) {
    return [op, ...args.map( expr => (Array.isArray(expr) ? (tfun[expr[0]] || tfun[_op])(expr, ir_func) : expr) )]
  }
}
