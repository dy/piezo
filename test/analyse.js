import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import analyse from '../src/analyse.js'

t('analyze: export kinds', t => {
  is(analyse(parse(`x`)).export, {x:true})
  is(analyse(parse(`x,y`)).export, {x:true,y:true})
  is(analyse(parse(`x,y,z;`)).export, {x:true,y:true,z:true})
  is(analyse(parse(`x=1`)).export, {x:true})
  is(analyse(parse(`x,y=1,2;`)).export, {x:true,y:true})
})

t.todo('analyze: return kinds', t => {
  is(analyse(parse(`x -> 1`)).func )
  is(analyse(parse(`x -> 1;`)).func )
  is(analyse(parse(`x -> x;`)).func )
  is(analyse(parse(`x -> x,1`)).func )
  is(analyse(parse(`x -> x,1;`)).func )
  is(analyse(parse(`x -> x()`)).func )
  is(analyse(parse(`x -> x();`)).func )
  is(analyse(parse(`x -> x(),y();`)).func )
  is(analyse(parse(`x -> (x);`)).func )
  is(analyse(parse(`x -> [x];`)).func )
})

t('analyze: sine gen', t => {
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
    global: { pi2: [ '*', 'pi', ['int', 2] ], samplerate: [ 'int', 44100 ] },
    func: {
      sine: {
        name: 'sine',
        args: ['freq'],
        local: {},
        state: { phase: ['int', 0 ] },
        return: ['()', 'sin', 'phase'],
        body: [';',
          ['=', ['*', 'phase'], ['int', 0]],
          ['+=', 'phase', ['/', ['*', 'freq', 'pi2'], 'samplerate']],
          ['()', 'sin', 'phase']
        ],
      }
    },
    data: {},
    range: {}
  })
})

t('analyze: func args', t => {
  let ir = analyse(parse(`mult = (a, b) -> a * b`))

  is(ir, {
    export: {mult: true},
    import: {},
    global: {},
    func: {
      mult: {
        name: 'mult',
        args: ['a', 'b'],
        local: {},
        state: {},
        return: ['*', 'a', 'b'],
        body: ['*', 'a', 'b'],
      }
    },
    data: {},
    range: {}
  })
})

t('analyze: function overload', t => {
  throws(() => analyse(parse(`x()=;`)), /Bad syntax/i)
  // throws(() => analyse(parse(`x=()->1;x=()->2;`)), /Function/)
  throws(() => analyse(parse(`x()=1;`)), /left/i)
})


const unbox = list => list.map(item => Array.isArray(item) ? unbox(item) : item ? item+'' : null)
