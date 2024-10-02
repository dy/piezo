// compile source/ast to WAST
import { FLOAT, INT } from './const.js';
import parse from './parse.js';
import precompile from './precompile.js';
import { ids, stringify, err, u82s, pretty } from './util.js';
import { compile as watr } from 'watr';
import { op, float, int, set, get, tee, call, include, pick, i32, f64, cond, loop, isConstExpr, defineFn } from './build.js'

export let imports, // imported statements (regardless of libs) - funcs/globals/memory
  globals,  // global scope (as name props), { init: #initValue, type: 'f64', static: bool}
  locals,  // current fn local scope (or module init function scope)
  funcs,  // defined user and util functions
  func,  // current function (name string) that's being initialized
  initing, // is first line in function, since it forces local-only vars
  exports,  // items to export
  datas,  // static-size data sections
  mem,  // indicates if memory must be included and how much bytes
  returns, // returned items from current fn (collects early returns)
  defers,  // deferred expressions (within current fn)
  depth;  // current loop/nested block counter

// limit of memory is defined as: (max array length i24) / (number of f64 per memory page i13)
const MAX_MEMORY = 2048, HEAP_SIZE = 1024

// reserved types
// f64 - float numbers / arrays
// i32 - integers
// i64 - int arrays? ranges?
// f32 - heap ref?
// v128 -
//

export default function compile(node, config = {}) {
  if (typeof node === 'string') node = parse(node)

  node = precompile(node);

  console.log('compile', node)

  // save previous compiling context
  let prevCtx = { imports, globals, locals, funcs, func, exports, datas, mem, returns, defers, depth };

  // init compiling context
  globals = {}
  locals = {}
  imports = []
  funcs = {}
  exports = {}
  returns = null
  defers = null
  func = null
  mem = false
  depth = 0
  datas = {}

  // run global in start function
  let init = expr(node, true).trim(), code = ``

  // collect exports from last statement
  const lastNode = node[0] === ';' ? node[node.length - 1] : node

  // generic exports, excluding private names
  for (let id of ids(lastNode)) if (!id.includes(':')) exports[id] = globals[id] || funcs[id] || err('Unknown export member `' + id + `'`)

  if (Object.keys(imports).length) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Imports\n`
    for (let name in imports)
      code += `(import "${imports[name][0]}" "${imports[name][1]}" ${imports[name][2]})\n`
    code += `\n`
  }

  if (mem !== false) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Memory\n`

    if (config.memory) {
      code += `(import "imports" "memory" (memory ${Math.ceil(mem / 65536)} ${MAX_MEMORY}))\n`
    }
    code += `(memory (export "memory") ${Math.ceil(mem / 65536)} ${MAX_MEMORY})\n(global $__mem (mut i32) (i32.const ${mem}))\n\n`;
  }

  // declare datas
  for (let data in datas) { code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Data\n`; break }
  for (let data in datas) {
    code += `(data (i32.const ${data}) "${datas[data]}")\n`
  }
  for (let data in datas) { code += `\n`; break }

  // declare variables
  // NOTE: it sets functions as global variables
  for (let name in globals) if (!name.includes(':')) { code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Globals\n`; break; }
  for (let name in globals)
    if (!globals[name].import) code += `(global $${name} (mut ${globals[name].type}) ${globals[name].init || `(${globals[name].type}.const 0)`})\n`
  code += `\n`

  // declare funcs
  for (let name in funcs) { code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Functions\n`; break }
  for (let name in funcs) {
    code += pretty(funcs[name]) + '\n\n'
  }

  // run globals init, if needed
  if (init) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Init\n` +
      pretty(`(func $module:start
    ${Object.keys(locals).map((name) => `(local $${name} ${locals[name].type})`).join('')}
    ${init}
    (return))`) +
      `\n(start $module:start)\n\n`
  }

  // provide exports
  for (let name in exports) { code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Exports\n`; break }
  for (let name in exports) {
    code += `(export "${name}" (${funcs[name] ? 'func' : 'global'} $${name}))\n`;
  }
  console.groupCollapsed()
  console.log(code);
  console.groupEnd();
  // restore previous compiling context
  ({ imports, globals, funcs, func, locals, exports, datas, mem, returns, defers, depth } = prevCtx);

  if (config?.target === 'wasm')
    code = watr(code)

  return code
}

// convert statement to operation string
// @out suggests if output value[s] must be saved on stack or discarded
// since some expressions can be optimized (loops) if value can be discarded
function expr(statement, out = true) {
  if (!statement) return ''

  // a; - just declare in proper scope
  // FIXME: funcs may need returning something meaningful
  if (typeof statement === 'string') {
    // just x,y; or a=x; where x is undefined
    locals[statement] ||= { type: 'f64' }
    return out ? get(statement) : op()
  }

  // if (typeof statement === 'number') return op(`(f64.const ${statement})`, 'f64')

  // cached
  if (statement.expr) return statement.expr
  if (statement[0] in expr) return statement.expr = expr[statement[0]](statement, out) || op()

  err(`Unknown operation ${statement}`)
}

Object.assign(expr, {
  // number primitives: 1.0, 2 etc.
  [FLOAT]([, a], out) {
    return out && f64.const(a)
  },
  [INT]([, a], out) {
    return out && i32.const(a)
  },

  '"'([, str], out) {
    if (!out) return
    // create static array in memory
    // FIXME: handle unicodes
    // FIXME: handle escapes
    // we convert string from uint8 to f64 chars
    datas[mem] = [...(new TextEncoder()).encode(str)]
    const result = call('arr.ref', mem, str.length)
    mem += (str.length << 3)
    return result
  },

  // a; b; c;
  ';'([, ...statements], out) {
    let last = statements.length - 1
    // return last statement always
    let list = statements.map((s, i) => (initing = !i, expr(s, i == last ? out : false)))
    return op(list.join('\n'), list[last]?.type)
  },

  ','([, ...statements], out) {
    let list = [];
    for (let s of statements) list.push(expr(s, out));
    list = list.filter(Boolean)
    return op(
      list.join('\n'),
      out && list.flatMap(op => op.type)
    )
  },

  // a()
  '('([, name, [, ...args]], out) {
    if (!funcs[name]) err('Unknown function call: ' + name)

    if (out) return call(name, args.map(arg => float(expr(arg))))
    return op(call(name, args.map(arg => float(expr(arg)))) + `(drop)`.repeat(!out && funcs[name].type.length))
  },

  // [1,2,3]
  '[]'([, [, ...inits]], out) {
    mem ||= 0

    // [] - skip
    if (!inits.length) return out && op(f64.const(0), 'f64')

    depth++

    // [1,2,3] - static array
    // FIXME: make work with nested static arrays as well: [1,[2,x=[3,]]]
    if ((function isPrimitive(inits) {
      return inits.every(x => !x || (typeof x[1] === 'number' || (x[0] === '[' && isPrimitive(x.slice(1)))))
    })(inits)) {
      const f64s = new Float64Array(inits.map(x => x ? x[1] : 0))
      const offset = mem
      mem += f64s.length << 3
      datas[offset] = u82s(new Uint8Array(f64s.buffer))

      depth--
      // x()=([1,2,3]) must allocate new instance every time
      if (func) {
        let tmp = `arr:${depth}`
        locals[tmp] = { type: 'i32' }
        return include('malloc'), include('arr.ref'), op(
          set(tmp, call('malloc', i32.const(f64s.length << 3))) +
          `(memory.copy ${get(tmp)} ${i32.const(offset)} ${i32.const(f64s.length << 3)})` +
          call('arr.ref', get(tmp), i32.const(f64s.length))
          , 'f64')
      }
      else {
        return include('arr.ref'), out && call('arr.ref', i32.const(offset), i32.const(f64s.length))
      }
    }

    // [a, b..c, d |> e]
    let start = `arr.start:${depth}`, ptr = `arr.ptr:${depth}`
    locals[start] = { type: 'i32' }
    locals[ptr] = { type: 'i32' }
    include('malloc')
    // allocate array of HEAP_SIZE (trimmed after)
    let str = set(ptr, tee(start, call('malloc', i32.const(HEAP_SIZE))))

    // each element saves value to memory and increases heap pointer in stack
    for (let init of inits) {
      // [a..b], [..b]
      if (init[0] === '..') {
        let [, min, max] = init
        if (max[1] === Infinity) err(`Arrays cannot be constructed from right-open ranges`)

        // [..1] - just skips heap
        if (min[1] === -Infinity && typeof max[1] === 'number') {
          // [..-1]
          if (max[1] < 0) err(`Bad array range`)
          str += set(ptr, i32.add(get(ptr), i32.const(max[1] << 3)))
        }
        // [x..y] - generic computed range
        else {
          // create range in memory from ptr in stack
          let i = `range.i:${depth}`, to = `range.end:${depth}`
          locals[i] = locals[to] = { type: 'f64' }
          str += set(i, float(expr(min))) + set(to, float(expr(max)))
          str += loop(
            cond(
              f64.lt(get(i), get(to)),
              f64.store(get(ptr), get(i)) +
              set(ptr, i32.add(get(ptr), i32.const(8))) +
              set(i, f64.add(get(i), f64.const(1))) +
              `(br 1)`
            )
          )
        }
      }
      // [a..b |> ...] - comprehension
      else if (init[0] === '|>') {
        // we render expression into heap and save it as array
        str += expr(init)
        // let lop = loop(init, true)
        // str += `(i32.add ${lop})`;
        // TODO: comprehension - expects heap address in stack, puts loop results into heap
      }
      // [x*2, y] - single value
      // FIXME: can be unwrapped in precompiler as @memory[ptr++] = init;
      else str += f64.store(i32.sub(tee(ptr, i32.add(get(ptr), i32.const(8))), i32.const(8)), float(expr(init)))
    }

    // move buffer to static memory: references static address, deallocates heap tail
    include('malloc'), include('arr.ref')

    // deallocate memory (set beginning of free memory to pointer after array)
    str += `(global.set $__mem ${get(ptr)})`

    // FIXME: defragment (move) internal arrays, now each array has heap size
    depth--

    // create array reference
    if (out) return op(str + call('arr.ref', `${get(start)} (i32.shr_u (i32.sub ${get(ptr)} ${get(start)}) ${i32.const(3)})\n`), 'f64', { buf: true })

    return op(str)
  },

  // a[b] or a[]
  '['([, a, b], out) {
    include('arr.len'), include('i32.modwrap')

    // x[a+b]; -> a+b;
    if (!out) return op(expr(a, false) + expr(b, false))

    // a[] - length
    if (!b) return call('arr.len', expr(a))

    // a[0] - static index read
    if (typeof b[1] === 'number') {
      if (b[1] >= 0) return f64.load(i32.add(`(i32.trunc_f64_u ${expr(a)})`, i32.const(b[1] << 3)))
      // FIXME: read negative number if array length is known
    }

    // a[b] - regular access
    return include('arr.get'), call('arr.get', expr(a), int(expr(b)))
  },

  '='([, a, b], out) {
    // x[y]=1, x.y=1
    if (a[0] === '[') {
      let [, name, idx] = a

      // a[0] - static index read
      // FIXME: static optimization property - to avoid calling i32.modwrap if idx/len is known
      // FIXME: another static optimization: if length is known in advance (likely yes) - make static modwrap

      include('arr.len'), include('arr.set'), include('arr.tee'), include('i32.modwrap')
      return call('arr.' + (out ? 'tee' : 'set'), expr(name), int(expr(idx)), float(expr(b)))
    }

    // x(a,b) = y
    if (a[0] === '(') {
      let [, name, [, ...args]] = a, body = b, inits = [], result = '', dfn = [], code

      // functions defined within scope of other functions, `x()=(y(a)=a;)`
      if (func) err('Declaring local function `' + name + '`: not allowed');

      // FIXME: maybe it's ok to redeclare function? then we'd need to use table
      if (funcs[name]) err('Redefining function `' + name + '`: not allowed');

      // enter into function, collect local vars, returns, defers
      let rootLocals = locals
      func = name, locals = {}, returns = [], defers = [];

      // detect optional / clamped args
      args = args.map(arg => {
        let name, init

        // x(a,b)
        if (typeof arg === 'string') name = arg
        // x(a=1,b=2), x(a=(1;2))
        else if (arg[0] === '=') [, name, init] = arg, inits.push(['?', ['!=', name, name], ['=', name, init]])
        // x(x~2..3)
        else if (arg[0] === '~') [, name, init] = arg, inits.push(['~=', name, arg[2]])
        else err('Unknown function argument')

        locals[name] = { arg: true, type: 'f64' }

        dfn.push(`(param $${name} f64)`)
        return name
      })

      b.splice(1, 0, ...inits) // prepend inits

      body = expr(b)

      // define result, comes after (param) before (local)
      if (body?.type?.length) result = `(result ${body.type.join(' ')})`

      // if it has defers - wrap to block
      if (defers.length) body = op(`(block $func ${result} ${body})`, body.type)

      let initState

      // init body - expressions write themselves to body
      // FIXME: save func args as types as well

      // define global function
      defineFn(name,
        `(func $${name} ${dfn.join('')} ${result}` +
        Object.entries(locals)
          .filter(([k, v]) => !v.arg && !v.static)
          .map(([k, v]) => `(local $${k} ${v.type})`)
          .join(' ') +
        (body ? `\n${body}` : ``) +
        (defers.length ? `\n${defers.join(' ')}` : ``) + // defers have 0 stack, so result is from body
        `)`,
        body.type)
      locals = rootLocals
      func = returns = defers = null

      return initState
    }

    // *a = b - static variable init
    if (a[0] === '*') {
      [, a] = a
      locals[a] ||= { static: `${func}.${a}`, type: 'f64' }

      // precalculable init, like *a=0
      if (isConstExpr(b)) {
        globals[`${func}.${a}`] = { type: 'f64', init: float(expr(b)) };
        return
      }

      // *a=0; becomes a!=a?a=0;
      globals[`${func}.${a}`] = { type: 'f64', init: '(f64.const nan)' }; // FIXME: make signaling nan:0x01 (requires watr)
      return expr(['?', ['!=', a, a], ['=', a, b]], out)
    }

    if (typeof a === 'string') {
      // a = b,  a = (b,c),   a = (b;c,d)
      if (globals[a]?.func) err(`Redefining function '${a}' is not allowed`)

      // global constants init doesn't require operation
      if (!func && isConstExpr(b)) {
        globals[a] = { type: 'f64', init: float(expr(b)) }
        // FIXME: are we sure we don't need returning value here?
        return
      }

      locals[a] ||= { type: 'f64' }

      const bop = expr(b)

      return (out ? tee : set)(a, float(bop))
    }

    err(`Unknown assignment left value \`${stringify(a)}\``)
  },

  // a |> b
  '|>'([, a, b], out) {
    // FIXME: account for out flag

    // a..b |> ... - simple range
    if (a[0] === '..') {
      depth++
      // i = from; to; while (i < to) {% = i; ...; i++}
      const [, min, max] = a
      // FIXME: iterate with int if minop/maxop is int
      const minop = expr(min), maxop = expr(max)
      const cur = '_', // FIXME: we may need to replace _ with reading / writing element instead
        idx = `idx:${depth}`,
        end = `end:${depth}`,
        bop = expr(b, out)

      locals[cur] = locals[idx] = locals[end] = { type: 'f64' }

      const str = `;; |>:${depth}\n` +
        set(idx, float(expr(min))) +
        set(end, float(expr(max))) +
        loop(
          cond(f64.lt(get(idx), get(end)),
            set(cur, get(idx)) +
            bop + // FIXME: if bop returns result - gotta save it to heap
            set(idx, f64.add(get(idx), f64.const(1))) +
            `(br 1)`
          )
        )

      depth--
      return op(str)
    }

    // (x = (a, b..c, d[e..])) |> ... - generic iterator
    else {
      console.log(a, b)
      err('loop over list: unimplemented')


      // let aop = expr(a)
      // // (a,b,c) |> ...
      // if (aop.type.length > 1) {
      //   // we create tmp list for this group and iterate over it, then after loop we dump it into stack and free memory
      //   // i=0; to=types.length; while (i < to) {./ = stack.pop(); ...; i++}
      //   from = f64.const(0), to = f64.const(aop.type.length)
      //   next = `(f64.load (i32.add (global.get $__heap) ${get(idx)}))`
      //   // push args into heap
      //   // FIXME: there must be more generic copy-to-heap thing, eg. `(a, b..c, d|>e)`
      //   err('Sequence iteration is not implemented')
      //   for (let i = 0; i < aop.type.length; i++) {
      //     let t = aop.type[aop.type.length - i - 1]
      //     str += `${t === 'i32' ? '(f64.convert_i32_s)' : ''}(f64.store (i32.add (global.get $__heap) ${i32.const(8)}))`
      //   }
      // }
      // // (0..10 |> a ? ./b : c) |> ...
      // else if (aop.dynamic) {
      //   err('Unimplemented: dynamic loop arguments')
      //   // dynamic args are already in heap
      //   from = `(i32.const 0)`, to = `(global.get $__heap)`
      //   next = `(f64.load (i32.add (global.get $__heap) (local.get $${idx})))`
      //   // FIXME: must be reading from heap: heap can just be a list also
      // }
    }

    depth--
    return op(str, 'f64', { dynamic: true })
  },

  '-'([, a, b], out) {
    // [-, [int, a]] -> (i32.const -a)
    if (!b) {
      let res = expr(a, out)
      if (!out) return res
      if (res.type.length > 1) err('Group negation: unimplemented')
      if (res.type[0] === 'i32') return op(`(i32.sub (i32.const 0) ${res})`, 'i32')
      return op(`(f64.neg ${res})`, 'f64')
    }

    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop)

    if (aop.type.length > 1 || bop.type.length > 1) err('Group subtraction: unimplemented')
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.sub ${aop} ${bop})`, 'i32')
    return op(`(f64.sub ${float(aop)} ${float(bop)})`, 'f64')
  },
  '+'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);

    if (aop.type[0] == 'i32' && bop.type[0] == 'i32') return op(`(i32.add ${aop} ${bop})`, 'i32')
    return op(`(f64.add ${float(aop)} ${float(bop)})`, 'f64')
  },
  '*'([, a, b], out) {
    // group multiply
    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop);

    if (aop.type.length > 1 || bop.type.length > 1) {
      err('Complex group multiplication is not supported')
      // FIXME: complex multiple members, eg.
      // (x ? a,b : c,d) * (y ? e,f : g,h);
      // (... (x ? ../a,b); ...; c,d) * y(); ;; where y returns multiple values also
      // (a |> ./) * (b |> ./);
    }

    return op(`(f64.mul ${float(aop)} ${float(bop)})`, 'f64')
  },
  '/'([, a, b], out) {
    if (!b) {
      if (!returns) err('Bad return')

      // /a
      let aop = expr(a)
      returns.push(aop)
      // we enforce early returns to be f64
      // FIXME: consolidate it across all fn returns

      // supposing defers are declared before returns - we wrap content in block
      if (defers.length) {
        return aop ? op(`${aop}(br $func)`, aop.type) : op(`(br $func)`)
      }

      return aop ? op(`(return ${aop})`, aop.type) : op(`(return)`)
    }

    // a / b
    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop);
    return op(`(f64.div ${float(aop)} ${float(bop)})`, 'f64')
  },
  '**'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop);
    if (b[1] === 0.5) return op(`(f64.sqrt ${float(aop)})`, 'f64');
    return include('f64.pow'), call('f64.pow', float(aop), float(bop))
  },
  '%'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);
    // x % inf
    if (b[1] === Infinity) return aop;
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') op(`(i32.rem_s ${aop} ${bop})`, 'i32')
    return include('f64.rem'), call('f64.rem', float(aop), float(bop))
  },
  '%%'([, a, b], out) {
    // common case of int is array index access
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return include('i32.modwrap'), call('i32.modwrap', aop, bop)
    return include('f64.modwrap'), include('f64.rem'), call('f64.modwrap', float(aop), float(bop))
  },

  '++'([, a], out) {
    if (!out) return expr(['=', a, ['+', a, [INT, 1]]], false)

    // NOTE: for a[n]++ it's cheaper to (a[n]+=1)-1 (a[n];drop(a[n]=a[n]+1)) due to read
    if (a[0] === '[') return expr(['-', ['=', a, ['+', a, [INT, 1]]], [INT, 1]])
    if (typeof a !== 'string') err('Invalid left hand-side expression in prefix operation')

    let aop = expr(a)
    return op(`${aop}${set(a, expr(['+', a, [INT, 1]]))}`, aop.type[0])
  },

  '--'([, a], out) {
    if (!out) return expr(['=', a, ['-', a, [INT, 1]]], false)

    // FIXME: this can be moved to precompile
    if (a[0] === '[') return expr(['+', ['=', a, ['-', a, [INT, 1]]], [INT, 1]])
    if (typeof a !== 'string') err('Invalid left hand-side expression in prefix operation')

    let aop = expr(a)
    return op(`${aop}${set(a, expr(['-', a, [INT, 1]]))}`, aop.type[0])
  },

  '!'([, a], out) {
    let aop = expr(a, out)
    if (!out) return op(aop);
    if (aop.type.length > 1) err('Group inversion: unimplemented')
    if (aop.type[0] === 'i32') return op(`(if (result i32) (i32.eqz ${aop}) (then (i32.const 1)) (else (i32.const 0)))`, 'i32')
    return op(`(if (result i32) (f64.eq ${aop} (f64.const 0)) (then (i32.const 1)) (else (i32.const 0)))`, 'i32')
  },
  '|'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);
    // x | 0
    if (b[1] === 0) return int(aop);
    return op(`(i32.or ${int(aop)} ${int(bop)})`, 'i32')
  },
  '&'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.and ${int(aop)} ${int(bop)})`, `i32`)
  },
  '^'([, a, b], out) {
    // ^b
    if (!b) {
      let aop = expr(a, false)
      if (!defers) err('Bad defer')
      if (returns.length) err('Defer after return')
      defers.push(aop)
      return
    }

    // a ^ b
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.xor ${int(aop)} ${int(bop)})`, `i32`)
  },
  '<<'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.shl ${int(aop)} ${int(bop)})`, `i32`)
  },
  '>>'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.shr_s ${int(aop)} ${int(bop)})`, `i32`)
  },
  '<<<'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.rotl ${int(aop)} ${int(bop)})`, `i32`)
  },
  '>>>'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.rotr ${int(aop)} ${int(bop)})`, `i32`)
  },

  // comparisons
  '<'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop);
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.lt_s ${aop} ${bop})`, 'i32')
    return op(`(f64.lt ${float(aop)} ${float(bop)})`, 'i32')
  },
  '<='([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop);
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.le_s ${aop} ${bop})`, 'i32')
    return op(`(f64.le ${float(aop)} ${float(bop)})`, 'i32')
  },
  '>'([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop);
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.gt_s ${aop} ${bop})`, 'i32')
    return op(`(f64.gt ${float(aop)} ${float(bop)})`, 'i32')
  },
  '>='([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop);
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.ge_s ${aop} ${bop})`, 'i32')
    return op(`(f64.ge ${float(aop)} ${float(bop)})`, 'i32')
  },
  '=='([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop);
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.eq_s ${aop} ${bop})`, 'i32')
    return op(`(f64.eq ${float(aop)} ${float(bop)})`, 'i32')
  },
  '!='([, a, b], out) {
    let aop = expr(a, out), bop = expr(b, out)
    if (!out) return op(aop + bop);
    if (aop.type[0] === 'i32' && bop.type[0] === 'i32') return op(`(i32.ne_s ${aop} ${bop})`, 'i32')
    return op(`(f64.ne ${float(aop)} ${float(bop)})`, 'i32')
  },

  // logical - we put value twice to the stack and then just drop if not needed
  '||'([, a, b], out) {
    let aop = expr(a), bop = expr(b, out)

    if (!out) return op(`(if ${aop.type[0] == 'i32' ? aop : `(f64.ne ${aop} (f64.const 0))`} (else ${bop}))`)

    if (aop.type[0] == 'f64') return op(`${pick(2, aop)}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then) (else (drop) ${float(bop)}))`, 'f64')
    if (bop.type[0] == 'i32') return op(`${pick(2, aop)}(if (param i32) (result i32) (then) (else (drop) ${bop}))`, 'i32')
    return op(`${pick(2, aop)}(if (param i32) (result f64) (then (f64.convert_i32_s)) (else (drop) ${bop}))`, 'f64')
  },
  '&&'([, a, b], out) {
    let aop = expr(a), bop = expr(b, out)

    if (!out) return op(`(if ${aop.type[0] == 'i32' ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${bop}))`)

    if (aop.type[0] == 'f64') return op(`${pick(2, aop)}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then (drop) ${float(bop)}))`, 'f64')
    if (bop.type[0] == 'i32') return op(`${pick(2, aop)}(if (param i32) (result i32) (then (drop) ${bop}))`, 'i32')
    return op(`${pick(2, aop)}(if (param i32) (result f64) (then (drop) ${bop})) (else (f64.convert_i32_s))`, 'f64')
  },

  // a ? b; - differs from a && b so that it returns 0 if condition doesn't meet
  '?'([, a, b], out) {
    let aop = expr(a), bop = expr(b, out)
    if (aop.type.length > 1) err('Group condition is not supported yet.')

    if (!out) return op(`(if ${aop.type[0] == 'i32' ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${bop}))`);

    return op(`(if (result ${bop.type[0]}) ${aop.type[0] == 'i32' ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${bop.type[0] === 'i32' ? bop : float(bop)} ) (else (${bop.type[0]}.const 0)))`, bop.type)
  },
  '?:'([, a, b, c], out) {
    let aop = expr(a), bop = expr(b, out), cop = expr(c, out)

    // FIXME: (a,b) ? c : d
    // FIXME: (a,b) ? (c,d) : (e,f)
    // FIXME: a ? (b,c) : (d,e)
    if (aop.type.length > 1) err('Group condition is not supported yet.')

    if (bop.type[0] === 'i32' && cop.type[0] === 'i32') return op(`(if ${out ? `(result i32)` : ``} ${aop.type[0] == 'i32' ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${bop} ) (else ${cop}))`, out ? 'i32' : [])

    return op(`(if ${out ? `(result f64)` : ``} ${aop.type[0] == 'i32' ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${float(bop)} ) (else ${float(cop)}))`, out ? 'f64' : [])
  },

  // a ~ range - clamp a to indicated range
  '~'([, a, b], out) {
    // ~a - just do binary inverse
    if (!b) {
      return out && op(`(i32.xor (i32.const -1) ${int(expr(a))})`, 'i32')
    }

    // a ~ b
    if (b[0] !== '..') err('Non-range passed as right side of clamp operator')

    let [, min, max] = b, aop = expr(a), minop = min && expr(min, out), maxop = max && expr(max, out)

    // a ~ min..max; (no return needed)
    if (!out) return op(minop + maxop)

    // a ~ min..
    if (!max) {
      if (aop.type[0] === 'i32' && minop.type[0] === 'i32') return include('i32.smax'), call('i32.max', aop, minop)
      return op(`(f64.max ${float(aop)} ${float(minop)})`, 'f64')
    }
    // a ~ ..max
    if (!min) {
      if (aop.type[0] === 'i32' && maxop.type[0] === 'i32') return include('i32.smin'), call('i32.min', aop, maxop)
      return op(`(f64.min ${float(aop)} ${float(maxop)})`, 'f64')
    }
    // a ~ min..max
    if (aop.type == 'i32' && minop.type == 'i32' && maxop.type == 'i32') {
      return include('i32.smax'), include('i32.smin'), call('i32.smax', call('i32.smin', aop, maxop), minop)
    }

    // FIXME: a ~ .., maybe not-nan?

    // a ~ min..max
    return op(`(f64.max (f64.min ${float(aop)} ${float(maxop)}) ${float(minop)})`, 'f64')
  },

  // <math#sin>, <path/to/lib>
  // '<>'([, path], out) {
  //   if (locals) err('Import must be in global scope')
  //   path = path.trim();
  //   if (path[0] === "'" || path[0] === '"') path = path.slice(1, -1);
  //   let url = new URL('import:' + path)
  //   let { hash, pathname } = url

  //   let lib = config.imports?.[pathname]
  //   if (!lib) err(`Unknown import entry '${pathname}'`)

  //   // FIXME: include directive into syntax tree
  //   // let src = fetchSource(pathname)
  //   // let include = parse(src)
  //   // node.splice(node.indexOf(impNode), 1, null, include)

  //   let members = hash ? hash.slice(1).split(',') : Object.keys(lib)
  //   for (let member of members) {
  //     const val = lib[member]
  //     if (typeof val === 'number') {
  //       // FIXME: here can be mutable global object
  //       globals[member] = { var: true, import: true, type: 'f64' }
  //       imports.push([pathname, member, `(global $${member} f64)`])
  //     }
  //     else if (typeof val === 'function') {
  //       // FIXME: function may return multiple values, but how to detect that?
  //       imports.push([pathname, member, `(func $${member} ${val.length ? `(param${` f64`.repeat(val.length)})` : ''} (result f64))`])
  //       globals[member] = { func: true, import: true, type: 'i32' }
  //     }
  //   }
  //   // we return nothing since member is marked as imported
  //   return ''
  // },

  // a,b,c . x?
  // '.'([, a, b]) {
  //   // a.0 - index access - doesn't require modwrap
  //   let idx = isNaN(Number(b)) ? err('Alias access is unimplemented') : Number(b)
  //   return op(`(f64.load (i32.add ${int(expr(a))} (i32.const ${idx << 3})))`, 'f64')
  // },
})



// fetch source file by path - uses import maps algorighm
// FIXME: can extend with importmap
const coreModules = { math: './math.melo' }
