import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSruti from '../../src/compile.js'
import { compileWat } from '../util.js'

t('condition: base', t => {
  let wat, mod
  wat = compileSruti(`a=1;b=2;c=a?1:2`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1)

  wat = compileSruti(`a=1;b=2;a?c=b;c`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2)

  wat = compileSruti(`a=0;b=2;a?c=b;c`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 0)

  wat = compileSruti(`a=0.0;b=2.1;a?c=b;c`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 0)

  wat = compileSruti(`a=0.1;b=2.1;a?c=b;c`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2.1)

  wat = compileSruti(`a=0.0;b=2.1;c=a?b`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 0)

  wat = compileSruti(`a=0.1;b=2.1;c=a?b`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2.1)

  console.log('--------------')
  wat = compileSruti(`x(px) = (px < 0 ? px = 0; px)`)
  mod = compileWat(wat)
  is(mod.instance.exports.x(-10), 0)
  is(mod.instance.exports.x(10), 10)
})

t('compile: conditions - or/and', t => {
  let wat, mod
  wat = compileSruti(`z=1||0`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1)
  wat = compileSruti(`z=1.2||0.0`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1.2)
  wat = compileSruti(`z=1.2||0`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1.2)
  wat = compileSruti(`z=1||0.0`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1)
  wat = compileSruti(`z=1.2&&0.2`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 0.2)
  wat = compileSruti(`z=1&&2`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 2)
})
