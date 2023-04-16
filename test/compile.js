// test wast compiler

import t, { is, not, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import analyse from '../src/analyse.js'
import compile from '../src/compile.js'
import Wabt from '../lib/wabt.js'


function clean (str) {
	if (Array.isArray(str)) str = String.raw.apply(String, arguments)
	return str.trim()
    .replace(/^\s*\n/gm, '') //remove empty lines
    .replace(/^\s*/gm, '') //remove indentation/tabulation
    .replace(/[\n\r]+/g, '\n') //transform all \r to \n
    .replace(/(\s)\s+/g, '$1') //replace duble spaces/tabs to single ones
}

// convert wast code to binary
let wabt = await Wabt()
function compileWat (code, importObj) {
  const wasmModule = wabt.parseWat('inline', code, {
    simd: true
  })

  const binary = wasmModule.toBinary({
    log: true,
    canonicalize_lebs: true,
    relocatable: false,
    write_debug_names: false,
  })
  wasmModule.destroy()

  const mod = new WebAssembly.Module(binary.buffer)
  return new WebAssembly.Instance(mod, importObj)
}


t('compile: simple globals', t => {
  // TODO: single global
  // TODO: multiply wrong types
  // TODO: define globals via group (a,b,c).

  // FIXME: undefined variable throws error
  // throws(() => compile(analyse(parse(`pi2 = pi*2.0;`))), /pi is not defined/)

  let wat = compile(`
    pi = 3.14;
    pi2 = pi*2.0;
    sampleRate = 44100;
    sampleRate, pi, pi2.
  `)
  let mod = compileWat(wat)
  is(mod.exports.pi.value, 3.14)
  is(mod.exports.pi2.value, 3.14*2)
  is(mod.exports.sampleRate.value, 44100)
})

t('compile: simple multiple globals', () => {
  // FIXME: must throw
  // let wat = compile(`pi, pi2, sampleRate = 3.14, 3.14*2, 44100.`)
  let wat = compile(`(pi, pi2, sampleRate) = (3.14, 3.14*2, 44100).`)
  let mod = compileWat(wat)
  is(mod.exports.pi.value, 3.14)
  is(mod.exports.pi2.value, 3.14*2)
  is(mod.exports.sampleRate.value, 44100)

  wat = compile(`(a,b) = (-1, -1.0).`)
  mod = compileWat(wat)
  is(mod.exports.a.value, -1)
  is(mod.exports.b.value, -1)

  wat = compile(`(a,b) = (-1, -1.0).`)
  mod = compileWat(wat)
  is(mod.exports.a.value, -1)
  is(mod.exports.b.value, -1)
})

t('compile: simple neg numbers', t => {
  let wat = compile(`x=-1.`)
  let mod = compileWat(wat)
  is(mod.exports.x.value, -1)

  wat = compile(`x=-1.0.`)
  mod = compileWat(wat)
  is(mod.exports.x.value, -1)
})

t('compile: simple function oneliners', t => {
  // default
  let wat = compile(`mult = (a, b) -> a * b.`)
  let mod = compileWat(wat);
  is(mod.exports.mult(2,4), 8)

  // no semi
  wat = compile(`mult = (a, b) -> a * b.`)
  mod = compileWat(wat)
  is(mod.exports.mult(2,4), 8)

  // no result
  mod = compileWat(compile(` mult = (a, b) -> (a * b). `))
  is(mod.exports.mult(2,4), 8)

  // console.log(compile(` mult = (a, b) -> (b; a * b).`))
  mod = compileWat(compile(` mult = (a, b) -> (b; a * b).`))
  is(mod.exports.mult(2,4), 8)

  mod = compileWat(compile(` mult = (a, b) -> (b; a * b;). `))
  is(mod.exports.mult(2,4), 8)
})

t('compile: simple ranges', t => {
  // let wat = compile(`x = 0..10; `),
  //     mod = compileWat(wat)
  // is(mod.exports.x)

  // basic v128
  // let mod = compileWat(`
  //   (func $mult (export "mult") (result f64)
  //     (local $v v128)
  //     (local.set $v (v128.const f64x2 2.0 3.0))
  //     (f64.mul (f64x2.extract_lane 0 (local.get $v)) (f64x2.extract_lane 1 (local.get $v)))
  //     (return)
  //   )
  // `)

  // let mod = compileWat(`
  //   (func $log (import "imports" "log") (param i32))
  //   (func $mult (export "mult") (param $a i32) (param $b i32) (result i32)
  //     (call $log (local.get $b))
  //     (i32.mul (local.get $a) (local.get $b))
  //     (return)
  //   )
  // `, {imports: { log: (arg) => console.log(arg) }})
  // console.log(mod.exports.mult(2))

  // global v128
  // let mod = compileWat(`
  //   (global (export "x") v128 (v128.const f64x2 2.0 3.0))
  // `)

  // max return values number
  // const N = 1000
  // let mod = compileWat(`
  //   (func $x (export "x") (result ${'f64 '.repeat(N)})
  //     (local $a f64)
  //     (local.set $a (f64.const 1.0))
  //     (return ${'(local.get $a) '.repeat(N)})
  //   )
  // `)
  // console.log(mod.exports.x())

  let wat = compile(`x = 11 -< 0..10.`)
  let mod = compileWat(wat)
  is(mod.exports.x.value, 10)

  wat = compile(`x = 0 -< 1..10.`)
  mod = compileWat(wat)
  is(mod.exports.x.value, 1)

  wat = compile(`clamp = x -> (x -< 0..10).`)
  mod = compileWat(wat)
  is(mod.exports.clamp(11), 10)
  is(mod.exports.clamp(-1), 0)
})

t('compile: simple arrays', t => {
  let wat = compile(`x = [1, 2, 3].`)
  console.log(wat)
  let mod = compileWat(wat)
  let {memory, x} = mod.exports
  let arr = new Float64Array(memory.buffer, 0, 3), ptr = x.value
  is(arr[ptr], 1)
  is(arr[ptr+1], 2)
  is(arr[ptr+2], 3)
})

t.skip('compile: simple subarrays', t => {
  let wat = compile(`[2]x = [1,2,3].`)
  console.log(wat)
  let mod = compileWat(wat)
  let {memory, x} = mod.exports
  let arr = new Float64Array(memory.buffer, 0, 2), ptr = x.value
  is(arr[ptr], 1)
  is(arr[ptr+1], 2)
})

t('compile: variable type inference', t => {
  let wat,x;
  x = compileWat(compile(`x;x.`)).exports.x // unknown type falls to f64
  x = compileWat(compile(`x=1;x.`)).exports.x // int type
  x = compileWat(compile(`x=1.0;x.`)).exports.x // float type
  x = compileWat(compile(`x=()->1;x.`)).exports.x // func type
  // x = compileWat(compile(`x=0..10;x.`)).exports.x // range type
  x = compileWat(compile(`x=[];x.`)).exports.x // arr type
  x = compileWat(compile(`x;x=1;x.`)).exports.x // late-int type
  x = compileWat(compile(`x;x=1.0;x.`)).exports.x // late-float type
  x = compileWat(compile(`x;x=()->1;x.`)).exports.x // late-func type
  // x = compileWat(compile(`x;x=0..10;x.`)).exports.x // late-range type
  x = compileWat(compile(`x;x=[];x.`)).exports.x // late-arr type
})

t('compile: simple loops', t => {
  let wat = compile(`x=[..3]; i=0; i<3 <| x[i]=i++; x.`)
  let mod = compileWat(wat)
  let {memory, x} = mod.exports

  let arr = new Float64Array(memory.buffer, 0, 3), ptr = x.value
  is(arr[ptr], 0)
  is(arr[ptr+1], 1)
  it(arr[ptr+2], 2)
  not(arr[ptr+3], 3)
})

t('compile: simple pipe', t => {
  let wat = compile(`x = [1,2,3]; y = x | x -> x * 2.`)
  console.log(wat)
  let mod = compileWat(wat)
  let {memory, y} = mod.exports
  let arr = new Float64Array(memory.buffer, 0, 3), ptr = y.value
  is(arr[ptr], 2)
  is(arr[ptr+1], 4)
  not(arr[ptr+2], 6)
})

t.todo('compile: audio-gain', t => {
  let wat = compile(`
  blockSize = 1024;
  gain = ([blockSize]data, volume -< 0..1000) -> [data | x -> x * volume];
  `)
  let mod = compileWat(wat)
  let {gain} = mod.exports
  is(gain([1,2,3],2),[2,4,6])

  // let wat = compile(`
  //   blockSize = 1024;
  //   gain = ([2, blockSize]data, volume -< 0..1000) -> [data | ch -> (ch | x -> x * volume)];
  // `)
})



t.todo('compile: sine gen', t => {
  let wat = compile(analyse(parse(`
    pi = 3.14;
    pi2 = pi*2;
    sampleRate = 44100;

    sine(freq) = (
      *phase=0;
      phase += freq * pi2 / sampleRate;
      [sin(phase)].
    ).
  `)))
  console.log(wat)

  is(wat, [])
})


t.todo('compile: imports')



t.todo('compile: errors', t => {
  // undefined exports
  throws(() =>
    compile(parse(`a,b,c.`))
  , /Exporting unknown/)

  // fn overload: prohibited
  throws(() => {

  })
})

t.todo('compile: batch processing', t => {
  is(compile(unbox(parse(`a([b],c) = b*c;`))),
    ['module', '']
  )

  is(compile(unbox(parse(`a(b) = [c];`))),
    ['module', '']
  )
})

