import t, { almost, is, not, ok, same, throws } from 'tst'
import compileZ from '../../src/compile.js'
import { compileWat } from '../util.js'

t('comments: base', t => {
  let wat = compileZ(`x(a,w,h)=(
    a=1
    ;; a=2
  ), y()=(
    ;; (
  )`)
  let mod = compileWat(wat)
  let { x } = mod.instance.exports
  is(x(), 1)
})
