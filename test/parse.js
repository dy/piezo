import t, { is, ok, same } from 'tst'
import parse from '../src/parse.js'


t('parse: common', t => {
  is(unbox(parse('1+1')), ['+', '1', '1'])
  is(parse('a+b-c'), ['-',['+', 'a', 'b'],'c'])

  is(unbox(parse(`x([left], v)`)), ['(','x',[',',['[','left'],'v']])
})

t('parse: identifiers', t => {
  // permit @#$_
  is(parse('a@a, _b#, c_c, $d$'), [',', 'a@a', '_b#','c_c','$d$'])

  // disregard casing
  is(parse('A, Bc, d_E'), [',', 'a', 'bc','d_e'])
})

t('parse: audio-gain', t => {
  is(unbox(parse(`
    range = 0..1000;

    gain([left], volume ~= range) = [left * volume];
    gain([left, right], volume ~= range) = [left * volume, right * volume];
    //gain([..channels], volume ~= range) = [..channels * volume];

    gain.
  `)), [';',
    ['=', 'range', ['..', '0', '1000']],
    ['=', ['(', 'gain', [',', ['[', 'left'], ['~=', 'volume', 'range']]], ['[', ['*', 'left', 'volume']]],

    ['=', ['(', 'gain', [',', ['[', [',','left','right']], ['~=', 'volume', 'range']]], ['[', [',',['*', 'left', 'volume'],['*', 'right', 'volume']]]],
    ['.', 'gain']
  ])
})

t('parse: end operator precedence', t => {
  is(unbox(parse(`
    x() = 1+2
  `)), ['=', ['(', 'x'], ['+', '1', '2']])

  is(unbox(parse(`
    x() = 1+2.
  `)), ['.',['=', ['(', 'x'], ['+', '1', '2']]])

  is(unbox(parse(`
    x() = 1+2;
  `)), [';',['=', ['(', 'x'], ['+', '1', '2']], null])

  is(unbox(parse(`
    a,b,c;
  `)), [';',[',','a','b','c'], null])

  is(unbox(parse(`
    a,b,c.
  `)), ['.',[',','a','b','c']])
})

const unbox = list => list.map(item => Array.isArray(item) ? unbox(item) : !item ? null : item+'')
