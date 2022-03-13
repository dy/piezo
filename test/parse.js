import t, { is, ok, same } from 'tst'
import parse from '../src/parse.js'

t('commonscript', t => {
  is(parse('1+1'), ['+', Number(1), Number(1)])
})
