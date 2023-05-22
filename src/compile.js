// compile source/ast/ir to WAST
import analyse, { err, desc } from "./analyse.js"
import stdlib from "./stdlib.js"
import {FLOAT,INT,RANGE,BUF,FUNC} from './const.js'
import { parse as parseWat } from "watr";

const F64_PER_PAGE = 8192;
const MEM_STRIDE = 8; // bytes per f64

export default function compile(node) {
  if (typeof node === 'string' || Array.isArray(node)) node = analyse(node)
  console.log('compile', node)

  let includes = [], // pieces to prepend
    globals = [], // global statements
    pickers = [], // defined picker functions
    locals, // current fn local statements
    memcount = 0, // current used memory pointer (number of f64s)
    scope, // current scope
    loop = 0 // current loop

  // processess global statements, returns nothing, only modifies globals, inits, out, memory
  function expr(statement) {
    if (!statement) return ''
    // a; - just declare in proper scope
    // FIXME: funcs may need returning something meaningful
    if (typeof statement === 'string') return scope[statement].type === FUNC ? `` : `(${scope[statement].global?'global':'local'}.get $${statement})`
    if (statement[0] in expr) return expr[statement[0]](statement) || ''
    err('Unknown operation `' + statement[0] + '`',statement)
  }

  Object.assign(expr, {
    // a; b; c;
    ';'([,...statements]){ let list=[]; for (let s of statements) list.push(expr(s)); return list.filter(Boolean).join('(drop)\n') },
    ','([,...statements]){ let list=[]; for (let s of statements) list.push(expr(s)); return list.filter(Boolean).join(' ') },

    // number primitives: 1.0, 2 etc.
    [FLOAT]([,a]) { return `(f64.const ${a})`},
    [INT]([,a]) { return `(i32.const ${a})`},

    '('(statement){
      return expr(statement[1])
    },

    '()'([,name,[,...args]]){
      return `(call $${name} ${args.map(arg=>expr(arg)).join(' ')})`
    },

    '-'([,a,b]) {
      // [-, [int, a]] -> (i32.const -a)
      if (!b) {
        if (a[0] == INT || a[0] == FLOAT) return expr([a[0], -a[1]])
        if (desc(a,scope).type == FLOAT) return `(f64.neg ${expr(a)})`
        return expr(['-',[INT,0],a[1]])
      }
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) return `(i32.sub ${expr(a)} ${expr(b)})`
      return `(f64.sub ${expr(asFloat(a))} ${expr(asFloat(b))})`
    },
    '+'([,a,b]) {
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) return `(i32.add ${expr(a)} ${expr(b)})`
      return `(f64.add ${expr(asFloat(a))} ${expr(asFloat(b))})`
    },
    '*'([,a,b]) {
      if (desc(a,scope).type == INT && desc(b,scope).type == INT) return `(i32.mul ${expr(a)} ${expr(b)})`
      // 1.0 * a -> a * 1.0
      if (a[0]===FLOAT && a[1]===1) [a,b] = [b,a]
      // a * 1.0 -> convert to float
      if (b[0]===FLOAT && b[1]===1) return `(f64.convert_i32_s ${expr(a)})`
      return `(f64.mul ${expr(asFloat(a))} ${expr(asFloat(b))})`
    },
    '/'(){
      err('Unimplemented, but needs to convert to float too')
    },
    '++'([,a]) { return expr(['+=',a,[INT,1]]) },
    '--'([,a]) { return expr(['-=',a,[INT,1]]) },
    '+='([,a,b]) { return expr(['=',a,['+',a,b]]) },
    '-='([,a,b]) { return expr(['=',a,['-',a,b]]) },
    '%%'([,a,b]) {
      // common case of int is array index access
      if (desc(a,scope).type === INT && desc(b,scope).type === INT) return extCall('i32.modwrap', a, b)
      err('Unimplemented: float modwrap')
    },

    // comparisons
    '<'([,a,b]) {
      let aDesc = desc(a, scope), bDesc = desc(b, scope)
      if (aDesc.type === INT && bDesc.type === INT) return `(i32.lt_s ${expr(a)} ${expr(b)})`
      return `(f64.lt ${expr(asFloat(a))} ${expr(asFloat(b))})`
    },
    '<='([,a,b]) {
      let aDesc = desc(a, scope), bDesc = desc(b, scope)
      if (aDesc.type === INT && bDesc.type === INT) return `(i32.le_s ${expr(a)} ${expr(b)})`
      return `(f64.le ${expr(asFloat(a))} ${expr(asFloat(b))})`
    },
    '>'([,a,b]) {
      let aDesc = desc(a, scope), bDesc = desc(b, scope)
      if (aDesc.type === INT && bDesc.type === INT) return `(i32.gt_s ${expr(a)} ${expr(b)})`
      return `(f64.gt ${expr(asFloat(a))} ${expr(asFloat(b))})`
    },
    '>='([,a,b]) {
      let aDesc = desc(a, scope), bDesc = desc(b, scope)
      if (aDesc.type === INT && bDesc.type === INT) return `(i32.ge_s ${expr(a)} ${expr(b)})`
      return `(f64.ge ${expr(asFloat(a))} ${expr(asFloat(b))})`
    },
    '=='([,a,b]) {
      let aDesc = desc(a, scope), bDesc = desc(b, scope)
      if (aDesc.type === INT && bDesc.type === INT) return `(i32.eq_s ${expr(a)} ${expr(b)})`
      return `(f64.eq ${expr(asFloat(a))} ${expr(asFloat(b))})`
    },
    '!='([,a,b]) {
      let aDesc = desc(a, scope), bDesc = desc(b, scope)
      if (aDesc.type === INT && bDesc.type === INT) return `(i32.ne_s ${expr(a)} ${expr(b)})`
      return `(f64.ne ${expr(asFloat(a))} ${expr(asFloat(b))})`
    },

    // logical - we put value twice to the stack and then just drop if not needed
    '||'([,a,b]) {
      if (desc(a,scope).type==FLOAT || desc(b,scope).type == FLOAT)
        return `${pick(2,asFloat(a))}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then) (else (drop) ${expr(asFloat(b))}))`
      else
        return `${pick(2,a)}(if (param i32) (result i32) (then) (else (drop) ${expr(b)}))`
    },
    '&&'([,a,b]) {
      if (desc(a,scope).type==FLOAT || desc(b,scope).type == FLOAT)
        return `${pick(2,asFloat(a))}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then (drop) ${expr(asFloat(b))}))`
      else
        return `${pick(2,a)}(if (param i32) (result i32) (then (drop) ${expr(b)}))`
    },

    '?:'([,a,b,c]){
      let bDesc = desc(b,scope), cDesc = desc(c,scope);
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
        if (desc(a,scope).type === INT && desc(min,scope).type === INT) return extCall('i32.smax', a, min)
        return `(f64.max ${expr(asFloat(a))} ${expr(asFloat(min))})`
      }
      // a -< ..10
      if (!min) {
        if (desc(a,scope).type === INT && desc(max,scope).type === INT) return extCall('i32.smin', a, max)
        return `(f64.min ${expr(asFloat(a))} ${expr(asFloat(max))})`
      }
      // a -< 0..10
      if (desc(a,scope).type == INT && desc(min,scope).type == INT && desc(max,scope).type == INT) {
        return extCall('i32.smax', ['-<',a,['..',undefined,max]], min)
      }
      return `(f64.max (f64.min ${expr(asFloat(a))} ${expr(asFloat(max))}) ${expr(asFloat(min))})`
    },

    // [1,2,3]
    '['([,[,...inits]]) {
      let out = ``, members = 0
      memcount += MEM_STRIDE // we unify memory stride to f64 steps to avoid js typed array buttheart
      // second i32 stores array rotation info like a << 1
      // FIXME: wouldn't it be easier to init static arrays via data section?
      for (let init of inits) {
        let idesc = desc(init,scope)
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
        let aDesc = desc(a,scope);
        if (aDesc.type !== BUF) err('Reading length of non-array', a);
        return extCall('buf.len', a)
      }
      err('Unimplemented prop access')
    },

    '='([,a,b]) {
      // FIXME: accept functions
      // x[y]=1, x.y=1
      if (a[0] === '[]' || a[0] === '.') {
        let [,buf,idx] = a
        if (a[0] === '.') idx = [INT, parseInt(idx)]

        // FIXME: add static optimization here for property - to avoid calling i32.modwrap if idx is known
        // FIXME: another static optimization: if length is known in advance (likely yes) - make static modwrap
        // FIXME: validate if ptr is real buffer and not fake, statically?;

        // FIXME: pass length modwrapped here
        return extCall('buf.store', buf, ['%%', asInt(idx), ['[]',buf]], asFloat(b))
      }

      // x(a,b) = y
      // if (desc(a,scope).type === FUNC) {
      if (a[0]==='()') {
        let [,name,[,...args]] = a, body = b;
        let dfn = [], parent = scope, prevLocals = locals
        scope = body.scope, locals = []

        // define init part - params, result
        args?.forEach(id => {
          scope[id]._defined = true
          dfn.push(`(param $${id} ${scope[id].type == BUF ? 'i32' : 'f64'})`)
        })
        if (body.result) dfn.push(`(result ${body.result.type == FLOAT ? 'f64' : 'i32'})`)

        // declare locals
        Object.getOwnPropertyNames(scope).filter(id=>!scope[id].arg).forEach(define)

        // init body - expressions write themselves to body
        globals.push(
          `(func $${name} ${dfn.join(' ')}\n` +
          locals.join('\n') +
          expr(body) +
          `(return)` +
          // (body.result ? `\n(return)` : ``) +
          `)`
        )

        scope = parent
        locals = prevLocals
        return
      }

      // a = b,  a = (b,c),   a = (b;c,d)
      if (typeof a === 'string') {
        if (scope[a].global) return `(global.set $${a} ${pick(1,b)})(global.get $${a})`
        else return `(local.tee $${a} ${pick(1,b)})`
      }

      // (a,b) = ...
      if (a[0]===',') {
        let [,...outputs] = a, inputs = desc(b,scope).members

        if (inputs) outputs = outputs.slice(0, inputs.length).reverse() // (a,b,c)=(c,d) -> (a,b)=(c,d)

        // set as `(i32.const 1)(i32.const 2)(local.set 0)(local.set 1)`
        return pick(outputs.length,b) +
          outputs.map(m=>scope[m].global?`(global.set $${m})`:`(local.set $${m})`).join('') +
          outputs.map(m=>scope[m].global?`(global.get $${m})`:`(local.get $${m})`).join('')
      }

      err('Strange assignment', node)
    },

    // a | b
    '|'([,a,b]) {
      // console.log('|',a,b)
      // 0 | b -> b | 0
      if (a[0] === INT && a[1] === 0) [a,b]=[b,a]
      if (b[0] === INT && b[1] === 0) {
        // 1.2 | 0  -> truncate float
        if (desc(a,scope).type === FLOAT) return `(i32.trunc_f64_s ${expr(a)}`
        // a | 0 -> skip
        return expr(1)
      }

      return `(i32.or ${expr(asInt(a))} ${expr(asInt(b))})`
    },

    // a |> b
    '|>'([,a,b]) {
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
    }
  })

  // wrap expression to float, if needed
  function asFloat(node) {
    if (desc(node, scope).type === FLOAT) return node
    return ['*',node,[FLOAT,1]];
  }
  // cast expr to int
  function asInt(node) {
    if (desc(node, scope).type === INT) return node
    return ['|',node,[INT,0]]
  }

  // define variable in current scope
  function define(name) {
    let v = scope[name]
    if (!v._defined && v.type !== FUNC) {
      let wtype = v.type === FLOAT ? 'f64' : 'i32'
      if (v.global) globals.push(`(global $${name} (mut ${wtype}) (${wtype}.const 0))`);
      else locals.push(`(local $${name} ${wtype})`)
      v._defined = true
    }
  }

  // add include from stdlib and return call
  function extCall(name, ...args) {
    if (!includes.includes(name)) includes.push(name)
    return `(call $${name} ${args.map(expr).join(' ')})`
  }

  // create args swapper/picker (fn that maps inputs to outputs), like (a,b,c) -> (a,b)
  function pick(count, group) {
    let {members,type} = desc(group,scope), name

    if (!members) {
      // a = b - skip picking
      if (count === 1) return expr(group)
      // (a,b,c) = d
      let wtype = type===INT?'i32':'f64'
      name = `$pick/${wtype}.${count}`
      if (!pickers.includes(name)) {
        pickers.push(name);
        globals.unshift(`(func ${name} (param ${wtype}) (result ${(wtype+' ').repeat(count)}) ${`(local.get 0)`.repeat(count)} (return))`)
      }
    }

    // N:M or 1:M picker
    else {
      name = `$pick/${members.map(d=>d.type===INT?'i32':'f64').join('')}.${count}`
      if (!pickers.includes(name)) {
        pickers.push(name);
        globals.unshift(`(func ${name} (param ${members.map(d=>d.type===INT?'i32':'f64').join(' ')}) (result ${members.slice(0,count).map(d=>d.type===INT?'i32':'f64').join(' ')}) ${members.slice(0,count).map((o,i) => `(local.get ${i})`).join('')} (return))`)
      }
    }

    return `(call ${name} ${expr(group)})`
  }


  // begin - pretend global to be a function init
  expr(['=',['()','module/init',[]],Object.assign(node,{scope:node.scope})])
  globals.push(`(start $module/init)`)

  // Provide exports
  let exp = ``
  for (let name in node.scope)
    if (node.scope[name].export)
      exp += `(export "${name}" (${node.scope[name].type === FUNC ? 'func' : 'global'} $${name}))`
  if (exp) globals.push(exp)

  // Declare includes
  for (let include of includes) {
    globals.unshift(stdlib[include])
  }

  // Declare memories
  if (memcount) globals.unshift(`(memory (export "memory") ${Math.ceil(memcount / F64_PER_PAGE)})`)

  console.log(globals.join('\n'))
  console.log(...parseWat(globals.join('\n')))

  return globals.join('\n')
}
