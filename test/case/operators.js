import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'


t('operator: negatives', t => {
  let wat = compileMel(`x=-1`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)

  wat = compileMel(`x=-1.0`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)
})

t('operator: inc/dec', t => {
  let wat = compileMel(`x=1; y=x++; x,y`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, 2)
  is(mod.instance.exports.y.value, 1)

  wat = compileMel(`x=1; y=++x; x,y`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, 2)
  is(mod.instance.exports.y.value, 2)

  wat = compileMel(`x=0; y=x--; x,y`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)

  wat = compileMel(`x=1; y=x+=2; x,y`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, 3)
  is(mod.instance.exports.y.value, 3)

  wat = compileMel(`x=1; y=x-=2; x,y`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)
  is(mod.instance.exports.y.value, -1)
})


t('operators: pow', t => {
  // static
  let wat = compileMel(`x=2**(1/2),y=x**3,z=x**-2`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, Math.sqrt(2))
  is(mod.instance.exports.y.value, mod.instance.exports.x.value ** 3)
  almost(mod.instance.exports.z.value, mod.instance.exports.x.value ** -2)

  // complex
  wat = compileMel(`pow(x,y)=(x**y)`)
  mod = compileWat(wat)
  is(mod.instance.exports.pow(1, 0), 1, '1**0')
  is(mod.instance.exports.pow(-1, 0), 1, `-1**0`)
  is(mod.instance.exports.pow(1, 1), 1, `1**1`)
  is(mod.instance.exports.pow(1, 108), 1, `1**108`)

  is(mod.instance.exports.pow(-1, 1), -1, `-1**1`)
  is(mod.instance.exports.pow(-1, 2), 1, `-1**2`)
  is(mod.instance.exports.pow(-1, 3), -1, `-1**3`)

  is(mod.instance.exports.pow(0, 10), 0, `0**10`)
  is(mod.instance.exports.pow(0, -10), Infinity, `0**-10`)

  is(mod.instance.exports.pow(Infinity, 10), Infinity, `+inf**10`)
  is(mod.instance.exports.pow(Infinity, -10), 0, `inf**-10`)

  is(mod.instance.exports.pow(-1.2, 3.4), NaN, `-1.2 ** 3.4`)
  is(mod.instance.exports.pow(-1.2, -3.4), NaN, `-1.2 ** -3.4`)

  is(mod.instance.exports.pow(2, Infinity), Infinity, `2**inf`)
  is(mod.instance.exports.pow(2, -Infinity), 0, `2**-inf`)

  is(mod.instance.exports.pow(1.2, 3.4), 1.2 ** 3.4, `1.2**3.4`)
  is(mod.instance.exports.pow(1.2, -3.4), 1.2 ** -3.4, `1.2**-3.4`)
  is(mod.instance.exports.pow(1.23456789, 9.87654321), 1.23456789 ** 9.87654321, `1.23456789 ** 9.87654321`)
})


t('operators: % and %%', t => {
  let wat = compileMel(`
    x(a,b)=(
      a%b,
      a%%b
    );
  `, {})
  compileWat(wat)
})
