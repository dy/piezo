import t, { is, ok, same } from 'tst'
import parse from '../src/parse.js'
import compile from '../src/compile.js'

const unbox = list => list.map(item => Array.isArray(item) ? unbox(item) : item+'')
const c = tree => wcompile(parse(tree))

t.only('common expressions', t => {
  is(c`1+1.`,
  `(module
    (global $module/0 i32 (i32.const 2))
    (memory $0 0)
    (export "default" (global $module/a))
    (export "memory" (memory $0))
  )`
  )

  // is(parse('a+b-c'), ['-',['+', 'a', 'b'],'c'])
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

t('end operator', t => {
  // must throw if anything comes after . in body
  // throws if anything comes after . in
})
