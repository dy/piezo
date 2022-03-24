import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import watify from '../src/watify.js'

t('watify: oneliners', t => {
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

t('watify: errors', t => {
  // undefined exports
  throws(() =>
    watify(parse(`a,b,c.`))
  , /Exporting unknown/)
})

t.todo('watify: batch processing', t => {
  is(watify(unbox(parse(`a([b],c) = b*c;`))),
    ['module', '']
  )

  is(watify(unbox(parse(`a(b) = [c];`))),
    ['module', '']
  )
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
