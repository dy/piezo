// compile source/ast to WAST
import { FLOAT, INT } from './const.js';
import parse from './parse.js';
import stdlib from './stdlib.js';
import precompile from './precompile.js';
import {ids, stringify, err, u82s} from './util.js';
// import {parse as parseWat} from 'watr';

let prevCtx, includes, imports, globals, locals, slocals, funcs, func, exports, datas, mem, returns, config, depth;

// limit of memory is defined as: (max array length i24) / (number of f64 per memory page i13)
const MAX_MEMORY = 2048, HEAP_SIZE = 1024

export default function compile(node, obj) {
  if (typeof node === 'string') node = parse(node)

  node = precompile(node);

  console.log('compile', node)

  // save previous compiling context
  prevCtx = { prevCtx, includes, imports, globals, locals, slocals, funcs, func, exports, datas, mem, returns, config, depth };

  // init compiling context
  globals = {}, // global scope (as name props)
  slocals = {}, // start fn local scope
  locals = null, // current fn local scope
  includes = [], // pieces of wasm to inject
  imports = [], // imported statements (regardless of libs) - funcs/globals/memory
  funcs = {}, // defined user and util functions
  exports = {}, // items to export
  returns = null, // returned items from block (collects early returns)
  func = null, // current function that's being initialized
  mem = 0, // indicates if memory must be included and how much bytes
  depth = 0, // current loop/nested block counter
  datas = {}, // static-size data sections
  config = obj || {}

  // run global in start function
  let init = expr(node).trim(), out = ``

  if (Object.keys(imports).length) {
    out += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Imports\n`
    for (let name in imports)
      out += `(import "${imports[name][0]}" "${imports[name][1]}" ${imports[name][2]})\n`
    out += `\n`
  }

  if (mem) out += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Memory\n` +
    `(memory (export "__memory") ${Math.ceil(mem / 65536)} ${MAX_MEMORY})\n(global $__mem (mut i32) (i32.const ${mem}))\n\n`;

  // declare datas
  for (let data in datas) {out += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Data\n`; break}
  for (let data in datas) {
    out += `(data (i32.const ${data}) "${datas[data]}")\n`
  }
  for (let data in datas) {out += `\n`; break}

  // declare includes
  if (includes.length) out += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Includes\n`;
  for (let include of includes)
    if (stdlib[include]) out += stdlib[include] + '\n\n';
    else err('Unknown include `' + include + '`')

  // declare variables
  // NOTE: it sets functions as global variables
  if (Object.keys(globals).length) {
    out += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Globals\n`
    for (let name in globals)
      if (!globals[name].import) out += `(global $${name} (mut ${globals[name].type}) (${globals[name].type}.const 0))\n`
    out += `\n`
  }

  // declare funcs
  for (let name in funcs) { out += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Functions\n`; break }
  for (let name in funcs) {
    out += funcs[name] + '\n\n'
  }

  // run globals init, if needed
  if (init) out += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Init\n` +
    `(func $__init\n` +
    (Object.keys(slocals).length ? Object.keys(slocals).map((name) => `(local $${name} ${slocals[name].type})`).join('') + '\n' : '') +
    init + `\n` +
    `(return))\n` +
    `(start $__init)\n\n`

  // provide exports
  for (let name in exports) { out += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Exports\n`; break }
  for (let name in exports)
    out += `(export "${name}" (${exports[name].func ? 'func' : 'global'} $${name}))\n`

  console.log(out);
  // console.log(...parseWat(out))

  // restore previous compiling context
  ({ prevCtx, includes, imports, globals, funcs, func, locals, slocals, exports, datas, mem, returns, config, depth } = prevCtx);
  return out
}

// processess global statements, returns nothing, only modifies globals, inits, out, memory
function expr(statement) {
  if (!statement) return ''

  // a; - just declare in proper scope
  // FIXME: funcs may need returning something meaningful
  if (typeof statement === 'string') {
    // just x,y; or a=x; where x is undefined
    statement = define(statement);
    return get(statement)
  }

  // cached
  if (statement.expr) return statement.expr
  if (statement[0] in expr) return statement.expr = expr[statement[0]](statement) || ''

  err(`Unknown operation ${statement}`)
}

Object.assign(expr, {
  // number primitives: 1.0, 2 etc.
  [FLOAT]([, a]) {
    return op(`(f64.const ${a})`, 'f64')
  },
  [INT]([, a]) {
    return op(`(i32.const ${a})`, 'i32')
  },

  // a; b; c;
  ';'([, ...statements]) {
    let list = [];
    for (let s of statements) s && list.push(expr(s));
    list = list.filter(Boolean)

    if (!list.length) return op()

    return op(
      list.map((op, i) => op + `(drop)`.repeat(i === list.length - 1 ? 0 : op.type.length)).join('\n'),
      list[list.length - 1].type
    )
  },

  ','([, ...statements]) {
    let list = [];
    for (let s of statements) list.push(expr(s));
    list = list.filter(Boolean)
    return op(
      list.join('\n'),
      list.flatMap(op => op.type)
    )
  },

  // (a)
  '('([, body]) {
    // FIXME: make sure returning nothing is fine here (when empty brackets)
    if (!body) return op('')

    // FIXME: detect block type, if it needs early return - then we ought to wrap it
    let parentReturns = returns;
    returns = [];

    let out = expr(body);

    // early returns are always f64, so for return consistency we wrap result into f64
    if (returns.length) {
      let l = out.type.length
      for (let ret of returns) {
        if (ret.type.length !== l) err(`Inconsistent returned members in \`${func}\``)
      }
      out = asFloat(out);
    }

    returns = parentReturns;

    return out;
  },

  '^'([, a]) {
    let aop = expr(a)
    returns.push(aop)
    // we enforce early returns to be f64
    return op(`(return ${asFloat(aop)})`, aop.type)
  },

  // a()
  '()'([, name, [,...args]]) {
    if (!globals[name]) err('Unknown function call: ' + name)

    // FIXME: make sure default args are gotten values?
    let { state } = globals[name]

    // if internal call is stateful, the current function becomes stateful either
    if (state) {
      const callerState = globals[func].state ||= []
        ; (globals[func].substate ||= {})[name] = callerState.length // save offset within caller state
      callerState.length += state.length
    }

    return op(`(call $${name} ${args.map(arg => asFloat(expr(arg))).join(' ')})`, 'f64')
  },

  // [1,2,3]
  '['([, [,...inits]]) {
    depth++

    // if all members are static - create static array
    // FIXME: make work with nested static arrays as well: [1,[2,x=[3,]]]
    if ((function isStatic ([,...inits]) {
      return inits.every(x => typeof x[1] === 'number' || (x[0] === '[' && isStatic(x.slice(1)), false))
    })(inits)) {
      const f64s = new Float64Array(inits.map(x => x[1]))
      const offset = mem
      mem += f64s.length << 3
      datas[offset] = u82s(new Uint8Array(f64s.buffer))
      const out = op(`(call $arr.ref (i32.const ${offset}) (i32.const ${f64s.length}))`, 'f64');
      depth--
      return inc('arr.ref'), out
    }

    let start = define(`start:${depth}`, 'i32'), end = define(`end:${depth}`, 'i32')
    let out = `(local.set $${end} (local.tee $${start} (call $malloc (i32.const ${HEAP_SIZE}))))\n` // allocate array of HEAP_SIZE (trimmed after)

    // each element saves value to memory and increases heap pointer in stack
    for (let init of inits) {
      // [a..b], [..b]
      if (init[0] === '..') {
        err('Unimplemented')
        let [, min, max] = init
        if (!max) err('Arrays cannot be constructed from right-open ranges, TODO passed')

        // [..1] - just skips heap
        if (!min && typeof max[1] === 'number') {
          out += `(global.get $__heap)(i32.add (i32.shl (i32.const ${max[1]}) (i32.const 3)))(global.set $__heap)\n`
          heap = Math.max(heap, (max[1] - 1 >> 13) + 1) // increase heap
        }
        // [x..y] - generic computed range
        else {
          inc('range')
          // increase heap
          if (typeof min[1] === 'number' && typeof max[1] === 'number') heap = Math.max(heap, ((max[1] - min[1] - 1) >> 13) + 1)
          // create range in memory from ptr in stack
          out += `(global.get $__heap)(call $range ${asFloat(expr(min))} ${asFloat(expr(max))} (f64.const 1))(global.set $__heap)\n`
        }
      }
      // [a..b <| ...] - comprehension
      else if (init[0] === '<|') {
        err('Unimplemented')
        // let lop = loop(init, true)
        // out += `(i32.add ${lop})`;
        // TODO: comprehension - expects heap address in stack, puts loop results into heap
      }
      // [x*2, y] - single value
      // FIXME: can be unwrapped in precompiler as @memory[end++] = init;
      else out += `(f64.store (i32.sub (local.tee $${end} (i32.add (local.get $${end}) (i32.const 8))) (i32.const 8)) ${asFloat(expr(init))})\n`
    }

    // move buffer to static memory: references static address, deallocates heap tail
    inc('malloc'), inc('arr.ref'), mem ||= 0

    out +=
      // deallocate memory
      `(global.set $__mem (local.get $${end}))\n` +
      // create array reference
      `(call $arr.ref (local.get $${start}) (i32.shr_u (i32.sub (local.get $${end}) (local.get $${start})) (i32.const 3)))\n`

    // FIXME: defragment (move) internal arrays, now each array has heap size

    depth--
    return op(out, 'f64', { buf: true })
  },

  '"'([, str]) {
    // create static array in memory
    // FIXME: handle unicodes
    // FIXME: handle escapes
    // we convert string from uint8 to f64 chars
    datas[mem] = [...(new TextEncoder()).encode(str)]
    const out = op(`(call $arr.ref ${mem} ${str.length})`, 'f64')
    mem += (str.length << 3)
    return out
  },

  // a[b] or a[]
  '[]'([, a, b]) {
    inc('arr.len'), inc('i32.modwrap')

    // a[] - length
    if (!b) return op(`(call $arr.len ${expr(a)})`, 'i32')

    // a[0] - static index read
    if (typeof b[1] === 'number') {
      console.log('read', a, b)
    }

    // a[b] - regular access
    return inc('arr.get'), op(`(call $arr.get ${expr(a)} ${expr(b)})`, 'f64')
  },

  '='([, a, b]) {
    // x[y]=1, x.y=1
    if (a[0] === '[]') {
      let [, buf, idx] = a

      // a[0] - static index read
      // FIXME: static optimization property - to avoid calling i32.modwrap if idx/len is known
      // FIXME: another static optimization: if length is known in advance (likely yes) - make static modwrap

      return inc('arr.len'), inc('arr.set'), inc('i32.modwrap'), op(`(call $arr.tee ${expr(buf)} ${asInt(expr(idx))} ${asFloat(expr(b))})`, 'f64')
    }

    // a = b,  a = (b,c),   a = (b;c,d)
    if (typeof a === 'string') {
      if (globals[a]?.func) err(`Redefining function '${a}' is not allowed`)
      a = define(a)
      const bop = expr(b)
      if (!bop.type?.length) err(`Cannot use void operator \`${b[0]}\` as right-side value`)
      return tee(a, asFloat(bop))
    }

    // x(a,b) = y
    if (a[0] === '()') {
      let [, name, [,...args]] = a, body = b, inits = [], result, dfn = [], prepare = [], defer = []

      // functions defined within scope of other functions, `x()=(y(a)=a;)`
      if (locals) err('Declaring local function `' + name + '`: not allowed');

      // FIXME: maybe it's ok to redeclare function? then we'd need to use table
      if (globals[name]) err('Redefining function `' + name + '`: not allowed');

      let prevFunc = func
      func = name

      locals = {}

      // detect optional / clamped args
      args = args.map(arg => {
        let name, init

        // x(a,b)
        if (typeof arg === 'string') name = arg
        // x(a=1,b=2), x(a=(1;2))
        else if (arg[0] === '=') [, name, init] = arg, inits.push(['?', ['!=', name, name], ['=', name, init]])
        // x(x<?2..3)
        else if (arg[0] === '<?') [, name, init] = arg, inits.push(['<?=', name, arg[2]])
        else err('Unknown function argument')

        locals[name] = { arg: true, type: 'f64' }

        dfn.push(`(param $${name} f64)`)
        return name
      })

      // FIXME: put function to a table
      // pointer to a function - need to be declared before parsing body, since body may contain refs
      globals[name] = { func: true, args, type: 'i32' };

      body[1].splice(1, 0, ...inits) // prepend inits

      result = expr(body)

      // define result, comes after (param) before (local)
      if (result.type.length) dfn.push(`(result ${result.type.join(' ')})`)

      // declare locals
      for (let name in locals) if (!locals[name].arg) dfn.push(`(local $${name} ${locals[name].type})`)

      // if fn is stateful - defer saving values
      // FIXME: possibly we may need to upgrade state vars to always read/write from memory, but now too complicated
      globals[name].state?.forEach(name => {
        defer.push(`(f64.store (local.get $${name}.adr) (local.get $${name}))`)
      })
      locals = null

      let initState

      // alloc state, if required
      if (globals[name].state) {
        // state is just region of memory storing sequence of i32s - pointers to memory holding actual state values
        define(name + '.state', 'i32')
        inc('malloc'), mem ||= 0
        initState = op(`(global.set $${name}.state (call $malloc (i32.const ${globals[name].state.length << 2})))`)
      }

      // if has calls to internal stateful funcs (indirect state) - push state to stack, to recover on return
      for (let fn in globals[name].substate) {
        dfn.push(`(local $${fn}.prev i32)`)
        // NOTE: we can't push/pop state from stack because fn body produces result (output) that will cover stack
        prepare.push(`(local.set $${fn}.prev (global.get $${fn}.state))`) // save prev state
        // put local state fragment to the stack
        prepare.push(`(global.set $${fn}.state (i32.add (global.get $${name}.state) (i32.const ${globals[name].substate[fn] << 2})))`)
        defer.push(`(global.set $${fn}.state (local.get $${fn}.prev))`) // load prev state
      }

      // init body - expressions write themselves to body
      funcs[name] = `(func $${name} ${dfn.join(' ')}` +
        (prepare.length ? `\n${prepare.join('\n')}` : ``) +
        (result ? `\n${result}` : ``) +
        (defer.length ? `\n${defer.join(' ')}` : ``) +
        `)`

      func = prevFunc

      return initState
    }

    err(`Unknown assignment left value \`${stringify(a)}\``)
  },

  // a |> b
  '|>'([, a, b]) {
    // a..b |> ...
    // FIXME: step via a..b/step?
    // FIXME: curve via a..b?
    if (a[0] === '..') {
      depth++
      // i = from; to; while (i < to) {@ = i; ...; i++}
      const [, min, max] = a
      const cur = define('@', 'f64'),
        idx = define(`idx:${depth}`, 'f64'),
        end = define(`end:${depth}`, 'f64'),
        body = expr(b), type = body.type.join(' ')

      const out = `;; |>:${depth}\n` +
        set(idx, asFloat(expr(min))) + '\n' +
        `(local.set $${end} ${asFloat(expr(max))})\n` +
        body.type.map(t => `(${t}.const 0)`).join('') + '\n' + // init result values
        `(loop (param ${type}) (result ${type})\n` +
          `(if (param ${type}) (result ${type}) (f64.le ${get(idx)} (local.get $${end}))\n` + // if (@ < end)
            `(then\n` +
              `${`(drop)`.repeat(body.type.length)}\n` +
              `${set(cur, get(idx))} \n` +
              `${body}\n` +
              `${set(idx, op(`(f64.add ${get(idx)} (f64.const 1))`, 'f64'))}\n` +
              // FIXME: step can be adjustable
              // `(call $f64.log (global.get $${idx}))` +
              `(br 1)\n` +
            `)` +
          `)` +
        `)`

      depth--
      return op(out, body.type)
    }

    // list |> ...
    else {
      err('loop over list: unimplemented')
      let aop = expr(a)
      // (a,b,c) <| ...
      if (aop.type.length > 1) {
        // we create tmp list for this group and iterate over it, then after loop we dump it into stack and free memory
        // i=0; to=types.length; while (i < to) {@ = stack.pop(); ...; i++}
        from = `(f64.const 0)`, to = `(f64.const ${aop.type.length})`
        next = `(f64.load (i32.add (global.get $__heap) (local.get $${idx})))`
        // push args into heap
        // FIXME: there must be more generic copy-to-heap thing, eg. `(a, b..c, d<|e)`
        err('Sequence iteration is not implemented')
        for (let i = 0; i < aop.type.length; i++) {
          let t = aop.type[aop.type.length - i - 1]
          out += `${t === 'i32' ? '(f64.convert_i32_s)' : ''}(f64.store (i32.add (global.get $__heap) (i32.const 8)))`
        }
      }
      // (0..10 <| a ? ^b : c) <| ...
      else if (aop.dynamic) {
        err('Unimplemented: dynamic loop arguments')
        // dynamic args are already in heap
        from = `(i32.const 0)`, to = `(global.get $__heap)`
        next = `(f64.load (i32.add (global.get $__heap) (local.get $${idx})))`
        // FIXME: must be reading from heap: heap can just be a list also
      }
      // list <| ...
      else {
        // i = 0; to=buf[]; while (i < to) {@ = buf[i]; ...; i++}
        inc('arr.len'), inc('arr.get')

        const src = tmp('src'), len = tmp('len', 'i32')
        out +=
          `(local.set $${src} ${aop})\n` +
          `(local.set $${idx} (i32.const 0))\n` +
          `(local.set $${len} (call $arr.len (local.get $${src})))\n` +
          `(loop (result f64) \n` +
          `(locals.tee $${item} (call $arr.get (local.get $${src}) (local.get $${idx})))\n` +
          `(if (param f64) (result f64) (i32.le_u (local.get $${idx}) (local.get $${len}))\n` +
          `(then\n` +
            `${expr(b)}\n` +
            `(local.set $${idx} (i32.add (local.get $${idx}) (i32.const 1)))\n` +
            // `(call $f64.log (global.get $${item}))` +
            `(br 1)\n` +
          `)\n` +
          `))\n`
      }
    }

    depth--
    return op(out, 'f64', { dynamic: true })
  },

  // a <| (b,c)->d
  '<|'([, a, b]) {
    err('<| unimplemented')
  },

  '-'([, a, b]) {
    // [-, [int, a]] -> (i32.const -a)
    if (!b) {
      let res = expr(a)
      if (res.type.length > 1) err('Group negation: unimplemented')
      if (res.type[0] === 'i32') return op(`(i32.sub (i32.const 0) ${res})`, 'i32')
      return op(`(f64.neg ${res})`, 'f64')
    }

    let aop = expr(a), bop = expr(b)

    if (aop.type.length > 1 || bop.type.length > 1) err('Group subtraction: unimplemented')
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.sub ${aop} ${bop})`, 'i32')
    return op(`(f64.sub ${asFloat(aop)} ${asFloat(bop)})`, 'f64')
  },
  '+'([, a, b]) {
    let aop = expr(a), bop = expr(b)

    if (aop.type[0] == 'i32' && bop.type[0] == 'i32') return op(`(i32.add ${aop} ${bop})`, 'i32')
    return op(`(f64.add ${asFloat(aop)} ${asFloat(bop)})`, 'f64')
  },
  '*'([, a, b]) {
    // stateful variable
    if (!b) {
      if (!func) err('State variable declared outside of function')
      const state = globals[func].state ||= []

      // *i;
      if (typeof a === 'string') {
        define(a);
        state.push(a)
        return;
      }
      // *i=10; *i=[0..10];
      if (a[0] === '=') {
        let [, name, init] = a
        name = define(name);
        inc('malloc'), mem ||= 0

        let ptr = define(name + '.adr', 'i32'), // ptr stores variable memory address
          stateName = func + `.state`,
          res =
            // first calculate state cell
            `(local.set $${ptr} (i32.add (global.get $${stateName}) (i32.const ${state.length << 2})))\n` +
            // if pointer is zero - init state
            `(if (result f64) (i32.eqz (i32.load (local.get $${ptr})))\n` +
            `(then\n` +
            // allocate memory for a single variable
            `(i32.store (local.get $${ptr}) (local.tee $${ptr} (call $malloc (i32.const 8))))\n` +
            // initialize value in that location (saved to memory by fn defer)
            `(local.tee $${name} ${asFloat(expr(init))})\n` +
            `)\n` +
            `(else \n` +
            // local variable from state ptr
            `(local.tee $${name} (f64.load (local.tee $${ptr} (i32.load (local.get $${ptr})))))\n` +
            `)` +
            `)\n`

        state.push(name);
        return op(res, 'f64');
      }
      // *(i,j)=10,20;
      err('State variable: unimplemented')
    }

    // group multiply
    let aop = expr(a), bop = expr(b)

    if (aop.type.length > 1 || bop.type.length > 1) {
      err('Complex group multiplication is not supported')
      // FIXME: complex multiple members, eg.
      // (x ? a,b : c,d) * (y ? e,f : g,h);
      // (... (x ? ^^a,b); ...; c,d) * y(); ;; where y returns multiple values also
      // (a <| @) * (b <| @);
    }

    return op(`(f64.mul ${asFloat(aop)} ${asFloat(bop)})`, 'f64')
  },
  '/'([, a, b]) {
    let aop = expr(a), bop = expr(b)
    return op(`(f64.div ${asFloat(aop)} ${asFloat(bop)})`, 'f64')
  },
  // sqrt
  '/*'([, a]) {
    return op(`(f64.sqrt ${asFloat(expr(a))})`, 'f64')
  },
  '**'([, a, b]) {
    let aop = expr(a), bop = expr(b)
    return inc('f64.pow'), op(`(call $f64.pow ${asFloat(aop)} ${asFloat(bop)})`, 'f64')
  },
  '|'([, a, b]) {
    let aop = expr(a), bop = expr(b);
    // x | 0
    if (b[1] === 0) return asInt(aop);
    return op(`(i32.or ${asInt(aop)} ${asInt(bop)})`, 'i32')
  },

  '%%'([, a, b]) {
    // common case of int is array index access
    if (getDesc(a).type === INT && getDesc(b).type === INT) return inc('i32.modwrap'), call('i32.modwrap', a, b)
    return inc('f64.modwrap'), expr(['()', 'f64.modwrap', [',', a, b]])
  },
  // comparisons
  '<'([, a, b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.lt_s ${aop} ${bop})`, 'i32')
    return op(`(f64.lt ${asFloat(aop)} ${asFloat(bop)})`, 'i32')
  },
  '<='([, a, b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.le_s ${aop} ${bop})`, 'i32')
    return op(`(f64.le ${asFloat(aop)} ${asFloat(bop)})`, 'i32')
  },
  '>'([, a, b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.gt_s ${aop} ${bop})`, 'i32')
    return op(`(f64.gt ${asFloat(aop)} ${asFloat(bop)})`, 'i32')
  },
  '>='([, a, b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.ge_s ${aop} ${bop})`, 'i32')
    return op(`(f64.ge ${asFloat(aop)} ${asFloat(bop)})`, 'i32')
  },
  '=='([, a, b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.eq_s ${aop} ${bop})`, 'i32')
    return op(`(f64.eq ${asFloat(aop)} ${asFloat(bop)})`, 'i32')
  },
  '!='([, a, b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.ne_s ${aop} ${bop})`, 'i32')
    return op(`(f64.ne ${asFloat(aop)} ${asFloat(bop)})`, 'i32')
  },

  // logical - we put value twice to the stack and then just drop if not needed
  '||'([, a, b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] == 'f64') return op(`${pick(2, aop)}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then) (else (drop) ${asFloat(bop)}))`, 'f64')
    if (bop.type[0] == 'i32') return op(`${pick(2, aop)}(if (param i32) (result i32) (then) (else (drop) ${bop}))`, 'i32')
    return op(`${pick(2, aop)}(if (param i32) (result f64) (then (f64.convert_i32_s)) (else (drop) ${asFloat(bop)}))`, 'f64')
  },
  '&&'([, a, b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type[0] == 'f64') return op(`${pick(2, aop)}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then (drop) ${asFloat(bop)}))`, 'f64')
    if (bop.type[0] == 'i32') return op(`${pick(2, aop)}(if (param i32) (result i32) (then (drop) ${bop}))`, 'i32')
    return op(`${pick(2, aop)}(if (param i32) (result f64) (then (f64.convert_i32_s) (drop) ${asFloat(bop)}))`, 'f64')
  },

  // parsing alias ? -> ?:
  '?'([, a, b]) {
    let aop = expr(a), bop = expr(b)
    if (aop.type.length > 1) err('Group condition is not supported.')
    return op(`(if ${aop.type[0] == 'i32' ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${asFloat(bop)}(drop) ))`, null)
  },
  '?:'([, a, b, c]) {
    let aop = expr(a), bop = expr(b), cop = expr(c)

    if (aop.type.length > 1) err('Group condition is not supported.')

    // FIXME: (a,b) ? c : d
    // FIXME: (a,b) ? (c,d) : (e,f)
    // FIXME: a ? (b,c) : (d,e)
    return op(`(if (result f64) ${aop.type[0] == 'i32' ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${asFloat(bop)} ) (else ${asFloat(cop)}))`, 'f64')
  },

  // a <? range - clamp a to indicated range
  '<?'([, a, b]) {
    if (b[0] !== '..') err('Non-range passed as right side of clamp operator')
    let [, min, max] = b, aop = expr(a), minop = min && expr(min), maxop = max && expr(max)

    // a <? 0..
    if (!max) {
      if (aop.type[0] === 'i32' && minop.type[0] === 'i32') return inc('i32.smax'), op(`(call $i32.max ${aop} ${minop})`, 'i32')
      return op(`(f64.max ${asFloat(aop)} ${asFloat(minop)})`, 'f64')
    }
    // a <? ..10
    if (!min) {
      if (aop.type[0] === 'i32' && maxop.type[0] === 'i32') return inc('i32.smin'), op(`(call $i32.min ${aop} ${maxop})`, 'i32')
      return op(`(f64.min ${asFloat(aop)} ${asFloat(maxop)})`, 'f64')
    }
    // a <? 0..10
    if (aop.type == 'i32' && minop.type == 'i32' && maxop.type == 'i32') {
      return inc('i32.smax'), inc('i32.smin'), op(`(call $i32.smax (call $i32.smin ${aop} ${maxop}) ${minop})`, 'i32')
    }
    return op(`(f64.max (f64.min ${asFloat(aop)} ${asFloat(maxop)}) ${asFloat(minop)})`, 'f64')
  },

  // <math#sin>, <path/to/lib>
  '<>'([, path]) {
    if (locals) err('Import must be in global scope')
    path = path.trim();
    if (path[0] === "'" || path[0] === '"') path = path.slice(1, -1);
    let url = new URL('import:' + path)
    let { hash, pathname } = url

    let lib = config.imports?.[pathname]
    if (!lib) err(`Unknown import entry '${pathname}'`)

    // FIXME: include directive into syntax tree
    // let src = fetchSource(pathname)
    // let include = parse(src)
    // node.splice(node.indexOf(impNode), 1, null, include)

    let members = hash ? hash.slice(1).split(',') : Object.keys(lib)
    for (let member of members) {
      const val = lib[member]
      if (typeof val === 'number') {
        // FIXME: here can be mutable global object
        globals[member] = { var: true, import: true, type: 'f64' }
        imports.push([pathname, member, `(global $${member} f64)`])
      }
      else if (typeof val === 'function') {
        // FIXME: function may return multiple values, but how to detect that?
        imports.push([pathname, member, `(func $${member} ${val.length ? `(param${` f64`.repeat(val.length)})` : ''} (result f64))`])
        globals[member] = { func: true, import: true, type: 'i32' }
      }
    }
    // we return nothing since member is marked as imported
    return ''
  },

  // a,b,c . x?
  '.'([, a, b]) {
    // a.b
    if (b) {
      // a.0 - index access - doesn't require modwrap
      let idx = isNaN(Number(b)) ? err('Alias access is unimplemented') : Number(b)
      return op(`(f64.load (i32.add ${asInt(expr(a))} (i32.const ${idx << 3})))`, 'f64')
    }

    if (locals) err('Export must be in global scope')
    // FIXME: if (expNode !== node && expNode !== node[node.length-1]) err('Export must be the last node');

    let res = expr(a)

    // generic exports, excluding private names
    for (let id of ids(a)) if (!id.includes(':')) exports[id] = globals[id] || err('Unknown export member `' + id + `'`)

    return res
  },
})

// return (local.set) or (global.set) (if no init - takes from stack)
function set(name, init = '') {
  return op(`(${locals?.[name] || slocals?.[name] ? 'local' : 'global'}.set $${name} ${init})`, null)
}

function get(name) {
  return op(`(${locals?.[name] || slocals?.[name] ? 'local' : 'global'}.get $${name})`, (locals?.[name] || slocals?.[name] || globals[name]).type)
}

function tee(name, init) {
  return op(locals?.[name] || slocals?.[name] ? `(local.tee $${name} ${init})` : `(global.set $${name} ${init})(global.get $${name})`, init.type)
}

// define variable in current scope, export if necessary; returns resolved name
// if name includes `:` - it enforces local name (in start local function)
function define(name, type = 'f64') {
  if (locals?.[name] || slocals?.[name] || globals?.[name]) return name;
  ; (locals || (name.includes(':') ? slocals : globals))[name] = { var: true, type }
  return name
}

// wrap expression to float, if needed
function asFloat(o) {
  if (o.type[0] === 'f64') return o
  if (o.startsWith('(i32.const')) return op(o.replace('(i32.const', '(f64.const'), 'f64')
  return op(`(f64.convert_i32_s ${o})`, 'f64')
}
// cast expr to int
function asInt(o) {
  if (o.type[0] === 'i32') return o
  return op(`(i32.trunc_f64_s ${o})`, 'i32')
}

// add include from stdlib and return call
function inc(name) {
  if (!includes.includes(name)) includes.push(name)
}

/**
 * Pick N input args into stack, like (a,b,c) -> (a,b)
 *
 * @param {number} count - number of elements to pick
 * @param {string} input - stringified operation
 * @returns {string}
 */
function pick(count, input) {
  // (a,b,c) = d - we duplicate d to stack
  if (input.type.length === 1) {
    // a = b - skip picking
    if (count === 1) return input
    // (a,b,c) = d - duplicating via tmp var is tentatively faster & more compact than calling a dup function
    const name = define(`dup:${input.type[0]}`, input.type[0])
    return op(
      `(local.set $${name} ${input})${`(local.get $${name})`.repeat(count)}`,
      Array(count).fill(input.type[0])
    )
  }

  // (a,b) = (c,d) - avoid picking since result is directly put into stack
  if (input.type.length === count) return input

  // (a,b) = (c,d,e) – drop redundant members
  if (count < input.type.length) return op(input + `(drop)`.repeat(input.type.length - count), input.type.slice(0, count))

  // (a,b,c) = (d,e) – pick a & b, skip c
  if (count > input.type.length) err('Picking more members than available')

  // NOTE: repeating els like (a,b,c)=(b,c,a) are not a threat, we don't need a function
  // putting them directly to stack is identical to passing to pick(b,c,a) as args
}

// create op result
// holds number of returns (ops)
// makes sure it stringifies properly into wasm expression
// provides any additional info: types, static, min/max etc
// supposed to be a replacement for getDesc to avoid mirroring every possible op
function op(str = '', type, info = {}) {
  str = new String(str)
  if (!type) type = []
  else if (typeof type === 'string') type = [type]
  return Object.assign(str, { type, ...info })
}

// fetch source file by path - uses import maps algorighm
// FIXME: can extend with importmap
const coreModules = { math: './math.lino' }
function fetchSource(path) {
  let fullPath = import.meta.resolve(coreModules[path])
  let xhr = new XMLHttpRequest()
  xhr.open('GET', fullPath, false /* SYNCHRONOUS XHR FTW :) */)
  xhr.send(null)
  // result = (nodeRequire ('fs').readFileSync (path, { encoding: 'utf8' }))
  return xhr.responseText
}