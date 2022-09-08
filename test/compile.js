// test wast compiler

import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import analyse from '../src/analyse.js'
import compile from '../src/compile.js'
import d from 'ts-dedent'


t('compile: globals', t => {
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


t.only('compile: oneliners', t => {
  // no result
  is(analyse(parse(`
    mult(a, b) = a * b
  `)), `
    (func $mult (param $a f64) (param $b f64)
      (f64.mul (local.get $a) (local.get $b)
    )
    (export $mult (func $mult))
  `)

  // result
  is(analyse(parse(`
    mult(a, b) = a * b.
  `)), `
    (func $mult (param $a f64) (param $b f64)
      (f64.mul (local.get $a) (local.get $b)
    )
    (export $mult (func $mult))
  `)

  // error
  is(analyse(parse(`
    mult(a, b) = a * b..
  `)), `
    (func $mult (param $a f64) (param $b f64)
      (f64.mul (local.get $a) (local.get $b)
    )
    (export $mult (func $mult))
  `)

  // result
  is(analyse(parse(`
    mult(a, b) = a * b.;
  `)), `
    (func $mult (param $a f64) (param $b f64)
      (f64.mul (local.get $a) (local.get $b)
    )
    (export $mult (func $mult))
  `)

  // no result
  is(compile(analyse(parse(`
    mult(a, b) = (a * b)
  `))), `module',
    func', 'mult', param', 'a', 'f64'], param', 'b', 'f64'], result', 'f64'],
      f64.mul', local.get', 'a'], local.get', 'b']]
    ]
  `)

  // no result
  is(compile(analyse(parse(`
    mult(a, b) = (a * b);
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']]
    ]
  ])

  // result
  is(compile(analyse(parse(`
    mult(a, b) = (a * b).
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']]
    ]
  ])

  // result
  is(compile(analyse(parse(`
    mult(a, b) = (a * b.)
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']]
    ]
  ])

  // result but kind-of double-ish? prohibit?
  is(compile(analyse(parse(`
    mult(a, b) = (a * b.).
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']]
    ],
    ['export', 'mult', ['func', 'mult']]
  ])

  // doublish result? like return (return a*b)
  is(compile(analyse(parse(`
    mult(a, b) = (a * b.).;
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']]
    ],
    ['export', 'mult', ['func', 'mult']]
  ])

  is(compile(analyse(parse(`
    mult(a, b) = (a * b; b).
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']],
      ['local.get', 'b']
    ],
    ['export', 'mult', ['func', 'mult']]
  ])
})



t.todo('compile: audio-gain', t => {
  is(compile(unbox(parse(`
    range = 0..1000;

    gain([left], volume ~= range) = [left * volume];
    gain([left, right], volume ~= range) = [left * volume, right * volume];
    //gain([..channels], volume ~= range) = [..channels * volume];

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
