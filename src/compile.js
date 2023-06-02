// compile source/ast/ir to WAST
import parse from "./parse.js"
import stdlib from "./stdlib.js"
import {FLOAT,INT,RANGE,BUF,FUNC} from './const.js'
import { parse as parseWat } from "watr";

const F64_PER_PAGE = 8192;
const MEM_STRIDE = 8; // bytes per f64

let includes, globals, pickers, locals, memcount, loop, exports;

export default function compile(node) {
  if (typeof node === 'string') node = parse(node)
  console.log('compile', node)

  // init compiling context
  globals = {}, // global scope (as name props)
  locals, // current fn local scope
  includes = [], // pieces to prepend
  pickers = [], // defined picker functions
  memcount = 0, // current used memory pointer (number of f64s)
  loop = 0, // current loop number
  block = Object.assign([''],{cur:0}), // current block count
  exports = {} // list of items to export

  // begin - pretend global to be a function init
  let res = `(func $module/init ${expr(node)})(start $module/init)`

  // Declare memories
  if (memcount) res += `\n(memory (export "memory") ${Math.ceil(memcount / F64_PER_PAGE)})`

  // Declare includes
  for (let include of includes)
    res += `\n${stdlib[include]}`

  // Provide exports
  for (let name in exports)
    res += `\n(export "${name}" (${scope[name].type === FUNC ? 'func' : 'global'} $${name}))`

  console.log(res)
  console.log(...parseWat(res))

  return res
}

// processess global statements, returns nothing, only modifies globals, inits, out, memory
function expr(statement) {
  if (!statement) return ''
  // a; - just declare in proper scope
  // FIXME: funcs may need returning something meaningful
  if (typeof statement === 'string') {
    // just x,y; or a=x; where x is undefined
    statement = statement + block.join('.')
    if (!locals[statement] && !globals[statement]) err('Undefined variable ' + statement);
    return op(`(${locals[statement]?'local':'global'}.get $${statement})`,`f64`)
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
    return op(
      list.map(op => op + `(drop)`.repeat(op.type.length)).join('\n'),
      list[list.length-1].type,
      {static:list[list.length-1].static}
    )
  },

  ','([,...statements]){
    let list=[];
    for (let s of statements) list.push(expr(s));
    return op(list.join(' '), list.flatMap(op=>op.type), {static:list.every(op=>op.static)})
  },

  '('([,body]){
    // ((a)) -> a
    while (body[0]==='(' && body.length == 2) body = body[1]

    // resolve block scopes var names conflict
    block[++block.cur] = (block[block.cur]||0)

    // FIXME: detect block type, if it needs preliminary return - then we ought to wrap it
    let res = expr(body)
    res.block = block.cur // just in case

    block[block.cur--]++

    return res
  },

  '()'([,name, list]) {
    list = !list ? [] : list[0]===',' ? list.slice(1) : list

    // FIXME: make sure default args are gotten values
    let {args} = globals[name]

    if (!globals[name]) err('Unknown function call: ' + name)
    return op(`(call $${name} ${list.map(expr).join(' ')})`, globals[name].type)
  },

  // [1,2,3]
  '['([,inits]) {
    if (!inits) inits = !inits ? [] : inits[0] !== ',' ? [inits] : inits.slice(1)

    let out = ``, members = 0
    memcount += MEM_STRIDE // we unify memory stride to f64 steps to avoid js typed array buttheart
    // second i32 stores array rotation info like a << 1
    // FIXME: wouldn't it be easier to init static arrays via data section?
    for (let init of inits) {
      let idesc = getDesc(init)
      if (idesc.type === INT || idesc.type === FLOAT)
        out += `(f64.store (i32.const ${memcount + members++ * MEM_STRIDE}) ${expr(asFloat(init))}) `
      else if (idesc.type === RANGE) {
        let [,min,max] = init
        // simple numeric range like [0..1]
        if (typeof max[1] === 'number') {
          // [..1] - no need for specific init
          if (!min) members += max[1]
          // [1..3]
          // FIXME: this range may need specifying, like -1.2..2
          else if (typeof min[1] === 'number') for (let v = min[1]; v <= max[1]; v++)
              out += `(f64.store (i32.const ${memcount + members++ * MEM_STRIDE}) (f64.const ${v})) `
          else err('Unimplemented array initializer: computed range min value')
        }
        else err('Unimplemented array initializer: computed range', init)
      }
      else err('Unimplemented array initializer',init)
    }
    // prepend length initializer
    out = `(i32.store (i32.const ${memcount-MEM_STRIDE}) (i32.const ${members})) ` + out
    out += `(i32.const ${memcount})`
    memcount += members * MEM_STRIDE

    return out
  },

  // a[b] or a[]
  '[]'([,a,b]) {
    // a[]
    if (!b) {
      let aDesc = getDesc(a);
      if (aDesc.type !== BUF) err('Reading length of non-array', a);
      return inc('buf.len'), expr(['()', 'buf.len', a])
    }
    err('Unimplemented prop access')
  },

  '='([,a,b]) {
    // x[y]=1, x.y=1
    if (a[0] === '[]' || a[0] === '.') {
      let [,buf,idx] = a
      if (a[0] === '.') idx = [INT, parseInt(idx)]

      // FIXME: add static optimization here for property - to avoid calling i32.modwrap if idx is known
      // FIXME: another static optimization: if length is known in advance (likely yes) - make static modwrap
      // FIXME: validate if ptr is real buffer and not fake, statically?;

      // FIXME: pass length modwrapped here
      return inc('buf.store'), expr(['()','buf.store', [',', buf, ['%%', asInt(idx), ['[]',buf]], asFloat(b)]])
    }

    // a = b,  a = (b,c),   a = (b;c,d)
    if (typeof a === 'string') {
      a = a + block.join('.') // prevent scope clash
      if (!locals) {
        if (!globals[a]) globals[a] = {var:true}
        return op(`(global.set $${a} ${pick(1,b)})(global.get $${a})`, 'f64')
      }
      else {
        if (!locals[a]) locals[a] = {var:true}
        return op(`(local.tee $${a} ${pick(1,b)})`, 'f64')
      }
    }

    // (a,b) = ...
    if (a[0]==='(' && a[1][0]===',') {
      let [,...outputs] = a[1], inputs = pick(outputs.length,b)

      if (inputs) outputs = outputs.slice(0, inputs.length).reverse() // (a,b,c)=(c,d) -> (a,b)=(c,d)

      // set as `(i32.const 1)(i32.const 2)(local.set 0)(local.set 1)`
      return op(
        inputs +
        outputs.map(m=>(m=m+block.join('.'),globals[m]?`(global.set $${m})`:`(local.set $${m})`)).join('') +
        outputs.map(m=>(m=m+block.join('.'),globals[m]?`(global.get $${m})`:`(local.get $${m})`)).join(''),
        Array(outputs.length).fill(`f64`)
      )
    }

    // x(a,b) = y
    if (a[0]==='()') {
      let [,name,args] = a, body = b, inits = [';'], result, dfn = []

      // functions defined within scope of other functions, `x()=(y(a)=a;)`
      if (locals) err('Declaring local function `' + name +'`: not allowed');

      // FIXME: maybe it's ok to redeclare function? then we'd need to use table
      if (globals[name]) err('Redefining function `' + name + '`: not allowed');

      locals = {}

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
        // x(x-<2)
        else if (arg[0]==='-<') [,name,init] = arg, inits.push(['-<=',name,arg[2]])

        locals[name] = {arg:true}

        dfn.push(`(param $${name} f64)`)
        return name
      })

      result = expr(body)

      // define init part - params, result
      dfn.push(`(result ${result.type.join(' ')}`)

      // declare locals
      for (let name in locals) if (!locals[name].arg) dfn.push(`(local $${name} f64)`)
      locals = null

      globals[name] = {func:true, args};

      // init body - expressions write themselves to body
      return op(
        `(func $${name} ${dfn.join(' ')}\n${res}\n(return))`
      )
    }

    err('Unknown assignment', node)
  },

  // a <| b
  '<|'([,a,b]) {
    throw 'Unimplemented'
    // console.log("TODO: loops", a, b)
    loop++
    let res =
    `(loop $loop${loop} (result i32)\n` +
    `  (if (result i32) ${expr(a)}\n` +
    `    (then\n` +
    `      ${expr(b)}\n` +
    `      (br $loop${loop})\n` +
    `    )\n` +
    `    (else (i32.const 0))\n` +
    `  )\n` +
    `)\n`
    loop--
    return res
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
  '.'([,a,b], skip=false) {
    // a.b
    if (b) err('prop access is unimplemented ' + a + b, a)

    // FIXME: does nothing here, export is just last items in globals.
    return expr(a)

    // a.
    if (locals) err('Export must be in global scope')
    // FIXME: if (expNode !== node && expNode !== node[node.length-1]) err('Export must be the last node');

    if (!skip) a = expr(a) // apply converting expression

    if (typeof a === 'string') scope[a].export=true

    // a=b
    else if (a[0]==='=') {
      let [,l,r] = a
      if (l[0]==='(') [,l]=l; if (r[0]==='(') [,r]=r; // unbracket
      // a=...;
      if (typeof l === 'string') scope[l].export = true
      // a()=;
      else if (l[0]==='()') scope[l[1]].export = true
      // (a,b)=...
      else if (l[0]===',') l.slice(1).forEach(l => scope[l].export = true)
      else err('Unknown export expression `' + a + '`')
    }

    // a,b  or  a=1,b=2
    else if (a[0]===',') {
      a.slice(1).forEach(a => expr['.'](['.',a], true))
    }
    // (a) or (a,b,c)
    else if (a[0]==='(') {
      let members = a[1][0]===';'?a[1][a[1].length-1]:a[1]
      if (members[0]!==',') members = [',',members]
      members.slice(1).forEach(a => expr['.'](['.',a], true))
    }
    else err('Unknown expr ' + a[0], a)

    // we get rid of '.' for compiler, since all vars are marked as exported
    return a
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
    return `(i32.or ${asInt(aop)} ${asInt(bop)})`
  },

  // comparisons
  '<'([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return `(i32.lt_s ${aop} ${bop})`
    return `(f64.lt ${asFloat(aop)} ${asFloat(bop)})`
  },
  '<='([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return `(i32.le_s ${aop} ${bop})`
    return `(f64.le ${asFloat(aop)} ${asFloat(bop)})`
  },
  '>'([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return `(i32.gt_s ${aop} ${bop})`
    return `(f64.gt ${asFloat(aop)} ${asFloat(bop)})`
  },
  '>='([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return `(i32.ge_s ${aop} ${bop})`
    return `(f64.ge ${asFloat(aop)} ${asFloat(bop)})`
  },
  '=='([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return `(i32.eq_s ${aop} ${bop})`
    return `(f64.eq ${asFloat(aop)} ${asFloat(bop)})`
  },
  '!='([,a,b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return `(i32.ne_s ${aop} ${bop})`
    return `(f64.ne ${asFloat(aop)} ${asFloat(bop)})`
  },

  // logical - we put value twice to the stack and then just drop if not needed
  '||'([,a,b]) {
    if (getDesc(a).type==FLOAT || getDesc(b).type == FLOAT)
      return `${pick(2,asFloat(a))}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then) (else (drop) ${expr(asFloat(b))}))`
    else
      return `${pick(2,a)}(if (param i32) (result i32) (then) (else (drop) ${expr(b)}))`
  },
  '&&'([,a,b]) {
    if (getDesc(a).type==FLOAT || getDesc(b).type == FLOAT)
      return `${pick(2,asFloat(a))}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then (drop) ${expr(asFloat(b))}))`
    else
      return `${pick(2,a)}(if (param i32) (result i32) (then (drop) ${expr(b)}))`
  },
  '?:'([,a,b,c]){
    let bDesc = getDesc(b), cDesc = getDesc(c);
    // upgrade result to float if any of operands is float
    if (bDesc.type==FLOAT || cDesc.type == FLOAT)
      return `(if (result f64) ${expr(asInt(a))} (then ${exrp(asFloat(b))}) (else ${expr(asFloat(c))}))`
    return `(if (result i32) ${expr(asInt(a))} (then ${expr(b)}) (else ${expr(c)}))`
  },

  // a -< range - clamp a to indicated range
  '-<'([,a,b]) {
    if (b[0] !== '..') err('Non-range passed as right side of clamp operator')
    let [,min,max] = b

    // a -< 0..
    if (!max) {
      if (getDesc(a).type === INT && getDesc(min).type === INT) return inc('i32.smax'), expr(['()','i32.smax', [',',a, min]])
      return `(f64.max ${expr(asFloat(a))} ${expr(asFloat(min))})`
    }
    // a -< ..10
    if (!min) {
      if (getDesc(a).type === INT && getDesc(max).type === INT) return inc('i32.smin'), expr(['()','i32.smin', [',',a, max]])
      return op(`(f64.min ${expr(asFloat(a))} ${expr(asFloat(max))})`, '64')
    }
    // a -< 0..10
    if (getDesc(a).type == INT && getDesc(min).type == INT && getDesc(max).type == INT) {
      return inc('i32.smax'), expr(['()','i32.smax', ['-<',a,['..',undefined,max], min]])
    }
    return op(`(f64.max (f64.min ${expr(asFloat(a))} ${expr(asFloat(max))}) ${expr(asFloat(min))})`, 'f64')
  },
})

// wrap expression to float, if needed
function asFloat(op) {
  if (op.type[0] === 'f64') return op
  return op(`(f64.convert_i32_s ${op})`, 'f64')
}
// cast expr to int
function asInt(op) {
  if (op.type[0] === 'i32') return op
  return op(`(i32.trunc_f64_s ${aop}`, 'i32')
}

// add include from stdlib and return call
function inc(name) {
  if (!includes.includes(name)) includes.push(name)
}

// create args swapper/picker (fn that maps inputs to outputs), like (a,b,c) -> (a,b)
function pick(count, group) {
  let res = expr(group), name

  // if result of expression is 1 element, eg. (a,b,c) = d - we duplicate it
  if (res.type.length === 1) {
    // a = b - skip picking
    if (count === 1) return res
    // (a,b,c) = d
    let {type} = res.type[0]
    name = `$pick/${type}.${count}`
    if (!pickers.includes(name)) {
      pickers.push(name);
      globals.unshift(`(func ${name} (param ${type}) (result ${(type+' ').repeat(count)}) ${`(local.get 0)`.repeat(count)} (return))`)
    }
    return op(`(call ${name} ${res})`, res.type, {static: res.static})
  }

  // N:M or 1:M picker / swapper
  name = `$pick/${res.type.join('.')}.${count}`
  if (!pickers.includes(name)) {
    pickers.push(name);
    globals.unshift(`(func ${name} (param ${res.type.join(' ')}) (result ${res.type.slice(0,count).join(' ')}) ${res.type.slice(0,count).map((o,i) => `(local.get ${i})`).join('')} (return))`)
  }

  return op(`(call ${name} ${res})`, res.type.slice(0,count), {static: res.static})
}

// create op result
// holds number of returns (ops)
// makes sure it stringifies properly into wasm expression
// provides any additional info: types, static, min/max etc
// supposed to be a replacement for getDesc to avoid mirroring every possible op
function op(ops, type, info={}) {
  if (typeof ops === 'string') ops = [ops]
  if (!type) type = []
  else if (typeof type === 'string') type = [type]
  return Object.assign(ops, {type, toString(){ return this.join('') }, ...info})
}

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