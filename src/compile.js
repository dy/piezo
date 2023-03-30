// compile source/ast/ir to WAST
import analyse, { err, getResultType } from "./analyse.js"
import stdlib from "./stdlib.js"
import * as CONST from './const.js'

const F64_PER_PAGE = 8192;
const BYTES_PER_F64 = 8;
const TYPE = {
  [CONST.FLOAT]:'f64',
  [CONST.INT]:'i32',
  [CONST.PTR]:'i32',
  [CONST.FUNC]:'i32'
}

export default scope => {
  if (typeof scope === 'string' || Array.isArray(scope)) scope = analyse(scope)
  console.log(scope)

  let out = [], // output code stack
    inits = [], // start function initializers
    includes = [], // pieces to prepend
    exports = [], // pieces to export
    globals = [],
    memOffset = 0 // current used memory pointer (number of f64s)

  // process global instructions sequentially
  let [,...statements] = scope
  for (let statement of statements) {
    // direct elements
    if (typeof statement === 'string') {
      let name = statement, v = scope.vars[name]
      if (!globals.includes(name)) {
        const wtype = (TYPE[v.type]||TYPE[CONST.FLOAT])
        out.push(`(global $${name} ${v.mutable ? `(mut ${wtype})` : wtype} (${wtype}.const 0))`)
        globals.push(name)
      }
      else out.push(`(global.get $${name})`)
    }
    // imports
    else if (statement[0] === '@') {
      let [,lib, members] = statement
      for (let member of members) {
        console.log(member)
      }
    }
    // assignments - either global instructions or functions
    else if (statement[0] === '=') {
      let [,name,init] = statement,
          v = scope.vars[name], res,
          wtype = TYPE[v.type]||TYPE[CONST.FLOAT]

      // simple const globals init
      if (init[0] === 'int') res = `(global $${name} ${wtype} (${wtype}.const ${init[1]}))`
      else if (init[0] === 'flt') res = `(global $${name} ${wtype} (${wtype}.const ${init[1]}))`
      // global fn init
      else if (init[0] === '->') {
        let vars = Object.getOwnPropertyNames(init.vars)
        let dfn = `func $${name}`
        let [,...body] = init, last = body[body.length-1]

        // define params
        vars.filter(id=>scope.vars[id].arg).forEach(id => {
          dfn += ` (param $${id} ${v.type===CONST.PTR ? 'i32' : 'f64'})`
        })

        // TODO: detect result type properly
        dfn += ` (result ${TYPE[getResultType(last)]})\n`

        // define locals
        vars.filter(id=>!scope.vars[id].arg).forEach(id => {
          dfn += ` (local $${id} ${v.type===CONST.PTR ? 'i32' : 'f64'})`
        })

        // init body
        body.forEach(node => dfn += `\n` + expr(node))

        dfn += '\n(return)\n'
        out.push(`(${dfn})`)
      }
      // array init
      else if (v.type === CONST.PTR) {
        let memberInits = expr(init)
        res = `(global $${name} ${wtype} ${memberInits.pop()})`
        inits.push(...memberInits)
      }
      // other exression init
      // TODO: may need detecting expression result type
      else if (wtype == TYPE[CONST.INT]) {
        res = `(global $${name} (mut ${wtype}) (${wtype}.const 0))`
        globals.push(name)
        inits.push(`(global.set $${name} ${expr(init)})`)
      }
      else {
        res = `(global $${name} (mut ${wtype}) (${wtype}.const 0))`
        globals.push(name)
        inits.push(`(global.set $${name} ${expr(init)})`)
      }

      out.push(res)
    }
    else err('Unknown instruction `' + statement[0] + '`',statement)
  }

  // 3.1 init all globals in start
  if (inits.length) out.push(
    `(start $module/init)`,
    `(func $module/init\n${inits.join('\n')}\n)`
  )

  // 4. provide exports
  for (let name in exports) {
    out.push(`(export "${name}" (${exports[name]} $${name}))`)
  }

  // 5. declare includes
  for (let include of includes) {
    if (include in stdlib) out.unshift(stdlib[include])
  }

  // 6. declare memories
  if (memOffset) out.unshift(`(memory (export "memory") ${Math.ceil(memOffset / F64_PER_PAGE)})`)

  console.log(out.join('\n'))

  return out.join('\n')


  // serialize expression (depends on current ir, ctx)
  function expr (node) {
    // literal, like `foo`
    if (typeof node === 'string') {
      if (node in scope.vars) return `(global.get $${node})`
      if (func?.local[node] || func?.args[node]) return `(local.get $${node})`
      throw RangeError(`${node} is not defined`)
    }

    // another expression
    let [op,...args] = node, [a,b] = args

    const opCmd = {'*':'mul','-':'sub','+':'add'}[op];

    // [-, [int, a]] -> (i32.const -a)
    if (op === '-' && !b && (a[0] === 'int' || a[0] === 'flt')) return expr([a[0], -a[1]])

    // a * b - make proper cast
    if (op === '+' || op === '*' || op === '-') {
      let aType = getResultType(a, scope)
      if (aType === 'flt' && !b) return `(f64.neg ${expr(a)})`
      if (aType === 'int' && !b) { b = a, a = ['int',0] }
      let bType = getResultType(b, scope)
      if (aType === 'int' && bType === 'int') return `(i32.${opCmd} ${expr(a)} ${expr(b)})`
      return `(f64.${opCmd} ${fexpr(a)} ${fexpr(b)})`
    }

    // a -< range - clamp a to indicated range
    if (op === '-<') {
      if (b[0] !== '..') throw Error('Only primitive ranges are supported for now')
      let aType = getResultType(a, scope), [,min,max] = b,
          minType = getResultType(min, scope), maxType = getResultType(max, scope)
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

    throw 'Unimplemented operation ' + node[0]
  }

  // convert input expr to float expr
  function fexpr(node) {
    if (node[0] === 'flt' || node[0] === 'int') return `(f64.const ${node[1]})`

    let type = getResultType(node, scope)
    if (type === 'flt') return expr(node)

    return `(f64.convert_i32_s ${expr(node)})`
  }

  // arrays are floats for now, returns pointer of the head
  function alloc(size) {
    let len = memOffset
    memOffset += size
    return len
  }

}
