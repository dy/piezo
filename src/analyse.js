// analyser converts AST into IR, able to be compiled after
import parse from './parse.js';
import desugar from './desugar.js';

export default function analyze(tree) {
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
  tree = desugar(tree)
  let statements = tree[0] === ';' ? tree.slice(1) : [tree];

  const globalExpr = {
    // a,b,c;
    ','([,...members]) {
      for (let member of members) {
        if (typeof member === 'string') { if (!(member in ir.global)) (ir.global[member] = null) }
        // (a=1),(b=2),... eg. swizzles
        // FIXME: what must be here?
        else if (member[0]==='=') { if (!member[1].startsWith('~') && !(member[1] in ir.global)) (ir.global[member[1]] = null) }
        else throw Error(`Unknown member ${member}`)
      }
    },

    // a=b; a,b=b,c; a = () -> b
    '='([,left,right]) {
      // a = () -> b
      if (right[0] === '->') {
        // detect overload
        // if (ir.func[left]) throw Error(`Function \`${left}\` is already defined`)

        ;(ir.func[left] = analyzeFunc(right, ir)).name = left
      }
      // a = b,  a,b=1,2
      else {
        if (typeof left !== 'string' && left[0] !== ',') throw ReferenceError(`Invalid left-hand side assignment`)
        if (typeof left === 'string') ir.global[left] = right
        else left.map((id,i) => i && (ir.global[id] = right[i]))
      }
    },

    // @ 'math#sin', @ 'path/to/lib'
    '@'([,path]) {
      if (Array.isArray(path)) { if (path[0] === "'") path = path[1]; else throw Error('Bad path `' + path + '`') }
      let url = new URL('import:'+path)
      let {hash, pathname} = url
      ir.import[pathname] = hash ? hash.slice(1).split(',') : []
    },

    // a,b,c . x
    '.'(statement) {
      // a.b
      if (statement.length > 2) throw 'unimplemented'

      // a. or a,b,c.
      if (statement !== statements[statements.length-1]) throw Error('Export must be the last statement');
      // otherwise handle as regular assignment statement
      [,statement] = statement
      if (typeof statement === 'string') ir.global[statement] = null
      else globalExpr[statement[0]]?.(statement)
    }
  }

  // global-level transforms
  for (let statement of statements) {
    if (!statement) continue
    // a;b;
    if (typeof statement === 'string') ir.global[statement] = null
    // a??b
    else globalExpr[statement[0]]?.(statement)
  }

  genExports(statements[statements.length-1]);

  // parse exports from a (last) node statement
  function genExports([op, node]) {
    if (op!=='.') return

    // a;
    if (typeof node === 'string') ir.export[node] = extTypeOf(node)
    if (node[0]==='=') {
      // a=...;
      if (typeof node[1] === 'string') ir.export[node[1]] = extTypeOf(node[1])
      // a,b=...;
      else if (node[1][0] === ',') node[1].slice(1).map(item => (ir.export[item] = extTypeOf(item)))
    }
    // a,b or a=1,b=2
    else if (node[0]===',') node.forEach((item,i) => {
      if (!i) return
      if (typeof item === 'string') (ir.export[item] = extTypeOf(item))
      else if (item[0] === '=' && !item[1].startsWith('~')) ir.export[item[1]] = extTypeOf(item[1])
    })
  }

  // get external type of id
  function extTypeOf(id) {
    if (id in ir.func) return 'func'
    if (id in ir.global) return 'global'
    throw Error('Undefined `' + id + '`')
  }

  return ir
}

// maps node & analyzes function internals
export function analyzeFunc([,args, body], ir) {
  args = args?.[0]===',' ? args.slice(1) : args ? [args] : []

  // init args by name
  args.forEach(arg => args[arg] = {})

  let func = {
    args,
    local: {},
    state: {},
    body,
    return: body[0] === ';' ? body[body.length - 1] : body
  }

  const detectState = (node) => {
    if (!Array.isArray(node)) return

    let [op, ...args] = node

    // *a = init
    if (op === '*' && args.length === 1) func.state[args[0]] = true
    for (let arg of args) detectState(arg)
  }
  detectState(body)

  return func
}