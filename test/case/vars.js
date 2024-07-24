import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t('vars: globals basic', t => {
  // TODO: single global
  // TODO: multiply wrong types
  // TODO: define globals via group (a,b,c).

  // FIXME: undefined variable throws error
  // throws(() => compileMel(analyse(parse(`pi2 = pi*2.0;`))), /pi is not defined/)

  let wat = compileMel(`
    pi = 3.14;
    pi2 = pi*2.0;
    sampleRate = 44100;
    sampleRate, pi, pi2
  `)
  let mod = compileWat(wat)
  is(mod.instance.exports.pi.value, 3.14)
  is(mod.instance.exports.pi2.value, 3.14 * 2)
  is(mod.instance.exports.sampleRate.value, 44100)
})

t('vars: globals multiple', () => {
  // FIXME: must throw
  // let wat = compileMel(`pi, pi2, sampleRate = 3.14, 3.14*2, 44100`)
  let wat = compileMel(`(pi, pi2, sampleRate) = (3.14, 3.14*2, 44100)`)
  let mod = compileWat(wat)
  is(mod.instance.exports.pi.value, 3.14)
  is(mod.instance.exports.pi2.value, 3.14 * 2)
  is(mod.instance.exports.sampleRate.value, 44100)

  wat = compileMel(`(a,b) = (-1, -1.0)`)
  mod = compileWat(wat)
  is(mod.instance.exports.a.value, -1)
  is(mod.instance.exports.b.value, -1)

  wat = compileMel(`(a,b) = (-1, -1.0)`)
  mod = compileWat(wat)
  is(mod.instance.exports.a.value, -1)
  is(mod.instance.exports.b.value, -1)
})


t('vars: vars misc', t => {
  let wat, x;
  x = compileWat(compileMel(`x;x`)).instance.exports.x // unknown type falls to f64
  x = compileWat(compileMel(`x=1;x`)).instance.exports.x // int type
  x = compileWat(compileMel(`x=1.0;x`)).instance.exports.x // float type
  x = compileWat(compileMel(`x()=1;x`)).instance.exports.x // func type
  x = compileWat(compileMel(`x=[];x`)).instance.exports.x // arr type
  x = compileWat(compileMel(`x;x=1;x`)).instance.exports.x // late-int type
  x = compileWat(compileMel(`x;x=1.0;x`)).instance.exports.x // late-float type
  // x = compileWat(compileMel(`x;x()=1;x`)).instance.exports.x // late-func type
  x = compileWat(compileMel(`x;x=[];x`)).instance.exports.x // late-arr type
})

t('vars: scopes', t => {
  `((i = 2); i)`
})
