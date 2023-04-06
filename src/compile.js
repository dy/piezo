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
    if (!statement) ;
    // a; - just declare in proper scope
    else if (typeof statement === 'string') {
      let name = statement, v = scope[name]
      define(name,v)
      locals.push(`(${v.global?'global':'local'}.get $${name})`)
    }
    else if (statement[0] in expr) expr[statement[0]](statement, param)
    else err('Unknown operation `' + statement[0] + '`',statement)
  }
  // define variable in proper scope
  function define(name, v) {
    if (!v.defined) {
      let wtype = v.type === FLOAT ? 'f64' : 'i32'
      if (v.global) globals.push(`(global $${name} (mut ${wtype}) (${wtype}.const 0))`);
      else locals.unshift(`(local $${name} ${wtype})`)
      v.defined = true
    }
  }

  Object.assign(expr, {
    // a; b; c;
    ';'([,...statements]){ for (let s of statements) expr(s) },
    ','([,...statements]){ for (let s of statements) expr(s) },

    // number primitives: 1.0, 2 etc.
    [FLOAT]([,a]) {
      if (typeof a === 'number') locals.push(`(f64.const ${a})`)
      else locals.push(`(f64.convert_i32_s ${expr(a), locals.pop()})`)
    },
    [INT]([,a]) { locals.push(`(i32.const ${a})`) },

    '='([,name,init]) {
      // [size]x
      if (name[0] === '[') name = name[2]
      define(name, scope[name])
      expr(init, name)
      if(desc(init,scope).type !== FUNC) locals.push(`(${scope[name].global?'global':'local'}.set $${name} ${locals.pop()})`)
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
      Object.getOwnPropertyNames(scope).filter(id=>!scope[id].arg).forEach(id=>define(id,scope[id]))

      // init body - expressions write themselves to body
      expr(prepare), expr(body)
      locals.push('(return)')
      globals.push(`(func $${name} ${dfn.join(' ')}\n${locals.join('\n')})`)

      scope = parent
      locals = prevLocals
    },

    '('(statement){
      let parent = scope
      scope = statement.scope
      expr(statement[1])
      scope = parent
    },

    '-'([,a,b]) {
      // [-, [int, a]] -> (i32.const -a)
      if (!b) {
        if (a[0] == INT || a[0] == FLOAT) expr([a[0], -a[1]])
        else if (desc(a,scope).type == FLOAT) locals.push(`(f64.neg ${expr(a), locals.pop()})`)
        else expr(['-',[INT,0],a[1]])
      }
      else if (desc(a,scope).type == INT && desc(b,scope).type == INT) locals.push(`(i32.sub ${expr(a)} ${expr(b)})`)
      else locals.push(`(f64.sub ${expr(flt(a)), locals.pop()} ${expr(flt(b)), locals.pop()})`)
    },
    '+'([,a,b]) {
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) locals.push(`(i32.add ${expr(a)} ${expr(b)})`)
      else locals.push(`(f64.add ${expr(flt(a)), locals.pop()} ${expr(flt(b)), locals.pop()})`)
    },
    '*'([,a,b]) {
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) locals.push(`(i32.mul ${expr(a)} ${expr(b)})`)
      else locals.push(`(f64.mul ${expr(flt(a)), locals.pop()} ${expr(flt(b)), locals.pop()})`)
    },

    // a -< range - clamp a to indicated range
    '-<'([,a,b]) {
      if (b[0] !== '..') err('Only primitive ranges are supported for now')
      let [,min,max] = b
      if (desc(a,scope).type == INT && desc(min,scope).type == INT && desc(max,scope).type == INT) {
        includes.push(['std','i32.smax'], ['std','i32.smin'])
        locals.push(`(call $std/i32.smax (call $std/i32.smin ${expr(a),locals.pop()} ${expr(max),locals.pop()}) ${expr(min),locals.pop()})`)
      }
      else locals.push(`(f64.max (f64.min ${expr(flt(a)), locals.pop()} ${expr(flt(max)), locals.pop()}) ${expr(flt(min)), locals.pop()})`)
    },

    // [1,2,3]
    '['([,members]) {
      [,...members] = members
      let out = ``
      for (let i = 0; i < members.length; i++) {
        out += `(f64.store (i32.const ${memcount + i*BYTES_PER_F64}) ${expr(flt(members[i])), locals.pop()}) `
      }
      locals.push(out)
      locals.push(`\n(i32.const ${memcount})`)
      memcount += members.length
    },

    // a | b
    '|'([,a,b]) {
      console.log(a,b)
    }
  })

  // wrap last expr with float
  function flt(node) {
    if (node[0] === FLOAT || desc(node, scope).type === FLOAT) return node
    return [FLOAT, node[1]]
  }


  // begin
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
