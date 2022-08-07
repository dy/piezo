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
  let start = {}
  for (let name in ir.global) {
    let dfn = ir.global[name]
    let node = `global $${name} `

    // simple init
    if (dfn[0] === 'int') node += `${INT} (${INT}.const ${dfn[1]})`
    else if (dfn[0] === 'float') node += `${FLOAT} (${FLOAT}.const ${dfn[2]})`
    // requires start init
    // TODO: may need detecting expression result type
    else node += FLOAT, start[name] = dfn

    out.push(`(${node})`)
  }

  // 3.1 init all globals in start
  if (Object.keys(start).length) {
    out.push(`(start $module/init)`)
    let inits = []
    for (let name in start) inits.push( `(global.set $${name} ${expr(start[name])})` )
    out.push(`(func $module/init\n${inits.join('\n')})`)
  }

  // 4. provide exports

  return out.join('\n')
}

// TODO: be able to serialize expression
const expr = nodes => {
  return `expr`
}
