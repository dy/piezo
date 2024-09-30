import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t.only('defer: - basics', () => {
  // FIXME: *t=0; ^ t++; - should throw error (including other binaries)
  let wat = compileMel(`f()=(*t=0;^++t;t)`)
  let mod = compileWat(wat), { f } = mod.instance.exports
  is([f(), f(), f()], [0, 1, 2])
})
