import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t('functions: oneliners', t => {
  let wat, mod
  // no semi
  wat = compileMel(`mult(a, b=2) = a * b`)
  mod = compileWat(wat)
  is(mod.instance.exports.mult(2, 4), 8)
  is(mod.instance.exports.mult(2), 4)

  mod = compileWat(compileMel(` mult(a, b) = (a * b)`))
  is(mod.instance.exports.mult(2, 4), 8)

  console.log('------')
  mod = compileWat(compileMel(` mult(a, b) = (b; a * b)`))
  is(mod.instance.exports.mult(2, 4), 8)

  mod = compileWat(compileMel(` mult(a, b) = (b; a * b;)`))
  is(mod.instance.exports.mult(2, 4), undefined)
})

t('functions: shadows global args', t => {
  let mod = compileWat(compileMel(`a=1, mult(a) = (a=2)`))
  is(mod.instance.exports.a.value, 1)
  is(mod.instance.exports.mult(), 2)
  is(mod.instance.exports.a.value, 1)
})
