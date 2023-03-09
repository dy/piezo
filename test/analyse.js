import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import analyse from '../src/analyse.js'


t.only('analyze: sine gen', t => {
  let ir = analyse(parse(`
    @ 'math#sin,pi,max';

    pi2 = pi*2;
    sampleRate = 44100;

    sine = (freq) -> (
      *phase=0;
      phase += freq * pi2 / sampleRate;
      sin(phase)
    )
  `))

  is(ir, {
    export: { sine: true },
    import: { math: ['sin', 'pi', 'max' ] },
    global: { pi2: [ '*', 'pi', ['int', 2] ], sampleRate: [ 'int', 44100 ] },
    func: {
      sine: {
        name: 'sine',
        args: ['freq'],
        local: {},
        state: { phase: ['int', 0 ] },
        output: [['(', 'sin', 'phase']],
        body: ['(',
          [';',
            ['=', ['*', 'phase'], ['int', 0]],
            ['+=', 'phase', ['/', ['*', 'freq', 'pi2'], 'sampleRate']],
            ['[', ['(', 'sin', 'phase']]
          ]
        ],
      }
    },
    data: {},
    range: {}
  })
})

t('analyze: func args', t => {
  let ir = analyse(parse(`mult(a, b) = a * b`))

  is(ir, {
    export: {},
    import: {},
    global: {},
    func: {
      mult: {
        name: 'mult',
        args: ['a', 'b'],
        local: {},
        state: {},
        output: [],
        body: ['*', 'a', 'b'],
      }
    },
    data: {},
    range: {}
  })
})

t('analyze: function overload', t => {
  throws(() => analyse(parse(`x()=;`)), /Bad syntax/)
  throws(() => analyse(parse(`x()=1; x()=2;`)), /Function/)
})


const unbox = list => list.map(item => Array.isArray(item) ? unbox(item) : item ? item+'' : null)
