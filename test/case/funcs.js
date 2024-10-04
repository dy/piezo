import t, { almost, is, not, ok, same, throws } from 'tst'
import compileZ from '../../src/compile.js'
import { compileWat } from '../util.js'

t.todo('funcs: oneliners', t => {
  let wat, mod

  wat = compileZ(`mult(a, b=2) = a * b`)
  mod = compileWat(wat)
  is(mod.instance.exports.mult(2, 4), 8)
  is(mod.instance.exports.mult(2), 4)

  mod = compileWat(compileZ(` mult(a, b) = (a * b)`))
  is(mod.instance.exports.mult(2, 4), 8)

  console.log('------')
  mod = compileWat(compileZ(` mult(a, b) = (b; a * b)`))
  is(mod.instance.exports.mult(2, 4), 8)

  mod = compileWat(compileZ(` mult(a, b) = (b; a * b;)`))
  is(mod.instance.exports.mult(2, 4), 8)

  mod = compileWat(compileZ(` mult(a, b) = (b; a * b; /)`))
  is(mod.instance.exports.mult(2, 4), undefined)

  mod = compileWat(compileZ(`f()=( *t; ^t++; t; );`))
  is([mod.instance.exports.f(), mod.instance.exports.f()], [0, 1])
})

t('funcs: first line inits local', t => {
  let mod = compileWat(compileZ(`a=1, x() = (a=2)`))
  is(mod.instance.exports.a.value, 1)
  is(mod.instance.exports.x(), 2)
  is(mod.instance.exports.a.value, 1)

  mod = compileWat(compileZ(`a=1, x() = (;a=2)`))
  is(mod.instance.exports.a.value, 1)
  is(mod.instance.exports.x(), 2)
  is(mod.instance.exports.a.value, 2)
})
