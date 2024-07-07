import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t('units: core', t => {
  let wat = compileMel(`
    pi = 3.1415;
    1k = 1000; 1pi = pi;
    1s = 44100; 1m=60s; 1h=60m; 1ms = 0.001s;
    a=10.1k, b=2pi, c=1h2m3.5s
  `)

  let mod = compileWat(wat)
  is(mod.instance.exports.a.value, 10100)
  is(mod.instance.exports.b.value, 3.1415 * 2)
  is(mod.instance.exports.c.value, 60 * 60 * 44100 + 2 * 60 * 44100 + 3.5 * 44100)
})

t.todo('units: units - errors', t => {
  // bad expressions
  //
  compileMel(`1h=1s;1s=44800;`)
  compileMel(`1k=x();`)
})
