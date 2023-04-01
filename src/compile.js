// compile source/ast/ir to WAST
import analyse, { err, getResultType } from "./analyse.js"
import stdlib from "./stdlib.js"
import {FLOAT,INT,RANGE,PTR,FUNC} from './const.js'

const F64_PER_PAGE = 8192;
const BYTES_PER_F64 = 8;

export default function compile(scope) {
  if (typeof scope === 'string' || Array.isArray(scope)) scope = analyse(scope)
  console.log('compile',scope)

  let out = [], // output code stack
    inits = [], // start function initializers
    includes = [], // pieces to prepend
    globals = [],
    memOffset = 0 // current used memory pointer (number of f64s)

  // process global instructions sequentially
  let [,...statements] = scope
  for (let statement of statements) {
    // imports
    if (statement[0] === '@') {
      let [,lib, members] = statement
      for (let member of members) {
        console.log('TODO',member)
      }
    }
    // assignments or just instructions
    else if (statement[0] === '=' || typeof statement === 'string') globalExpr(statement)
    // sequence applies on members
    else if (statement[0] === ',') {
      let [,...members] = statement
      for (let member of members) globalExpr(member)
    }
    else err('Unknown instruction `' + statement[0] + '`',statement)
  }

  function globalExpr(statement) {
    // a; - just declare
    if (typeof statement === 'string') {
      let name = statement, v = scope.vars[name]
      if (!globals.includes(name)) {
        if (v.type === INT || v.type === PTR) out.push(`(global $${name} ${v.mutable ? `(mut i32)` : `i32`} (i32.const 0))`)
        else out.push(`(global $${name} ${v.mutable ? `(mut f64)` : `f64`} (f64.const 0))`)
        globals.push(name)
      }
      return
    }

    let [,name,init] = statement

    // [size]x
    if (name[0] === '[') name = name[2]
    let v = scope.vars[name]

    // simple const globals init
    if (init[0] === 'int')
      globals.includes(name) ? inits.push(`(global.set $${name} (i32.const ${init[1]}))`) : out.push(`(global $${name} i32 (i32.const ${init[1]}))`)
    else if (init[0] === 'flt')
      globals.includes(name) ? inits.push(`(global.set $${name} (f64.const ${init[1]}))`) : out.push(`(global $${name} f64 (f64.const ${init[1]}))`)
    // global fn init
    else if (init[0] === '->') {
      let parent = scope
      scope = init
      let vars = Object.getOwnPropertyNames(scope.vars)
      let dfn = `func $${name}`, last = scope[scope.length-1]

      // define params
      vars.filter(id=>scope.vars[id].arg).forEach(id => {
        dfn += ` (param $${id} ${v.type===PTR ? 'i32' : 'f64'})`
      })

      // TODO: detect result type properly
      dfn += ` (result ${getResultType(last, scope.vars) == FLOAT ? 'f64' : 'i32'})\n`

      // define locals
      vars.filter(id=>!scope.vars[id].arg).forEach(id => {
        dfn += ` (local $${id} ${v.type===PTR ? 'i32' : 'f64'})`
      })

      // init body
      scope.slice(1).forEach(node => dfn += `\t` + expr(node))
      scope = parent

      dfn += '\n\t(return)\n'
      out.push(`(${dfn})`)
    }
    // array init
    else if (v.type === PTR) {
      let memberInits = expr(init)
      if (!globals.includes(name)) out.push(`(global $${name} i32 ${memberInits.pop()})`)
      else inits.push(`(global.set $${name} ${memberInits.pop()})`)
      inits.push(...memberInits)
    }
    // other exression init
    // TODO: may need detecting expression result type
    else if (v.type == INT) {
      out.push(`(global $${name} (mut i32) (i32.const 0))`)
      inits.push(`(global.set $${name} ${expr(init)})`)
    }
    else {
      out.push(`(global $${name} (mut f64) (f64.const 0))`)
      inits.push(`(global.set $${name} ${expr(init)})`)
    }

    globals.push(name)
  }

  // Init all globals in start
  if (inits.length) out.push(
    `(start $module/init)`,
    `(func $module/init\n${inits.join('\n')}\n)`
  )

  // Provide exports
  let exportDfn = ``
  for (let name in scope.vars) {
    let v = scope.vars[name]
    if (v.export) exportDfn += `(export "${name}" (${v.type === FUNC ? 'func' : 'global'} $${name}))`
  }
  if (exportDfn) out.push(exportDfn)

  // Declare includes
  for (let [lib,member] of includes) out.unshift(stdlib[lib][member])

  // Declare memories
  if (memOffset) out.unshift(`(memory (export "memory") ${Math.ceil(memOffset / F64_PER_PAGE)})`)

  console.log(out.join('\n'))

  return out.join('\n')

  // serialize expression (depends on current ir, ctx)
  function expr (node) {
    // literal, like `foo`
    if (typeof node === 'string') return `(${scope.vars[node].global?'global':'local'}.get $${node})`

    // another expression
    let [op,...args] = node, [a,b] = args

    const opCmd = {'*':'mul','-':'sub','+':'add'}[op];

    // [-, [int, a]] -> (i32.const -a)
    if (op === '-' && !b && (a[0] === 'int' || a[0] === 'flt')) return expr([a[0], -a[1]])

    // a * b - make proper cast
    if (op === '+' || op === '*' || op === '-') {
      let aType = getResultType(a,scope.vars), bType = getResultType(b,scope.vars);
      if (aType === FLOAT && !b) return `(f64.neg ${expr(a)})`
      if (aType === INT && !b) { b = a, a = ['int',0] }
      if (aType === INT && bType === INT) return `(i32.${opCmd} ${expr(a)} ${expr(b)})`
      return `(f64.${opCmd} ${fexpr(a)} ${fexpr(b)})`
    }

    // a -< range - clamp a to indicated range
    if (op === '-<') {
      if (b[0] !== '..') throw Error('Only primitive ranges are supported for now')
      let aType = getResultType(a, scope.vars), [,min,max] = b,
          minType = getResultType(min, scope.vars), maxType = getResultType(max, scope.vars)
      if (aType === INT && minType === INT && maxType === INT)
        return includes.push(['std','i32.smax'], ['std','i32.smin']), `(call $std/i32.smax (call $std/i32.smin ${expr(a)} ${expr(max)}) ${expr(min)})`
      return `(f64.max (f64.min ${fexpr(a)} ${fexpr(max)}) ${fexpr(min)})`
    }

    // number primitives: 1.0, 2 etc.
    if (op === 'flt') return `(f64.const ${a})`
    if (op === 'int') return `(i32.const ${a})`

    // a; b; c;
    if (op === ';') return args.map(arg => arg != null ? expr(arg) : '')

    // [1,2,3]
    if (op === '[') {
      let members = !args.length ? [] : args[0][0] === ',' ? args[0].slice(1) : args
      let offset = node.offset = alloc(members.length)
      let res = []
      for (let i = 0; i < members.length; i++) {
        res.push(`(f64.store (i32.const ${offset + i*BYTES_PER_F64}) ${fexpr(members[i])})`)
      }
      // store memory ptr as last op
      res.push(`(i32.const ${offset})`)

      return res
    }

    // a = b
    if (op === '=') {
      let v = scope.vars[a]
      // FIXME: b here can contain paren scope, then it's going to be messy - it needs to take only result
      return `(${v.global?'global':'local'}.set $${a} ${expr(b)})`
    }

    throw 'Unimplemented operation ' + node[0]
  }

  // convert input expr to float expr
  function fexpr(node) {
    if (node[0] === 'flt' || node[0] === 'int') return `(f64.const ${node[1]})`

    let type = getResultType(node, scope.vars)
    if (type === FLOAT) return expr(node)

    return `(f64.convert_i32_s ${expr(node)})`
  }

  // arrays are floats for now, returns pointer of the head
  function alloc(size) {
    let len = memOffset
    memOffset += size
    return len
  }
}
