// analyser converts AST into IR, able to be compiled after
import { INT, FLOAT } from './const.js';
import parse from './parse.js';
import desugar from './desugar.js';

export default tree => {
  if (typeof tree === 'string') tree = parse(tree)

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
  // convert single-entry into a finished expression
  if (tree[0] !== ';') tree = [';',tree]
  tree = desugar(tree)

  // global-level transforms
  const globalTr = {
    ';': ([,...statements]) => {
      for (let statement of statements) statement && globalTr[statement[0]]?.(statement)
    },

    // @ 'math#sin', @ 'path/to/lib'
    '@': ([,[,path]]) => {
      let url = new URL('import:'+path)
      let {hash, pathname} = url
      ir.import[pathname] = hash ? hash.slice(1).split(',') : []
    },

    // a = b., a() = b().
    '.': ([_,statement]) => {
      globalTr[statement[0]]?.(statement)
    },

    '=': (node) => {
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
      // a = b,  a,b=1,2
      else {
        if (typeof left !== 'string' && left[0] !== ',') throw ReferenceError(`Invalid left-hand side assignment`)
        console.log(left, right)
        // FIXME: swizzle h
        ir.global[left] = right
      }
    },
  }

  globalTr[tree[0]](tree)
  genExports(tree[tree.length - 1]);

  // parse exports from a (last) node statement
  function genExports(node) {
    // a;
    if (typeof node === 'string') ir.export[node] = typeOf(node)
    if (node[0]==='=') {
      // a=...;
      if (typeof node[1] === 'string') ir.export[node[1]] = typeOf(node[1])
      // a,b=...;
      else if (node[1][0] === ',') node[1].slice(1).map(item => (ir.export[item] = typeOf(item)))
    }
    // a,b;
    else if (node[0]===',') node.slice(1).map(item => ir.export[item] = typeOf(item))
  }

  // get ty
  function typeOf(id) {
    if (ir.func[id]) return 'func'
    if (ir.global[id]) return 'global'
    throw Error('Unknown type of `' + id + '`')
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

  return ir
}