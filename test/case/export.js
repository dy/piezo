import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t.skip('export: - no junk exports', () => {
  let wat = compileMel(`w()=(); y=[1]; x()=(*i=0), z=[y[0], v=[1]]`)
  let mod = compileWat(wat)
  same(Object.keys(mod.instance.exports), ['memory', 'x', 'z'])
})
