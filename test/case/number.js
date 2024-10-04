import t, { almost, is, not, ok, same, throws } from 'tst'
import compileZ from '../../src/compile.js'
import { compileWat } from '../util.js'

t('number: float', t => {
  let wat = compileZ(`a = 3.140, b = 0.00123, c = -.5`)
  let mod = compileWat(wat)
  let { a, b, c, d, e } = mod.instance.exports
  is(a.value, 3.14)
  is(b.value, 0.00123)
  is(c.value, -0.5)
})

t('number: scientific', t => {
  let wat = compileZ(`a = 3.14e2, b = 2.5e-3, c = 5e3;`)
  let mod = compileWat(wat)
  let { a, b, c } = mod.instance.exports
  is(a.value, 3.14e2)
  is(b.value, 2.5e-3)
  is(c.value, 5e3)
})

t('number: int', t => {
  let wat = compileZ(`a = 42, b = 0b101, c = 0o052, d = 0x2A;`)
  let mod = compileWat(wat)
  let { a, b, c, d } = mod.instance.exports
  is(a.value, 42)
  is(b.value, 0b101)
  is(c.value, 0o052)
  is(d.value, 0x2a)
})
