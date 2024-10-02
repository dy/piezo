import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSruti from '../../src/compile.js'
import { compileWat } from '../util.js'

t('funcs: oneliners', t => {
  let wat, mod
  // no semi
  wat = compileSruti(`mult(a, b=2) = a * b`)
  mod = compileWat(wat)
  is(mod.instance.exports.mult(2, 4), 8)
  is(mod.instance.exports.mult(2), 4)

  mod = compileWat(compileSruti(` mult(a, b) = (a * b)`))
  is(mod.instance.exports.mult(2, 4), 8)

  console.log('------')
  mod = compileWat(compileSruti(` mult(a, b) = (b; a * b)`))
  is(mod.instance.exports.mult(2, 4), 8)

  mod = compileWat(compileSruti(` mult(a, b) = (b; a * b;)`))
  is(mod.instance.exports.mult(2, 4), 8)

  mod = compileWat(compileSruti(` mult(a, b) = (b; a * b; /)`))
  is(mod.instance.exports.mult(2, 4), undefined)
})

t('funcs: first line inits local', t => {
  let mod = compileWat(compileSruti(`a=1, x() = (a=2)`))
  is(mod.instance.exports.a.value, 1)
  is(mod.instance.exports.x(), 2)
  is(mod.instance.exports.a.value, 1)

  mod = compileWat(compileSruti(`a=1, x() = (;a=2)`))
  is(mod.instance.exports.a.value, 1)
  is(mod.instance.exports.x(), 2)
  is(mod.instance.exports.a.value, 2)
})
