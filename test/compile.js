// test wast compiler

import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import analyse from '../src/analyse.js'
import compile from '../src/compile.js'
import d from 'ts-dedent'


t.only('compile wat: globals', t => {
  // TODO: single global
  // TODO: multiply wrong types
  // TODO: define globals via group (a,b,c).

  // undefined variable throws error
  throws(() => compile(analyse(parse(`pi2 = pi*2.0;`))), /pi is not defined/)

  let ast = parse(`
    pi = 3.14;
    pi2 = pi*2.0;
    sampleRate = 44100;
  `)
  let ir = analyse(ast)
  let wat = compile(ir)
  // console.log(wat, ir)
  is(clean(wat), clean(d`
    (global $pi f64 (f64.const 3.14))
    (global $pi2 f64)
    (global $sampleRate i32 (i32.const 44100))
    (start $module/init)
    (func $module/init
      (global.set $pi2 (f64.mul (global.get $pi) (f64.const 2)))
    )`
  ))
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



function clean (str) {
	if (Array.isArray(str)) str = String.raw.apply(String, arguments)

	return str.trim()

	//remove empty lines
	.replace(/^\s*\n/gm, '')

	//remove indentation/tabulation
	.replace(/^\s*/gm, '')

	//transform all \r to \n
	.replace(/[\n\r]+/g, '\n')

	//replace duble spaces/tabs to single ones
	.replace(/(\s)\s+/g, '$1')
}
