// compile source/ast/ir to WAST
import analyse, {typeOf} from "./analyse.js"
import stdlib from "./stdlib.js"

const F64_PER_PAGE = 8192;
const BYTES_PER_F64 = 8;

export default ir => {
  if (typeof ir === 'string' || Array.isArray(ir)) ir = analyse(ir)
  let func,
    out = [], // output code stack
    inits = [], // start function initiali
    includes = [], // external libs code to prepend
    memOffset = 0 // current used memory pointer (number of f64s)

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
        let aType = typeOf(a)
        if (aType === 'flt' && !b) return `(f64.neg ${expr(a)})`
        if (aType === 'int' && !b) { b = a, a = ['int',0] }
        let bType = typeOf(b)
        if (aType === 'int' && bType === 'int') return `(i32.${opCmd} ${expr(a)} ${expr(b)})`
        return `(f64.${opCmd} ${fexpr(a)} ${fexpr(b)})`
      }

      // a -< range - clamp a to indicated range
      if (op === '-<') {
        if (b[0] !== '..') throw Error('Only primitive ranges are supported for now')
        let aType = typeOf(a), [,min,max] = b,
            minType = typeOf(min), maxType = typeOf(max)
        if (aType === 'int' && minType === 'int' && maxType === 'int')
          return includes.push('$std/i32.smax', '$std/i32.smin'), `(call $std/i32.smax (call $std/i32.smin ${expr(a)} ${expr(max)}) ${expr(min)})`
        return `(f64.max (f64.min ${fexpr(a)} ${fexpr(max)}) ${fexpr(min)})`
      }

      // number primitives: 1.0, 2 etc.
      if (op === 'flt') return `(f64.const ${a})`
      if (op === 'int') return `(i32.const ${a})`

      // a; b; c;
      if (op === ';') return args.map(arg => arg != null ? expr(arg) : '')

      // [1,2,3]
      if (op === '[') {
        let members = args[0][0] === ',' ? args[0].slice(1) : args
        let offset = node.offset = alloc(members.length)
        let res = []
        for (let i = 0; i < members.length; i++) {
          res.push(`(f64.store (i32.const ${offset + i*BYTES_PER_F64}) ${fexpr(members[i])})`)
        }
        res.push(`(i32.const ${offset})`)

        return res
      }
    }

    throw 'Unimplemented operation ' + node[0]
  }

  // convert input expr to float expr
  function fexpr(node) {
    if (node[0] === 'flt' || node[0] === 'int') return `(f64.const ${node[1]})`

    let type = typeOf(node)
    if (type === 'flt') return expr(node)

    return `(f64.convert_i32_s ${expr(node)})`
  }

  // arrays are floats for now, returns pointer of the head
  function alloc(size) {
    let len = memOffset
    memOffset += size
    return len
  }

  // 1. declare all functions
  for (let name in ir.func) {
    func = ir.func[name]
    let dfn = `func $${name}`
    dfn += ' ' + func.args.map(a=>`(param $${a} f64)`).join(' ')
    dfn += ' ' + '(result f64)' // TODO: detect result type properly
    let statements = expr(func.body)
    dfn += `\n${statements.join ? statements.join('\n') : statements}`
    dfn += '\n(return)\n'

    out.push(`(${dfn})`)
  }

  // 2. include imports

  // 3. declare all globals
  for (let name in ir.global) {
    let dfn = ir.global[name], node
    let dfnType = typeOf(dfn)

    // simple const globals init
    if (dfn[0] === 'int') node = `(global $${name} i32 (i32.const ${dfn[1]}))`
    else if (dfn[0] === 'flt') node = `(global $${name} f64 (f64.const ${dfn[1]}))`
    // array init
    else if (dfnType === 'ptr') {
      let memberInits = expr(dfn)
      node = `(global $${name} i32 ${memberInits.pop()})`
      inits.push(...memberInits)
    }
    // other exression init
    // TODO: may need detecting expression result type
    else if (dfnType === 'int') node = `(global $${name} (mut i32) (i32.const 0))`, inits.push(`(global.set $${name} ${expr(dfn)})`)
    else node = `(global $${name} (mut f64) (f64.const 0))`, inits.push(`(global.set $${name} ${expr(dfn)})`)

    out.push(node)
  }

  // 3.1 init all globals in start
  if (inits.length) out.push(
    `(start $module/init)`,
    `(func $module/init\n${inits.join('\n')}\n)`
  )

  // 4. provide exports
  for (let name in ir.export) {
    out.push(`(export "${name}" (${ir.export[name]} $${name}))`)
  }

  // 5. declare includes
  for (let include of includes) {
    if (include in stdlib) out.unshift(stdlib[include])
  }

  // 6. declare memories
  if (memOffset) out.unshift(`(memory (export "memory") ${Math.ceil(memOffset / F64_PER_PAGE)})`)


  // console.log(out.join('\n'))

  return out.join('\n')
}
