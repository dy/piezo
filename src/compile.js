// compile source/ast/ir to WAST
import analyse from "./analyse.js"
import stdlib from "./stdlib.js"

export default ir => {
  if (typeof ir === 'string' || Array.isArray(ir)) ir = analyse(ir)
  let func, out = [], globals = {}, includes = []

  // serialize expression (depends on current ir, ctx)
  const expr = (node) => {
    // literal, like `foo`
    if (typeof node === 'string') {
      if (ir.global[node]) return `(global.get $${node})`
      if (func?.local[node] || func?.args[node]) return `(local.get $${node})`
      throw RangeError(`${node} is not defined`)
    }

    // another expression
    if (Array.isArray(node)) {
      let [op,...args] = node, [a,b] = args

      const opCmd = {'*':'mul','-':'sub','+':'add'}[op];

      // [-, [int, a]] -> (i32.const -a)
      if (op === '-' && !b && (a[0] === 'int' || a[0] === 'flt')) return expr([a[0], -a[1]])

      // a * b - make proper cast
      if (op === '+' || op === '*' || op === '-') {
        let aType = typeOf(a), bType = typeOf(b)
        if (aType === 'flt' && !b) return `(f64.neg ${expr(a)})`
        if (aType === 'int' && !b) { b = a, a = ['int',0] }
        if (aType === 'int' && bType === 'int') return `(i32.${opCmd} ${expr(a)} ${expr(b)})`
        if (aType === 'flt' && bType === 'flt') return `(f64.${opCmd} ${flt(expr(a))} ${flt(expr(b))})`
      }

      // a -< range - clamp a to indicated range
      if (op === '-<') {
        if (b[0] !== '..') throw Error('Only primitive ranges are supported for now')
        let aType = typeOf(a), [,min,max] = b,
            minType = typeOf(min), maxType = typeOf(max)
        if (aType === 'int' && minType === 'int' && maxType === 'int')
          return includes.push('$std/i32.smax', '$std/i32.smin'), `(call $std/i32.smax (call $std/i32.smin ${expr(a)} ${expr(max)}) ${expr(min)})`
        return `(f64.max (f64.min ${flt(expr(a))} ${flt(expr(max))}) ${flt(expr(min))})`
      }

      // number primitives: 1.0, 2 etc.
      if (op === 'flt') return `(f64.const ${a})`
      if (op === 'int') return `(i32.const ${a})`

      // a; b; c;
      if (op === ';') return args.map(arg => arg != null ? expr(arg) : '').join('\n')
    }

    throw 'Unimplemented operation ' + node[0]
  }

  // convert input expr to float expr
  function flt(str) {
    return str.startsWith('(f64.const') ? str :
      str.startsWith('(i32.const') ?
      str.replace('(i32.const','(f64.const') : `(f64.convert_i32_s ${str})`
  }

  // find result type of a node
  function typeOf(node) {
    let [op, a, b] = node
    if (op === 'int' || op === 'flt') return op
    if (op === '+' || op === '*' || op === '-') return !b ? typeOf(a) : (typeOf(a) === 'flt' || typeOf(b) === 'flt') ? 'flt': 'int'
    if (op === '-<') return typeOf(a) === 'int' && typeOf(b[1]) === 'int' && typeOf(b[2]) === 'int' ? 'int' : 'flt'
    return 'flt' // FIXME: likely not any other operation returns float
  }

  // 1. declare all functions
  for (let name in ir.func) {
    func = ir.func[name]
    let dfn = `func $${name}`
    dfn += ' ' + func.args.map(a=>`(param $${a} f64)`).join(' ')
    dfn += ' ' + '(result f64)' // TODO: detect result type properly
    dfn += `\n${expr(func.body)}`
    dfn += '\n(return)\n'

    out.push(`(${dfn})`)
  }

  // 2. include imports

  // 3. declare all globals
  for (let name in ir.global) {
    let dfn = ir.global[name]
    let node = `global $${name} `

    let dfnType = typeOf(dfn)

    // simple init
    if (dfn[0] === 'int') node += `i32 (i32.const ${dfn[1]})`
    else if (dfn[0] === 'flt') node += `f64 (f64.const ${dfn[1]})`
    // requires start init
    // TODO: may need detecting expression result type
    else if (dfnType === 'int') node += `(mut i32) (i32.const 0)`, globals[name] = dfn
    else node += `(mut f64) (f64.const 0)`, globals[name] = dfn

    out.push(`(${node})`)
  }

  // 3.1 init all globals in start
  if (Object.keys(globals).length) {
    out.push(`(start $module/init)`)
    let inits = []
    for (let name in globals) inits.push( `(global.set $${name} ${expr(globals[name])})` )
    out.push(`(func $module/init\n${inits.join('\n')}\n)`)
  }

  // 4. provide exports
  for (let name in ir.export) {
    out.push(`(export "${name}" (${ir.export[name]} $${name}))`)
  }

  // 0. declare includes
  for (let include of includes) {
    if (include in stdlib) out.unshift(stdlib[include])
  }
  console.log(out.join('\n'))

  return out.join('\n')
}
