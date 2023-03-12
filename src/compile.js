// compile source/ast/ir to WAST
import analyse from "./analyse.js"
import { INT, FLOAT } from "./const.js"

export default ir => {
  if (typeof ir === 'string' || Array.isArray(ir)) ir = analyse(ir)
  let func, out = [], globals = {}

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
      // a * b - make proper cast
      if (op === '+' || op === '*') {
        let aType = typeOf(a), bType = typeOf(b)
        if (aType === 'int' && bType === 'int') return `(i32.mul ${expr(a)} ${expr(b)})`
        if (aType === 'flt' && bType === 'flt') return `(f64.mul ${expr(a)} ${expr(b)})`
        if (aType === 'int') return `(f64.mul (f64.convert_i32_s ${expr(a)}) ${expr(b)})`
        return `(f64.mul ${expr(a)} (f64.convert_i32_s ${expr(b)}))`
      }

      // number primitives: 1.0, 2 etc.
      if (op === 'flt') return `(f64.const ${a})`
      if (op === 'int') return `(i32.const ${a})`

      // a; b; c;
      if (op === ';') return args.map(arg => arg != null ? expr(arg) : '').join('\n')
    }

    return node
  }

  // find result type of a node
  function typeOf(node) {
    let [op, a, b] = node
    if (op === 'int' || op === 'flt') return op
    if (op === '+' || op === '*') return (typeOf(a) === 'flt' || typeOf(b) === 'flt' ? 'flt': 'int')
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

    // simple init
    if (dfn[0] === 'int') node += `${INT} (${INT}.const ${dfn[1]})`
    else if (dfn[0] === 'flt') node += `${FLOAT} (${FLOAT}.const ${dfn[1]})`
    // requires start init
    // TODO: may need detecting expression result type
    else node += `(mut ${FLOAT}) (${FLOAT}.const 0)`, globals[name] = dfn

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

  return out.join('\n')
}
