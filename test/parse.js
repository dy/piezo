import t, { is, ok, same } from 'tst'
import parse from '../src/parse.js'


t('parse: common', t => {
  is(parse('1+1'), ['+', ['int',1], ['int',1]])
  is(parse('1.0+1.0'), ['+', ['flt',1], ['flt',1]])
  is(parse('a+b-c'), ['-',['+', 'a', 'b'],'c'])
  is(parse(`x([left], v)`), ['(','x',[',',['[','left'],'v']])
})

t('parse: identifiers', t => {
  // permit @#$_
  is(parse('Δx, _b#, c_c, $d0'), [',', 'δx', '_b#','c_c','$d0'])

  // disregard casing
  is(parse('A, Bc, d_E'), [',', 'a', 'bc','d_e'])

  is(parse('Ab_C_F#, $0, Δx'), [',', 'ab_c_f#', '$0', 'δx'])
  is(parse('default=1; eval=fn, else=0;'), [';', ['=', 'default', ['int',1]], [',', ['=', 'eval', 'fn'], ['=', 'else', ['int',0]]], null])
})

t('parse: numbers', t => {
  is(parse('16, 0x10, 0b010000'), [',',['int', 16], ['hex', 16], ['bin', 16]]);
  // console.log(parse('1, .1'))
  is(parse('16.0, .1, 1e+3, 2e-3'), [',', ['flt', 16], ['flt', 0.1], ['flt', 1e3], ['flt', 2e-3]]);
  is(parse('true=0b1, false=0b0'), [',', ['=', 'true', ['bin', 1]], ['=', 'false', ['bin', 0]]]);
})

t('parse: type cast', t => {
  is(parse('1 / 3; 2 * 3.14'), [';', ['/', ['int', 1],['int', 3]], ['*', ['int', 2], ['flt', 3.14]]]);
  is(parse('3.0 | 0'), ['|', ['flt', 3], ['int', 0]]);
})

t('parse: end operator precedence', t => {
  is(parse(`
    x() = 1+2;
  `), ['=', ['(', 'x'], [';',['+', ['int',1], ['int',2]]]])

  is(parse(`
    a,b,c;
  `), [';',[',','a','b','c']])

  is(parse(`
    x() = (1+2);
  `), ['=', ['(', 'x'], [';',['(', ['+', ['int',1], ['int',2]]]]])

  is(parse(`
    x() = (1+2;)
  `), ['=', ['(', 'x'], ['(',[';', ['+', ['int',1], ['int',2]]]]])

  is(parse(`
    x() = (1+2;);
  `), ['=', ['(', 'x'], [';',['(',[';',['+', ['int',1], ['int',2]]]]]])

  is(parse(`
    x() = (a?^b;c)
  `), ['=', ['(', 'x'], ['(',[';', ['?','a',['^','b']],'c']]])

  is(parse(`
    x() = (a?b.c)
  `), ['=', ['(', 'x'], ['(',['?','a',['.','b','c']]]])
})

t('parse: semicolon', t => {
  is(parse(`
      pi2 = pi*2.0;
      sampleRate = 44100;
  `), [';',['=', 'pi2', ['*', 'pi', ['float', 2]]], ['=', 'sampleRate', ['int', 44100]], null]);

  is(parse(`
    x() = 1+2;
  `), [';',['=', ['(', 'x'], ['+', ['int',1], ['int',2]]], undefined])

  is(parse(`
    a,b,c;
  `), [';',[',','a','b','c'], undefined])
})

t('parse: import', t => {
  is(parse(`@'math'`), ['@', ['\'','math']])
  is(parse(`@'math#a'`), ['@', ['\'','math#a']])
  is(parse(`@'math#a,b,c'`), ['@', ['\'','math#a,b,c']])
})

t('parse: sine gen', t => {
  let tree = parse(`
    sine(freq) = (
      *phase=0;
      phase += freq * pi2 / sampleRate;
      [sin(phase)].
  ).`);
  is(tree,
    ['=',
      [
        '(', 'sine', 'freq'
      ],
      ['.', ['(',
          [';',
            ['=',['*', 'phase'],['int',0]],
            ['+=', 'phase', ['/', ['*', 'freq', 'pi2'], 'sampleRate']],
            ['.',['[',['(', 'sin','phase']]]
          ]
        ]
      ]
    ]
  )
})

t('parse: audio-gain', t => {
  let tree = parse(`
    range = 0..1000;

    gain([left], volume <- range) = [left * volume];
    gain([left, right], volume <- range) = [left * volume, right * volume];
    //gain([..channels], volume <- range) = [..channels * volume];

    gain.
  `)
  is(tree, [';',
    ['=', 'range', ['..', ['int',0], ['int',1000]]],
    ['=', ['(', 'gain', [',', ['[', 'left'], ['<-', 'volume', 'range']]], ['[', ['*', 'left', 'volume']]],

    ['=', ['(', 'gain', [',', ['[', [',','left','right']], ['<-', 'volume', 'range']]], ['[', [',',['*', 'left', 'volume'],['*', 'right', 'volume']]]],
    ['.', 'gain']
  ])
})
