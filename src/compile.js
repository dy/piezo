// compile source/ast/ir to WAST
import analyse, { err, desc } from "./analyse.js"
import stdlib from "./stdlib.js"
import {FLOAT,INT,RANGE,PTR,FUNC} from './const.js'

const F64_PER_PAGE = 8192;
const BYTES_PER_F64 = 8;

export default function compile(node) {
  if (typeof node === 'string' || Array.isArray(node)) node = analyse(node)
  console.log('compile',node)

  let includes = [], // pieces to prepend
    globals = [], // global statements
    locals, // current local fn body
    memcount = 0, // current used memory pointer (number of f64s)
    scope // current scope

  // processess global statements, returns nothing, only modifies globals, inits, out, memory
  function expr(statement, param) {
    if (!statement) return ''
    // a; - just declare in proper scope
    // FIXME: funcs may need returning something meaningful
    if (typeof statement === 'string') return scope[statement].type === FUNC ? `` : `(${scope[statement].global?'global':'local'}.get $${statement})`
    if (statement[0] in expr) return expr[statement[0]](statement, param) || ''
    err('Unknown operation `' + statement[0] + '`',statement)
  }

  Object.assign(expr, {
    // a; b; c;
    ';'([,...statements]){ let list=[]; for (let s of statements) list.push(expr(s)); return list.join('\n') },
    ','([,...statements]){ let list=[]; for (let s of statements) list.push(expr(s)); return list.join(' ') },

    // number primitives: 1.0, 2 etc.
    [FLOAT]([,a]) {
      if (typeof a === 'number') return `(f64.const ${a})`;
      return `(f64.convert_i32_s ${expr(a)})`;
    },
    [INT]([,a]) {
      if (typeof a === 'number') return `(i32.const ${a})`
      return `(i32.trunc_f64_s ${expr(a)})`
    },

    '='([,name,init]) {
      // [size]x
      if (name[0] === '[') name = name[2]
      let res = expr(init,name)
      if (desc(init,scope).type !== FUNC) return `(${scope[name].global?'global':'local'}.set $${name} ${res})`
    },

    '->'(fn, name) {
      let [,prepare,body] = fn, dfn = [], parent = scope, prevLocals = locals
      scope = fn.scope, locals = []

      // define init part - params, result
      if (fn.args) fn.args.forEach(id => {
        scope[id].defined = true
        dfn.push(`(param $${id} ${scope[id].type == PTR ? 'i32' : 'f64'})`)
      })
      if (fn.result) dfn.push(`(result ${fn.result.type == FLOAT ? 'f64' : 'i32'})`)

      // declare locals
      Object.getOwnPropertyNames(scope).filter(id=>!scope[id].arg).forEach(define)

      const content = expr(prepare) + expr(body);

      // init body - expressions write themselves to body
      globals.push(
        `(func $${name} ${dfn.join(' ')}\n` +
        locals.join('\n') +
        content +
        `\n(return))`
      )

      scope = parent
      locals = prevLocals
    },

    '('(statement){
      let parent = scope
      scope = statement.scope
      // declare locals
      Object.getOwnPropertyNames(scope).forEach(define)
      let res = expr(statement[1])
      scope = parent
      return res
    },

    '-'([,a,b]) {
      // [-, [int, a]] -> (i32.const -a)
      if (!b) {
        if (a[0] == INT || a[0] == FLOAT) return expr([a[0], -a[1]])
        if (desc(a,scope).type == FLOAT) return `(f64.neg ${expr(a)})`
        return expr(['-',[INT,0],a[1]])
      }
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) return `(i32.sub ${expr(a)} ${expr(b)})`
      return `(f64.sub ${expr(flt(a))} ${expr(flt(b))})`
    },
    '+'([,a,b]) {
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) return `(i32.add ${expr(a)} ${expr(b)})`
      return `(f64.add ${expr(flt(a))} ${expr(flt(b))})`
    },
    '*'([,a,b]) {
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) return `(i32.mul ${expr(a)} ${expr(b)})`
      return `(f64.mul ${expr(flt(a))} ${expr(flt(b))})`
    },

    // a -< range - clamp a to indicated range
    '-<'([,a,b]) {
      if (b[0] !== '..') err('Only primitive ranges are supported for now')
      let [,min,max] = b
      if (desc(a,scope).type == INT && desc(min,scope).type == INT && desc(max,scope).type == INT) {
        includes.push(['std','i32.smax'], ['std','i32.smin'])
        return `(call $std/i32.smax (call $std/i32.smin ${expr(a)} ${expr(max)}) ${expr(min)})`
      }
      return `(f64.max (f64.min ${expr(flt(a))} ${expr(flt(max))}) ${expr(flt(min))})`
    },

    // [1,2,3]
    '['([,members]) {
      [,...members] = members
      let out = ``
      for (let i = 0; i < members.length; i++) {
        out += `(f64.store (i32.const ${memcount + i*BYTES_PER_F64}) ${expr(flt(members[i]))}) `
      }
      out += `\n(i32.const ${memcount})`
      memcount += members.length
      return out
    },
    // a[b] or a[]
    '[]'([,a,b]) {
      if (!b) { console.log(a,b) }
      else {}
    },

    // a | b
    '|'([,a,b]) {
      console.log(a,b)
    }
  })

  // define variable in proper scope
  function define(name) {
    let v = scope[name]
    if (!v.defined && v.type !== FUNC) {
      let wtype = v.type === FLOAT ? 'f64' : 'i32'
      if (v.global) globals.push(`(global $${name} (mut ${wtype}) (${wtype}.const 0))`);
      else locals.push(`(local $${name} ${wtype})`)
      v.defined = true
    }
  }

  // wrap last expr with float
  function flt(node) {
    if (node[0] === FLOAT || desc(node, scope).type === FLOAT) return node
    return [FLOAT, node[1]]
  }


  // begin - pretend global to be a function init
  expr['->'](Object.assign(['->',,node],{scope:node.scope}), 'module/init')
  globals.push(`(start $module/init)`)

  // Provide exports
  let exp = ``
  for (let name in node.scope)
    if (node.scope[name].export)
      exp += `(export "${name}" (${node.scope[name].type === FUNC ? 'func' : 'global'} $${name}))`
  if (exp) globals.push(exp)

  // Declare includes
  for (let [lib,member] of includes) globals.unshift(stdlib[lib][member])

  // Declare memories
  if (memcount) globals.unshift(`(memory (export "memory") ${Math.ceil(memcount / F64_PER_PAGE)})`)

  console.log(globals.join('\n'))

  return globals.join('\n')
}
