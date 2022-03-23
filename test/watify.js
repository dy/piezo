import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import watify from '../src/watify.js'

t('watify module: oneliners', t => {
  // (module
  //   (func $mult (param $a f64) (param $b f64))
  //   (export "mult" (func $mult))
  // )
  is(watify(unbox(parse(`
    mult(a, b) = a * b.
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']]
    ],
    ['export', 'mult', ['func', 'mult']]
  ])

  is(watify(unbox(parse(`
    mult(a, b) = (a * b)
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']]
    ]
  ])

  is(watify(unbox(parse(`
    mult(a, b) = (a * b);
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']]
    ]
  ])

  is(watify(unbox(parse(`
    mult(a, b) = (a * b; b).
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']],
      ['local.get', 'b']
    ],
    ['export', 'mult', ['func', 'mult']]
  ])

  is(watify(unbox(parse(`
    mult(a, b) = a * b.
  `))), ['module',
    ['func', 'mult', ['param', 'a', 'f64'], ['param', 'b', 'f64'], ['result', 'f64'],
      ['f64.mul', ['local.get', 'a'], ['local.get', 'b']]
    ],
    ['export', 'mult', ['func', 'mult']]
  ])
})

t.todo('watify module: errors', t => {
  throws(() => watify(parse(`
    a,b,c.
  `)))
  // must throw if anything comes after . in body
  // throws if anything comes after . in
})


t.todo('readme: audio-gain', t => {
  is(watify(unbox(parse(`
    range = 0..1000;

    gain([left], volume ~= range) = [left * volume];
    gain([left, right], volume ~= range) = [left * volume, right * volume];
    //gain([..channels], volume ~= range) = [..channels * volume];

    gain.
  `))), [
    ['module', '']
  ])
})



const unbox = list => list.map(item => Array.isArray(item) ? unbox(item) : item ? item+'' : null)
