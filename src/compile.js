// compile source/ast/ir to WAST
import parse from "./parse.js"
import stdlib from "./stdlib.js"
import {FLOAT,INT} from './const.js'
import { parse as parseWat } from "watr";

let includes, globals, funcs, locals, loop, buf, exports, block;
const _tmp = Symbol('tmp')

export default function compile(node) {
  if (typeof node === 'string') node = parse(node)
  console.log('compile', node)

  // init compiling context
  globals = {[_tmp]:[]}, // global scope (as name props)
  locals, // current fn local scope
  includes = [], // pieces to prepend
  funcs = {}, // defined picker functions
  loop = 0, // current loop number
  buf = 0, // current array init number
  block = Object.assign([''],{cur:0}), // current block count
  exports = null // items to export

  // run global in start function
  let init = expr(node), res = ``

  // run globals init, if needed
  if (init) res = `(func $module/init\n` +
    globals[_tmp].map((tmp)=>`(local ${tmp})`).join('') + '\n' +
    `${init}\n` +
    `(return))\n` +
  `(start $module/init)`

  // declare variables
  // NOTE: it sets functions as global variables
  for (let name in globals)
    res = `(global $${name} (mut ${globals[name].type}) (${globals[name].type}.const 0))\n` + res

  // declare funcs
  for (let name in funcs)
    res = funcs[name] + '\n' + res

  // declare includes
  for (let include of includes)
    if (stdlib[include]) res = stdlib[include] + '\n' + res; else err('Unknown include `' + include + '`')

  // provide exports
  for (let name in exports)
    res += `\n(export "${name}" (${exports[name].func ? 'func' : 'global'} $${name}))`

  console.log(res)
  // console.log(...parseWat(res))

  return res
}

// processess global statements, returns nothing, only modifies globals, inits, out, memory
function expr(statement) {
  if (!statement) return ''
  // a; - just declare in proper scope
  // FIXME: funcs may need returning something meaningful
  if (typeof statement === 'string') {
    // just x,y; or a=x; where x is undefined
    statement = name(statement)
    if (!locals?.[statement] && !globals[statement]) define(statement);
    if (!locals && exports) exports[statement] = globals[statement]
    return op(`(${locals?.[statement]?'local':'global'}.get $${statement})`,`f64`)
  }
  if (statement[0] in expr) return expr[statement[0]](statement) || ''
  err('Unknown operation `' + statement[0] + '`',statement)
}

Object.assign(expr, {
  // number primitives: 1.0, 2 etc.
  [FLOAT]([,a]) { return op(`(f64.const ${a})`,'f64',{static:true})},
  [INT]([,a]) { return op(`(i32.const ${a})`,'i32',{static:true})},

  // a; b; c;
  ';'([,...statements]){
    let list=[];
    for (let s of statements) s && list.push(expr(s));
    list = list.filter(Boolean)
    return op(
      list.map((op,i) => op + `(drop)`.repeat(i===list.length-1 ? 0 : op.type.length)).join('\n'),
      list[list.length-1].type,
      {static:list[list.length-1].static}
    )
  },

  ','([,...statements]){
    let list=[];
    for (let s of statements) list.push(expr(s));
    list = list.filter(Boolean)
    return op(list.join('\n'), list.flatMap(op=>op.type), {static:list.every(op=>op.static)})
  },

  '('([,body]){
    // ((a)) -> a
    while (body[0]==='(') body = body[1]

    // resolve block scopes var names conflict
    block.cur++
    block[block.cur]=(block[block.cur]||0)+1

    // FIXME: detect block type, if it needs preliminary return - then we ought to wrap it
    let res = expr(body)

    block.cur--

    return res
  },

  '()'([,name, list]) {
    list = !list ? [] : list[0]===',' ? list.slice(1) : list

    if (!globals[name]) err('Unknown function call: ' + name)

    // FIXME: make sure default args are gotten values
    let {args} = globals[name]

    // FIXME: this is very primitive call, must account input trypes properly
    return op(`(call $${name} ${list.map(expr).join(' ')})`, 'f64')
  },

  // [1,2,3]
  '['([,inits]) {
    inits = !inits ? [] : inits[0] !== ',' ? [inits] : inits.slice(1)

    let out = ``, items = []

    // we can't define via data section, since values can be calculable
    for (let init of inits) {
      if (init[0] === '..') {
        let [,min,max] = init
        // simple numeric range like [0..1]
        if (typeof max[1] === 'number') {
          // [..1] - no need for specific init
          if (!min) items.length += max[1]
          // [1..3]
          // FIXME: this range may need specifying, like -1.2..2
          else if (typeof min[1] === 'number')
            for (let v = min[1]; v <= max[1]; v++) items.push(op(`(f64.const ${v})`, 'f64'))
          // FIXME
          else err('Unimplemented array initializer: computed range min value')
        }
        // FIXME
        else err('Unimplemented array initializer: computed range', init)
      }
      else items.push(expr(init))
    }
    // allocate required memory (in bytes, not f64s)
    let bufAddr = tmp('buf', 'i32');
    inc('mem'), out += `(local.set ${bufAddr} (call $mem.alloc (i32.const ${items.length << 3})))\n`

    // add initializers
    for (let i = 0; i < items.length; i++)
      if (items[i])
        out += `(f64.store (i32.add (local.get ${bufAddr}) (i32.const ${i << 3})) ${asFloat(items[i])})\n`

    // create buffer reference as output
    inc('buf.create')
    out += `(call $buf.create (local.get ${bufAddr}) (i32.const ${items.length}))`

    return op(out,'f64',{buf:true})
  },

  // a[b] or a[]
  '[]'([,a,b]) {
    // a[]
    if (!b) {
      let aop = expr(a)
      return inc('buf.len'), op(`(call $buf.len ${aop})`,'i32')
    }
    err('Unimplemented prop access')
  },

  '='([,a,b]) {
    while (a[0] === '(') a = a[1] // unbracket

    // x[y]=1, x.y=1
    if (a[0] === '[]' || a[0] === '.') {
      let [,buf,idx] = a
      if (a[0] === '.') idx = [INT, parseInt(idx)]

      // FIXME: add static optimization here for property - to avoid calling i32.modwrap if idx is known
      // FIXME: another static optimization: if length is known in advance (likely yes) - make static modwrap

      return inc('buf.write'), inc('i32.modwrap'), op(`(call $buf.write ${expr(buf)} ${asInt(expr(idx))} ${asFloat(expr(b))})`, 'f64')
    }

    // a = b,  a = (b,c),   a = (b;c,d)
    if (typeof a === 'string') {
      a = name(a), define(a)
      return op(locals ? `(local.tee $${a} ${pick(1,asFloat(expr(b)))})` : `(global.set $${a} ${pick(1,asFloat(expr(b)))})(global.get $${a})`, 'f64')
    }

    // (a,b) = ...
    if (a[0]===',') {
      let [,...outputs] = a, inputs = pick(outputs.length,expr(b))

      // define/provide exports
      for (let n of outputs) define(name(n))

      // (a,b,c)=(c,d) -> (a,b)=(c,d)
      if (inputs.type.length > 1) outputs = outputs.slice(0, inputs.type.length)

      // set as `(i32.const 1)(i32.const 2)(local.set 1)(local.set 0)`
      return op(
        inputs + '\n'+
        outputs.map((n,i)=> (
          n=name(n), `${inputs.type[i] === 'i32' ? `(f64.convert_i32_s)` : ''}(${globals[n]?`global`:`local`}.set $${n})`
        )).reverse().join('') +
        outputs.map(n=>(n=name(n),`(${globals[n]?'global':'local'}.get $${n})`)).join(''),
        Array(outputs.length).fill(`f64`)
      )
    }

    // x(a,b) = y
    if (a[0]==='()') {
      let [,name,args] = a, body = b, inits = [], result, dfn = []

      // functions defined within scope of other functions, `x()=(y(a)=a;)`
      if (locals) err('Declaring local function `' + name +'`: not allowed');

      // FIXME: maybe it's ok to redeclare function? then we'd need to use table
      if (globals[name]) err('Redefining function `' + name + '`: not allowed');

      locals = {[_tmp]:[]}

      // normalize body to (a;b;) form
      body = body[0]==='(' ? body : ['(',body]
      body[1] = body[1][0] === ';' ? body[1] : [';',body[1]]

      // get args list
      args = !args ? [] : args[0] === ',' ? args.slice(1) : [args];

      // detect optional / clamped args
      args = args.map(arg => {
        let name, init

        // x(a,b)
        if (typeof arg === 'string') name = arg
        // x(a=1,b=2), x(a=(1;2))
        else if (arg[0]==='=') [,name,init] = arg, inits.push(['?',['!=',name,name],['=',name,init]])
        // x(x-<2..3)
        else if (arg[0]==='-<') [,name,init] = arg, inits.push(['-<=',name,arg[2]])

        locals[name] = {arg:true}

        dfn.push(`(param $${name} f64)`)
        return name
      })
      body[1].splice(1,0,...inits) // prepend inits
      result = expr(body)

      // define result, comes after (param) before (local)
      dfn.push(`(result ${result.type.join(' ')})`)

      // declare locals
      for (let name in locals) if (!locals[name].arg) dfn.push(`(local $${name} ${locals[name].type})`)

      // declare tmps
      dfn.push(locals[_tmp].map((tmp)=>`(local ${tmp})`).join(''))

      locals = null

      globals[name] = {func:true, args, type:'i32'}; // NOTE: we set type to i32 as preliminary pointer to function (must be in a table)
      if (exports) exports[name] = globals[name]

      // init body - expressions write themselves to body
      funcs[name] = `(func $${name} ${dfn.join(' ')}\n${result}\n(return))`

      return
    }

    err('Unknown assignment', a)
  },

  // a <| b
  '<|'([,a,b]) {
    console.log("TODO: loops", a, b)
    loop++

    let from, to, next, params

    // a..b <| #
    if (a[0]==='..') {
      // i = from; to; while (i < to) {# = i; ...; i++}
      let [,min,max] = a
      from = expr(min), to = expr(max), next = `$loop${loop}.index`, params = ``
    }
    else {
      let aop = expr(a)
      // (...;a,b,c)
      // FIXME: generally group may have more than 1k members, so we ought to use comprehension-like method
      if (aop.type.length > 1) {
        // i=0; to=types.length; while (i < to) {# = stack.pop(); ...; i++}
        from = `(i32.const 0)`, to = `(i32.const ${aop.type.length})`, next = `$loop${loop}.index`
        params = `(param ${aop.type.join(' ')})`
      }
      // list <| #
      else {
        // i = 0; to=buf[]; while (i < to) {# = buf[i]; ...; i++}
        inc('buf.len'), inc('buf.read')
        from = `(i32.const 0)`, to = `(call $buf.len ${aop})`, next = `(call $buf.read ${aop} $loop${loop}.index)`
        params = ``
      }
    }

    let idx = tmp('idx','i32'), item = tmp('item','f64'), end = tmp('end','i32')

    let res =
    `(local.set ${idx} ${from})\n` +
    `(local.set ${end} ${to})\n` +
    `(loop $loop${loop} ${params} (result f64)\n` +
      `(local.set ${item} ${next})`
      `(if (result f64)\n` +
        `(then\n` +
          `${expr(b)}\n` +
          `(br $loop${loop})\n` +
        `)\n` +
        `(else (f64.const 0))\n` +
      `)\n` +
      `(local.set ${idx} (i32.add (local.get ${idx}) (i32.const 1)))`
    `)\n`

    loop--
    return res
  },

  '-'([,a,b]) {
    // [-, [int, a]] -> (i32.const -a)
    if (!b) {
      if (a[0] == INT || a[0] == FLOAT) return expr([a[0], -a[1]])
      let res = expr(a)
      if (res.type.length > 1) err('Group negation: unimplemented')
      if (res.type[0] === 'i32') return op(`(i32.sub (i32.const 0) ${res})`, 'i32', {static:res.static})
      return `(f64.neg ${res})`
    }

    let aop = expr(a), bop = expr(b)
    if (aop.type.length > 1 || bop.type.length > 1) err('Group subtraction: unimplemented')
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.sub ${aop} ${bop})`, 'i32')
    return op(`(f64.sub ${asFloat(aop)} ${asFloat(bop)})`, 'f64')
  },
  '+'([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] == 'i32' && bop.type[0] == 'i32') return op(`(i32.add ${aop} ${bop})`, 'i32')
    return op(`(f64.add ${asFloat(aop)} ${asFloat(bop)})`,'f64')
  },
  '*'([,a,b]) {
    // FIXME: stateful variable
    if (!b) {
      locals[a].stateful = true
      err('Stateful variable: unimplemented')
      return ``
    }
    let aop = expr(a), bop = expr(b)
    return op(`(f64.mul ${asFloat(aop)} ${asFloat(bop)})`,'f64')
  },
  '/'(){
    let aop = expr(a), bop = expr(b)
    return op(`(f64.div ${asFloat(aop)} ${asFloat(bop)})`,'f64')
  },
  '++'([,a]) { return expr(['+=',a,[INT,1]]) },
  '--'([,a]) { return expr(['-=',a,[INT,1]]) },
  '+='([,a,b]) { return expr(['=',a,['+',a,b]]) },
  '-='([,a,b]) { return expr(['=',a,['-',a,b]]) },
  '%%'([,a,b]) {
    // common case of int is array index access
    if (getDesc(a).type === INT && getDesc(b).type === INT) return inc('i32.modwrap'), call('i32.modwrap', a, b)
    return inc('f64.modwrap'), expr(['()','f64.modwrap', [',',a, b]])
  },
  // a | b
  '|'([,a,b]) {
    // console.log('|',a,b)
    // 0 | b -> b | 0
    if (a[0] === INT && a[1] === 0) [a,b]=[b,a]

    let aop = expr(a), bop = expr(b);
    return op(`(i32.or ${asInt(aop)} ${asInt(bop)})`,'i32')
  },

  // comparisons
  '<'([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.lt_s ${aop} ${bop})`,'i32')
    return op(`(f64.lt ${asFloat(aop)} ${asFloat(bop)})`,'i32')
  },
  '<='([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.le_s ${aop} ${bop})`,'i32')
    return op(`(f64.le ${asFloat(aop)} ${asFloat(bop)})`,'i32')
  },
  '>'([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.gt_s ${aop} ${bop})`,'i32')
    return op(`(f64.gt ${asFloat(aop)} ${asFloat(bop)})`,'i32')
  },
  '>='([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.ge_s ${aop} ${bop})`,'i32')
    return op(`(f64.ge ${asFloat(aop)} ${asFloat(bop)})`,'i32')
  },
  '=='([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.eq_s ${aop} ${bop})`,'i32')
    return op(`(f64.eq ${asFloat(aop)} ${asFloat(bop)})`,'i32')
  },
  '!='([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.ne_s ${aop} ${bop})`,'i32')
    return op(`(f64.ne ${asFloat(aop)} ${asFloat(bop)})`,'i32')
  },

  // logical - we put value twice to the stack and then just drop if not needed
  '||'([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0]=='f64') return op(`${pick(2,aop)}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then) (else (drop) ${asFloat(bop)}))`,'f64')
    if (bop.type[0]=='i32') return op(`${pick(2,aop)}(if (param i32) (result i32) (then) (else (drop) ${bop}))`,'i32')
    return op(`${pick(2,aop)}(if (param i32) (result f64) (then (f64.convert_i32_s)) (else (drop) ${asFloat(bop)}))`,'f64')
  },
  '&&'([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0]=='f64') return op(`${pick(2,aop)}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then (drop) ${asFloat(bop)}))`,'f64')
    if (bop.type[0]=='i32') return op(`${pick(2,aop)}(if (param i32) (result i32) (then (drop) ${bop}))`,'i32')
    return op(`${pick(2,aop)}(if (param i32) (result f64) (then (f64.convert_i32_s) (drop) ${asFloat(bop)}))`,'f64')
  },
  // parsing alias ? -> ?:
  '?'([,a,b]) {return expr['?:'](['?:',a,b,[FLOAT,0]])},
  '?:'([,a,b,c]) {
    if (!c) c=b, b=[FLOAT,0]; // parsing alias
    let aop = expr(a), bop = expr(b), cop = expr(c)
    return op(`(if (result f64) ${aop.type[0]=='i32'?aop:`(f64.ne ${aop} (f64.const 0))`} (then ${asFloat(bop)}) (else ${asFloat(cop)}))`, 'f64')
  },

  // a -< range - clamp a to indicated range
  '-<'([,a,b]) {
    if (b[0] !== '..') err('Non-range passed as right side of clamp operator')
    let [,min,max] = b, aop = expr(a), minop = min && expr(min), maxop = max && expr(max)

    // a -< 0..
    if (!max) {
      if (aop.type[0] === 'i32' && minop.type[0] === 'i32') return inc('i32.smax'), op(`(call $i32.max ${aop} ${minop})`,'i32')
      return op(`(f64.max ${asFloat(aop)} ${asFloat(minop)})`, 'f64')
    }
    // a -< ..10
    if (!min) {
      if (aop.type[0] === 'i32' && maxop.type[0] === 'i32') return inc('i32.smin'), op(`(call $i32.min ${aop} ${maxop})`,'i32')
      return op(`(f64.min ${asFloat(aop)} ${asFloat(maxop)})`, 'f64')
    }
    // a -< 0..10
    if (aop.type == 'i32' && minop.type == 'i32' && maxop.type == 'i32') {
      return inc('i32.smax'),inc('i32.smin'), op(`(call $i32.smax (call $i32.smin ${aop} ${maxop}) ${minop})`,'i32')
    }
    return op(`(f64.max (f64.min ${asFloat(aop)} ${asFloat(maxop)}) ${asFloat(minop)})`, 'f64')
  },


  // @ 'math#sin', @ 'path/to/lib'
  '@'([,path]) {
    if (locals) err('Import must be in global scope')
    if (Array.isArray(path)) path[0] === "'" ? path = path[1] : err('Bad path `' + path + '`')
    let url = new URL('import:'+path)
    let {hash, pathname} = url
    throw 'Unimplemented'

    // FIXME: include directive into syntax tree
    // let src = fetchSource(pathname)
    // let include = parse(src)
    // node.splice(node.indexOf(impNode), 1, null, include)

    let lib = stdlib[pathname], members = hash ? hash.slice(1).split(',') : Object.keys(lib)
    for (let member of members) {
      scope[member] = { import: pathname, type: lib[member][1] }
    }
    // we return nothing since member is marked as imported
    return ''
  },

  // a,b,c . x?
  '.'([,a,b]) {
    // a.b
    if (b) err('Prop access is unimplemented ' + a + b, a)

    if (locals) err('Export must be in global scope')
    // FIXME: if (expNode !== node && expNode !== node[node.length-1]) err('Export must be the last node');

    exports = {}
    return expr(a)
  },
})

// define variable in current scope, export if necessary
function define(name, type='f64') {
  if (!locals) {
    if (!globals[name]) globals[name] = {var:true, type}
    if (!locals && exports) exports[name] = globals[name]
  }
  else {
    if (!locals[name]) locals[name] = {var:true, type}
  }
}

// define temp variable, always in local scopr
function tmp(name, type='f64') {
  let len = (locals || globals)[_tmp].length || ''
  name = `$tmp${len}.${name}`
  ;(locals || globals)[_tmp].push(`${name} ${type}`)
  return name
}

// resolve var name without scope clash
function name(str) {
  // NOTE: this reserves # for loop member
  // if (loop && str=='#') return `loop${loop}.item`;
  return str + block.slice(0,block.cur).join('.');
}

// wrap expression to float, if needed
function asFloat(o) {
  if (o.type[0] === 'f64') return o
  return op(`(f64.convert_i32_s ${o})`, 'f64')
}
// cast expr to int
function asInt(o) {
  if (o.type[0] === 'i32') return o
  // return op(`(i32.trunc_sat_f64_s ${o})`, 'i32')
  return op(`(i32.trunc_f64_s ${o})`, 'i32')
}

// add include from stdlib and return call
function inc(name) {
  if (!includes.includes(name)) includes.push(name)
}

// pick N input args into stack, like (a,b,c) -> (a,b)
function pick(count, input) {
  let name

  // if result of expression is 1 element, eg. (a,b,c) = d - we duplicate it
  if (input.type.length === 1) {
    // a = b - skip picking
    if (count === 1) return input
    // (a,b,c) = d
    let {type} = input
    name = `$pick/${type}_${count}`
    if (!funcs[name]) {
      funcs[name] = `(func ${name} (param ${type}) (result ${(type+' ').repeat(count)}) ${`(local.get 0)`.repeat(count)} (return))`
    }
    return op(`(call ${name} ${input})`, input.type, {static: input.static})
  }

  // N:M or 1:M picker
  name = `$pick/${input.type.join('_')}_${count}`
  if (!funcs[name]) {
    funcs[name] = `(func ${name} (param ${input.type.join(' ')}) (result ${input.type.slice(0,count).join(' ')}) ${input.type.slice(0,count).map((o,i) => `(local.get ${i})`).join('')} (return))`
  }

  return op(`(call ${name} ${input})`, input.type.slice(0,count), {static: input.static})
}

// create op result
// holds number of returns (ops)
// makes sure it stringifies properly into wasm expression
// provides any additional info: types, static, min/max etc
// supposed to be a replacement for getDesc to avoid mirroring every possible op
function op(str, type, info={}) {
  str = new String(str)
  if (!type) type = []
  else if (typeof type === 'string') type = [type]
  return Object.assign(str, {type, ...info})
}

// show error meaningfully
export function err(msg, node={}) {
  // Promise.resolve().then(() => {
    throw Error((msg || 'Bad syntax') + ' `' + node.toString() + '`' )
  // })
}

// fetch source file by path - uses import maps algorighm
// FIXME: can extend with importmap
const coreModules = {math:'./math.lino'}
function fetchSource (path) {
  let fullPath = import.meta.resolve(coreModules[path])
  let xhr = new XMLHttpRequest ()
  xhr.open ('GET', fullPath, false /* SYNCHRONOUS XHR FTW :) */)
  xhr.send (null)
  // result = (nodeRequire ('fs').readFileSync (path, { encoding: 'utf8' }))
  return xhr.responseText
}