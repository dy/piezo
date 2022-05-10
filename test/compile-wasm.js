// test wasm compiler

import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import analyse from '../src/analyse.js'
import compile from '../src/compile-wasm.js'


t.only('compile wat: globals', t => {
  // TODO: single global
  // TODO: multiply wrong types
  // TODO: define globals via group (a,b,c).
  let wat = compile(analyse(parse(`
    pi2 = pi*2.0;
    sampleRate = 44100;
  `)))
  console.log(wat)
  // (global $answer i32 (i32.const 42))
  // (start $main)
  // (func $main
  //   (global.set $answer (i32.const 666))
  // )
  is(wat, [
    ['global', '$pi2', 'f64'],
    ['global', '$sampleRate', 'i32', ['i32.const', 44100]],
    ['start', '$module/init'],
    ['func', '$module/init',
      ['global.set', '$pi2', ['f64.mul', ['global.get', '$pi'], ['f64.const', 2]]]
    ]
  ])
})


t('compile wat: sine gen', t => {
  let wat = compile(analyse(parse(`
    @ 'math#sin,pi,max';

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
