import t, { almost, is, not, ok, same, throws } from 'tst'
import compileZ from '../../src/compile.js'
import { compileWat } from '../util.js'

t.skip('memory: grow', t => {
  // FIXME: possibly add option to export internals
  let wat = compileZ(`grow()=[..8192]`)
  let mod = compileWat(wat)
  let { memory, __mem, grow } = mod.instance.exports
  for (let i = 1; i < 100; i++) {
    is(__mem.value, 65536 * i)
    grow()
  }
})
