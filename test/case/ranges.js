import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSruti from '../../src/compile.js'
import { compileWat } from '../util.js'


t('ranges: clamp', t => {
  let wat = compileSruti(`x = 11 ~ 0..10`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, 10)

  wat = compileSruti(`x = 0 ~ 1..10`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, 1)

  wat = compileSruti(`clamp(x) = (x ~ 0..10)`)
  mod = compileWat(wat)
  is(mod.instance.exports.clamp(11), 10)
  is(mod.instance.exports.clamp(-1), 0)
})
