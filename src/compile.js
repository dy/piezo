// compile to WAST

const INT = 'i32', FLOAT = 'f64'

export default ir => {
  let out = []

  // 1. declare all functions
  for (let name in ir.func) {
    // TODO
  }

  // 2. include imports

  // 3. declare all globals
  let globals = {}
  for (let name in ir.global) {
    let dfn = ir.global[name]
    let node = `global $${name} `

    // simple init
    if (dfn[0] === 'int') node += `${INT} (${INT}.const ${dfn[1]})`
    else if (dfn[0] === 'float') node += `${FLOAT} (${FLOAT}.const ${dfn[1]})`
    // requires start init
    // TODO: may need detecting expression result type
    else node += FLOAT, globals[name] = dfn

    out.push(`(${node})`)
  }

  // 3.1 init all globals in start
  if (Object.keys(globals).length) {
    out.push(`(start $module/init)`)
    let inits = []
    for (let name in globals) inits.push( `(global.set $${name} ${expr(ir, globals[name])})` )

    out.push(`(func $module/init\n${inits.join('\n')}\n)`)
  }

  // 4. provide exports

  return out.join('\n')
}

// TODO: be able to serialize expression
const expr = (ir, node) => {
  // literal, like `foo`
  if (typeof node === 'string') {
    if (ir.global[node]) return `(global.get $${node})`
    throw RangeError(`${node} is not defined`)
  }

  // another expression
  if (Array.isArray(node)) {
    let [op, ...args] = node
    return edict[op]?.(ir, op, ...args) || ''
  }

  return node
}

// expressions mapping
const edict = {
  '*': (ir, op, a, b) => `(f64.mul ${expr(ir, a)} ${expr(ir, b)})`,
  'float': (ir, op, a) => `(f64.const ${expr(ir, a)})`
}
