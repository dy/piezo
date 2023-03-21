// test wast compiler

import t, { is, ok, same, throws } from 'tst'
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
function compileWat (code, config) {
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
  return new WebAssembly.Instance(mod)
}


t('compile: globals', t => {
  // TODO: single global
  // TODO: multiply wrong types
  // TODO: define globals via group (a,b,c).

  // undefined variable throws error
  throws(() => compile(analyse(parse(`pi2 = pi*2.0;`))), /pi is not defined/)

  let wat = compile(`
    pi = 3.14;
    pi2 = pi*2.0;
    sampleRate = 44100;
    sampleRate, pi, pi2;
  `)
  let mod = compileWat(wat)
  is(mod.exports.pi.value, 3.14)
  is(mod.exports.pi2.value, 3.14*2)
  is(mod.exports.samplerate.value, 44100)
})

t('compile: multiple globals', () => {
  let wat = compile(`
    pi, pi2, sampleRate = 3.14, 3.14*2, 44100;
  `)
  let mod = compileWat(wat)
  is(mod.exports.pi.value, 3.14)
  is(mod.exports.pi2.value, 3.14*2)
  is(mod.exports.samplerate.value, 44100)

  wat = compile(`a,b = -1, -1.0;`)
  mod = compileWat(wat)
  is(mod.exports.a.value, -1)
  is(mod.exports.b.value, -1)

  wat = compile(`a,b = -1, -1.0`)
  mod = compileWat(wat)
  is(mod.exports.a.value, -1)
  is(mod.exports.b.value, -1)
})

t('compile: neg numbers', t => {
  let wat = compile(`x=-1`)
  let mod = compileWat(wat)
  is(mod.exports.x.value, -1)

  wat = compile(`x=-1.0`)
  mod = compileWat(wat)
  is(mod.exports.x.value, -1)
})

t('compile: function oneliners', t => {
  // default
  let wat = compile(`mult = (a, b) -> a * b;`)
  let mod = compileWat(wat);
  // `
  //   (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
  //     (f64.mul (local.get $a) (local.get $b))
  //     (return)
  //   )
  // `
  is(mod.exports.mult(2,4), 8)

  // no semi
  wat = compile(`mult = (a, b) -> a * b`)
  mod = compileWat(wat)
  // `
  // (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
  //   (f64.mul (local.get $a) (local.get $b))
  //   (return)
  // )
  // `
  is(mod.exports.mult(2,4), 8)

  // no result
  mod = compileWat(compile(` mult = (a, b) -> (a * b); `))
  // `
  //   (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
  //     (f64.mul (local.get $a) (local.get $b))
  //     (return)
  //   )
  // `
  is(mod.exports.mult(2,4), 8)

  mod = compileWat(compile(` mult = (a, b) -> (b; a * b)`))
  // `
  // (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
  // (local.get $b)
  // (f64.mul (local.get $a) (local.get $b))
  // (return)
  // )
  // `
  is(mod.exports.mult(2,4), 8)

  mod = compileWat(compile(` mult = (a, b) -> (b; a * b;) `))
  // `
  //   (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
  //     (local.get $b)
  //     (f64.mul (local.get $a) (local.get $b))
  //     (return)
  //   )
  // `
  is(mod.exports.mult(2,4), 8)
})

t('compile: ranges', t => {
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

  // TODO
  // let wat = compile(`clamp = x -> (x -< 0..10);`)
  // let mod = compileWat(wat)

  let wat = compile(`x = 11 -< 0..10;`)
  let mod = compileWat(wat)
  is(mod.exports.x.value, 10)

  wat = compile(`x = 0 -< 1..10;`)
  mod = compileWat(wat)
  is(mod.exports.x.value, 1)

  // TODO: ranges
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

