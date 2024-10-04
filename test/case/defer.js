import t, { almost, is, not, ok, same, throws } from 'tst'
import compileZ from '../../src/compile.js'
import { compileWat } from '../util.js'

t('defer: - basics', () => {
  let wat = compileZ(`f()=(*t=0;^t++;t)`)
  let mod = compileWat(wat), f = mod.instance.exports.f;
  is([f(), f(), f()], [0, 1, 2])

  wat = compileZ(`f()=(*t=0;/t;^++t)`)
  mod = compileWat(wat), f = mod.instance.exports.f;
  is([f(), f(), f()], [0, 1, 2], 'after return')
})

t.skip('defer: - errors', () => {
  // throws(() => compileZ(`f()=(*t=0;/t;^++t)`), 'defer after return')
  // throws(() => compileZ(`f()=(^++t;*t=0;)`), 'defer before stateful')
})
