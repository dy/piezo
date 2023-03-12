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
  const parsed = wabt.parseWat('inline', code, {})

  const binary = parsed.toBinary({
    log: true,
    canonicalize_lebs: true,
    relocatable: false,
    write_debug_names: false,
  })
  parsed.destroy()

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
})


t('compile: function oneliners', t => {
  // default
  let mod = compiles(`
    mult = (a, b) -> a * b;
  `, `
    (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
      (f64.mul (local.get $a) (local.get $b))
      (return)
    )
  `)
  is(mod.exports.mult(2,4), 8)

  // no semi
  mod = compiles(`mult = (a, b) -> a * b`, `
  (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
    (f64.mul (local.get $a) (local.get $b))
    (return)
  )
  `)
  is(mod.exports.mult(2,4), 8)

  // no result
  mod = compiles(`
    mult = (a, b) -> (a * b);
  `, `
    (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
      (f64.mul (local.get $a) (local.get $b))
      (return)
    )
  `)
  is(mod.exports.mult(2,4), 8)

  // no result
  mod = compiles(`
    mult (a, b) -> (a * b);
  `, `
    (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
      (f64.mul (local.get $a) (local.get $b))
      (return)
    )
  `)
  is(mod.exports.mult(2,4), 8)

  mod = compiles(`
  mult (a, b) -> (b; a * b)
  `, `
  (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
  (local.get $b)
  (f64.mul (local.get $a) (local.get $b))
  (return)
  )
  `)
  is(mod.exports.mult(2,4), 8)

  mod = compiles(`
    mult = (a, b) -> (b; a * b;)
  `, `
    (func $mult (export "mult") (param $a f64) (param $b f64) (result f64)
      (local.get $b)
      (f64.mul (local.get $a) (local.get $b))
      (return)
    )
  `)
  is(mod.exports.mult(2,4), 8)
})

t.todo('compile: audio-gain', t => {
  is(compile(unbox(parse(`
    range = 0..1000;

    gain([left], volume -< range) = [left * volume];
    gain([left, right], volume -< range) = [left * volume, right * volume];
    //gain([..channels], volume -< range) = [..channels * volume];

    gain.
  `))), [
    ['module', '']
  ])
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

