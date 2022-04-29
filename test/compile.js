import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import watify from '../src/watify.js'


t.todo('compile wat: sine gen', t => {
  compile(parse`
    @'math#sin,pi,max';

    pi2 = pi*2;
    sampleRate = 44100;

    sine(freq) = (
      *phase=0;
      phase += freq * pi2 / sampleRate;
      [sin(phase)].
    ).
  `)
})

t.todo('compile wat: zzfx coin', t => {
  compile(parse`
    @'math#sin,pi,max';

    pi2 = pi*2;
    sampleRate = 44100;

    sine(phase) = [sin(phase)];

    adsr(x, a, d, (s, sv), r) = (
      *i=0; t=i++/sampleRate;

      a = max(a, 0.0001);                // prevent click
      total = a + d + s + r;

      t >= total ? 0 : x * (
        t < a ? t/a :                    // attack
        t < a + d ?                      // decay
        1-((t-a)/d)*(1-sv) :             // decay falloff
        t < a  + d + s ?                 // sustain
        sv :                             // sustain volume
        (total - t)/r * sv
      ).
    );
    adsr(x, a, d, s, r) = adsr(x, a, d, (s, 1), r);   // no-sv alias
    adsr(a, d, s, r) = x -> adsr(x, a, d, s, r);      // pipe

    // curve effect
    curve(x, amt=1.82 <- 0..10) = (sign(x) * abs(x)) ** amt;
    curve(amt) = x -> curve(x, amt);

    // coin = triangle with pitch jump
    coin(freq=1675, jump=freq/2, delay=0.06, shape=0) = (
      *i=0, *phase=0;

      t = i++/sampleRate;
      phase += (freq + t > delay ? jump : 0) * pi2 / sampleRate;

      oscillator[shape](phase) | adsr(0, 0, .06, .24) | curve(1.82).
    ).
  `)
})

t.only('compile wat: oneliners', t => {
  // (module
  //   (func $mult (param $a f64) (param $b f64))
  //   (export "mult" (func $mult))
  // )
  is(unbox(parse(`
    mult(a, b) = a * b.
  `)), ['module',
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

t('compile wat: errors', t => {
  // undefined exports
  throws(() =>
    watify(parse(`a,b,c.`))
  , /Exporting unknown/)
})

t.todo('compile wat: batch processing', t => {
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
