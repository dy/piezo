import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSruti from '../../src/compile.js'
import { compileWat } from '../util.js'

t.only('defer: - basics', () => {
  let wat = compileSruti(`f()=(*t=0;^t++;t)`)
  let mod = compileWat(wat), f = mod.instance.exports.f;
  is([f(), f(), f()], [0, 1, 2])

  wat = compileSruti(`f()=(*t=0;/t;^++t)`)
  mod = compileWat(wat), f = mod.instance.exports.f;
  is([f(), f(), f()], [0, 1, 2], 'after return')

  wat = compileSruti(`f()=( *t; ^t++; t; );`)
  mod = compileWat(wat), f = mod.instance.exports.f;
  is([f(), f()], [0, 1])
})

t.skip('defer: - errors', () => {
  // throws(() => compileSruti(`f()=(*t=0;/t;^++t)`), 'defer after return')
  // throws(() => compileSruti(`f()=(^++t;*t=0;)`), 'defer before stateful')
})
