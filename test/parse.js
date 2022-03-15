import t, { is, ok, same } from 'tst'
import parse from '../src/parse.js'

const unbox = list => list.map(item => Array.isArray(item) ? unbox(item) : item+'')

t('common expressions', t => {
  is(unbox(parse('1+1')), ['+', '1', '1'])
  is(parse('a+b-c'), ['-',['+', 'a', 'b'],'c'])
})

t('identifiers', t => {
  // permit @#$_
  is(parse('a@a, #b#, c_c, $d$'), [',', 'a@a', '#b#','c_c','$d$'])

  // disregard casing
  is(parse('A, Bc, d_E'), [',', 'a', 'bc','d_e'])
})

t('assign', t => {

})

t('readme: audio-gain', t => {
  is(unbox(parse(`
    range = 0..1000;

    gain([left], volume in range) = [left * volume];
    gain([left, right], volume in range) = [left * volume, right * volume];
    //gain([..channels], volume in range) = [..channels * volume];

    export gain.
  `)), [';',
    ['=', 'range', ['..', '0', '1000']],
    ['=', ['(', 'gain', [',', ['[', 'left'], ['in', 'volume', 'range']]], ['[', ['*', 'left', 'volume']]],

    ['=', ['(', 'gain', [',', ['[', [',','left','right']], ['in', 'volume', 'range']]], ['[', [',',['*', 'left', 'volume'],['*', 'right', 'volume']]]],
    ['export', 'gain']
  ])
})

t('end operator', t => {
  // must throw if anything comes after . in body
  // throws if anything comes after . in
})
