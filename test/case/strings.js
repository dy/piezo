import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSruti from '../../src/compile.js'
import { compileWat } from '../util.js'

t.todo('strings: core', t => {
  let wat = compileSruti(`x = "abc"`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { memory, x } = mod.instance.exports

  let xarr = new Uint8Array(memory.buffer, x.value, 3)

  is(xarr[0], 21, 'a')
  is(xarr[1], 22, 'b')
})
