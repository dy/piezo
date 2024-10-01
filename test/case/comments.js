import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSruti from '../../src/compile.js'
import { compileWat } from '../util.js'

t('comments: base', t => {
  let wat = compileSruti(`x(a,w,h)=(
    a=1
    ;; a=2
  ), y()=(
    ;; (
  )`)
  let mod = compileWat(wat)
  let { x } = mod.instance.exports
  is(x(), 1)
})
