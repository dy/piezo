// compile source/ast/ir to WAST
import analyse, { err, desc } from "./analyse.js"
import stdlib from "./stdlib.js"
import {FLOAT,INT,RANGE,PTR,FUNC} from './const.js'

const F64_PER_PAGE = 8192;
const BYTES_PER_F64 = 8;

export default function compile(node) {
  if (typeof node === 'string' || Array.isArray(node)) node = analyse(node)
  console.log('compile',node)

  let out = [], // output code stack
    inits = [], // start function initializers
    includes = [], // pieces to prepend
    memcount = 0, // current used memory pointer (number of f64s)
    scope = node.scope // current scope

  // processess global statements, returns nothing, only modifies globals, inits, out, memory
  function gexpr(statement) {
    // a; - just declare
    if (typeof statement === 'string') {
      let name = statement, v = scope[name]
      if (!v.defined) {
        if (v.type === INT || v.type === PTR) (v.global?out:inits).push(`(${v.global?'global':'local'} $${name} ${v.mutable ? `(mut i32)` : `i32`} (i32.const 0))`)
        else (v.global?out:inits).push(`(${v.global?'global':'local'} $${name} ${v.mutable ? `(mut f64)` : `f64`} (f64.const 0))`)
        v.defined = true
      }
    }
    else if (statement[0]===';'||statement[0]===',') for (let s of statement.slice(1)) gexpr(s)
    else if (statement[0]==='(') {
      let parent = scope
      scope = statement.scope
      gexpr(statement[1])
      scope = parent
    }
    else if (statement[0]==='=') {
      let [,name,init] = statement, v = scope[name]

      // [size]x
      if (name[0] === '[') name = name[2]

      if (init[0] === INT) {
        if (!v.defined)
          v.global ? out.push(`(global $${name} (mut i32) (i32.const 0))`) : inits.push(`(local $${name} i32)`)
          inits.push(`(${v.global?'global':'local'}.set $${name} (i32.const ${init[1]}))`)

      }
      else if (init[0] === FLOAT) {
        if (!v.defined)
          v.global ? out.push(`(global $${name} (mut f64) (f64.const 0))`) : inits.push(`(local $${name} f64)`)
          inits.push(`(${v.global?'global':'local'}.set $${name} (f64.const ${init[1]}))`)
      }
      else if (init[0] === '[') {
        // FIXME: maybe we better off with alloc/free here instead, than forcing local mem use
        if (!v.defined) (v.global?out:inits).push(`(${v.global?'global':'local'} $${name} i32 (i32.const ${memcount}))`)
        else inits.push(`(${v.global?'global':'local'}.set $${name} (i32.const ${memcount}))`)
        let [,[,...members]] = init
        for (let member of members) inits.push(expr(member))
        memcount += members.length
      }
      else if (init[0] === '->'){
        let [,prepare,body] = init
        let parent = scope
        scope = statement.scope

        let dfn = `func $${name}`

        // define params
        init.args.forEach(id => {
          // FIXME: input args are always converted to float.
          dfn += ` (param $${id} ${scope[id].type == PTR ? 'i32' : 'f64'})`
        })

        dfn += ` (result ${init.result.type == FLOAT ? 'f64' : 'i32'})\n`

        // define locals
        Object.getOwnPropertyNames(scope).filter(id=>!scope[id].arg).forEach(id => {
          dfn += ` (local $${id} ${scope[id].type == PTR ? 'i32' : 'f64'})`
        })

        // init body
        prepare.forEach(node => dfn += `\t` + expr(node))
        body.forEach(node => dfn += `\t` + expr(node))
        dfn += '\n\t(return)\n'
        out.push(`(${dfn})`)

        scope = parent
      }
      // other exression init
      else if (v.type == INT) {
        if (!v.defined)
          v.global ? out.push(`(global $${name} (mut i32) (i32.const 0))`) : inits.push(`(local $${name} i32)`)
        inits.push(`(${v.global?'global':'local'}.set $${name} ${expr(init)})`)
      }
      // default unknown vars fall to f64
      else if (v.type == FLOAT) {
        if (!v.defined)
          v.global ? out.push(`(global $${name} (mut f64) (f64.const 0))`) : inits.push(`(local $${name} f64)`)
        inits.push(`(${v.global?'global':'local'}.set $${name} ${expr(init)})`)
      }
      else err('Undefined variable ' + name)

      v.defined = true
    }
    else err('Unknown instruction `' + statement[0] + '`',statement)
  }

  // serialize expression into wasm ops
  function expr (node) {
    if (typeof node === 'string') return `(${scope[node].global?'global':'local'}.get $${node})`
    if (node[0] in expr) return expr[node[0]](node)
    err('Unimplemented operation ' + node[0], node)
  }

  Object.assign(expr, {
    // a; b; c;
    ';'([,...args]){ return args.map(arg => arg != null ? expr(arg) : '').join() },

    // a = b
    '='([,a,b]) {
      if (typeof a !== 'string') err('Left argument must be a string', a)
      return `(${scope[a].global?'global':'local'}.set $${a} ${expr(b)})`
    },

    // number primitives: 1.0, 2 etc.
    [FLOAT]([,a]) { return `(f64.const ${a})` },
    [INT]([,a]) { return `(i32.const ${a})` },

    '-'([,a,b]) {
      // [-, [int, a]] -> (i32.const -a)
      if (!b && (a[0] == INT || a[0] == FLOAT)) return expr([a[0], -a[1]])
      if (!b && desc(a,scope).type == FLOAT) return `(f64.neg ${expr(a)})`
      if (!b) return expr(['-',[INT,0],a[1]])
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) return `(i32.sub ${expr(a)} ${expr(b)})`
      return `(f64.sub ${fexpr(a)} ${fexpr(b)})`
    },
    '+'([,a,b]) {
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) return `(i32.add ${expr(a)} ${expr(b)})`
      return `(f64.add ${fexpr(a)} ${fexpr(b)})`
    },
    '*'([,a,b]) {
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) return `(i32.mul ${expr(a)} ${expr(b)})`
      return `(f64.mul ${fexpr(a)} ${fexpr(b)})`
    },

    // a -< range - clamp a to indicated range
    '-<'([,a,b]) {
      if (b[0] !== '..') err('Only primitive ranges are supported for now')
      let [,min,max] = b
      if (desc(a,scope).type == INT && desc(min,scope).type == INT && desc(max,scope).type == INT) {
        includes.push(['std','i32.smax'], ['std','i32.smin'])
        return `(call $std/i32.smax (call $std/i32.smin ${expr(a)} ${expr(max)}) ${expr(min)})`
      }
      return `(f64.max (f64.min ${fexpr(a)} ${fexpr(max)}) ${fexpr(min)})`
    },

    // [1,2,3]
    '['([,[,...members]]) {
      let out = ``
      for (let i = 0; i < members.length; i++) {
        out += ` (f64.store (i32.const ${memcount + i*BYTES_PER_F64}) ${fexpr(members[i])})`
      }
      out += `\n(i32.const ${memcount})`
      memcount += members.length
      return out
    },

    // a | b
    '|'([,a,b]) {
      console.log(a,b)
    }
  })

  // convert input expr to float expr
  function fexpr(node) {
    if (node[0] === FLOAT || node[0] === INT) return `(f64.const ${node[1]})`

    let {type} = desc(node, scope)
    if (type === FLOAT) return expr(node)

    return `(f64.convert_i32_s ${expr(node)})`
  }


  // begin
  gexpr(node)

  // Init all globals in start
  // FIXME: ugh, sorting, for real?
  if (inits.length) out.push(
    `(start $module/init)`,
    `(func $module/init\n${inits.sort((a,b)=>a.startsWith('(local ') ? -1 : 1).join('\n')}\n)`
  )

  // Provide exports
  let exportDfn = ``
  for (let name in scope) {
    if (scope[name].export) exportDfn += `(export "${name}" (${scope[name].type === FUNC ? 'func' : 'global'} $${name}))`
  }
  if (exportDfn) out.push(exportDfn)

  // Declare includes
  for (let [lib,member] of includes) out.unshift(stdlib[lib][member])

  // Declare memories
  if (memcount) out.unshift(`(memory (export "memory") ${Math.ceil(memcount / F64_PER_PAGE)})`)

  console.log(out.join('\n'))

  return out.join('\n')
}
