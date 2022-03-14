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
