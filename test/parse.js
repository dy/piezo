import t, { is, ok, same } from 'tst'
import parse from '../src/parse.js'

const unbox = list => list.map(item => Array.isArray(item) ? unbox(item) : item+'')

t('common expressions', t => {
  is(unbox(parse('1+1')), ['+', '1', '1'])
  is(parse('a+b-c'), ['-',['+', 'a', 'b'],'c'])
})

t('identifiers', t => {
  // permit @#$_
  is(parse('a@a, _b#, c_c, $d$'), [',', 'a@a', '_b#','c_c','$d$'])

  // disregard casing
  is(parse('A, Bc, d_E'), [',', 'a', 'bc','d_e'])
})

t('assign', t => {

})

t('readme: audio-gain', t => {
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

t('module: ending', t => {
  is(unbox(parse(`
    x() = 1+2
  `)), ['=', ['(', 'x'], ['+', 1, 2]])

  is(unbox(parse(`
    x() = 1+2.
  `)), ['.',['=', ['(', 'x'], ['+', 1, 2]]])

  is(unbox(parse(`
    x() = 1+2;
  `)), [';',['=', ['(', 'x'], ['+', 1, 2]]])
})

t('end operator', t => {
  // must throw if anything comes after . in body
  // throws if anything comes after . in
})
