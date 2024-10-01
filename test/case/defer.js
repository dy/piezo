import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSruti from '../../src/compile.js'
import { compileWat } from '../util.js'

t('defer: - basics', () => {
  // FIXME: *t=0; ^ t++; - should throw error (including other binaries)
  let wat = compileSruti(`f()=(*t=0;^++t;t)`)
  let mod = compileWat(wat), { f } = mod.instance.exports
  is([f(), f(), f()], [0, 1, 2])
})

t('defer: - errors', () => {
  throws(() => compileSruti(`f()=(*t=0;/t;^++t)`), 'defer after return')
  // throws(() => compileSruti(`f()=(^++t;*t=0;)`), 'defer after return')
})
