import t, { is, ok, same } from 'tst'
import parse from '../src/parse.js'
import watify from '../src/watify.js'

t.only('function: no-block', t => {
  // (module
  //   (func $mult (param $a f64) (param $b f64)
  //   )
  //   (export "mult" (func $mult))
  // )
  is(watify(unbox(parse(`
    mult(a, b) = a * b.
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64']],
    ['export', 'mult', ['func', 'mult']]
  ])
})

t.todo('readme: audio-gain', t => {
  is(watify(parse(`
    range = 0..1000;

    gain([left], volume ~= range) = [left * volume];
    gain([left, right], volume ~= range) = [left * volume, right * volume];
    //gain([..channels], volume ~= range) = [..channels * volume];

    gain.
  `)), hex`00 00 00`)
})

t('end operator', t => {
  // must throw if anything comes after . in body
  // throws if anything comes after . in
})


const unbox = list => list.map(item => Array.isArray(item) ? unbox(item) : item+'')
