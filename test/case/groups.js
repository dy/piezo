import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSruti from '../../src/compile.js'
import { compileWat } from '../util.js'

t('group: assign cases', t => {
  let wat, mod
  wat = compileSruti(`a=1;b=2;c=(a,b)`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2, 'c=(a,b)')

  wat = compileSruti(`a=1;b=2,c=3;(b,a)=(c,b)`)
  mod = compileWat(wat)
  is(mod.instance.exports.b.value, 3, '(b,a)=(c,b)')
  is(mod.instance.exports.a.value, 2)

  wat = compileSruti(`a=1;b=2;(c,b)=(a,b);a,b,c`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1, '(c,b)=(a,b)')
  is(mod.instance.exports.b.value, 2)
  is(mod.instance.exports.a.value, 1)

  throws(() => {
    wat = compileSruti(`a=1;b=2;(c,a,b)=(a,b)`)
    mod = compileWat(wat)
    is(mod.instance.exports.c.value, 1, '(c,a,b)=(a,b)')
    is(mod.instance.exports.a.value, 2)
    is(mod.instance.exports.b.value, 2)
  }, /Mismatch/)

  wat = compileSruti(`a=1;b=2;(c,d)=(a,b)`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1, '(c,d)=(a,b)')
  is(mod.instance.exports.d.value, 2)

  wat = compileSruti(`a=1;b=2;a,(b,b)=a`)
  mod = compileWat(wat)
  is(mod.instance.exports.b.value, 1, '(b,b)=a')
  is(mod.instance.exports.a.value, 1)

  wat = compileSruti(`a=1;b=2,c;a,(b,c)=a`)
  mod = compileWat(wat)
  is(mod.instance.exports.b.value, 1, '(b,c)=a')
  is(mod.instance.exports.c.value, 1)

  wat = compileSruti(`a=1;b=2,c=3;(a,,c)=(b,b,b)`)
  mod = compileWat(wat)
  is(mod.instance.exports.a.value, 2, '(a,,c)=(b,b,b)')
  is(mod.instance.exports.b.value, 2, '(a,,c)=(b,b,b)')
  is(mod.instance.exports.c.value, 2)
})

t('group: ops cases', t => {
  let wat, mod

  wat = compileSruti(`f(a) = ((x, y) = (a+2,a-2); x,y)`)
  mod = compileWat(wat);
  is(mod.instance.exports.f(4), [6, 2], `(a,b)=(c+1,c-1)`);

  wat = compileSruti(`f(a,b,h) = (a, b) * h`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 3), [6, 9], `(a, b) * h`);

  wat = compileSruti(`f(a,b,h) = h * (a, b)`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 3), [6, 9], `h * (a, b)`);

  wat = compileSruti(`f(a,b,c,d) = (a, b) * (c, d)`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 4, 5), [8, 15], `(a,b)*(c,d)`);

  wat = compileSruti(`f(a,b) = 2 * (a, b) * 3`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3), [12, 18], `2 * (a, b) * 3`);

  wat = compileSruti(`f(a,b,c,d) = (2 * (a, b)) * (c, d)`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 4, 5), [16, 30], `(2 * (a, b)) * (c, d)`);

  wat = compileSruti(`f(a,b,c,d) = ((2 * (a, b) * 3) * (c,d))`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 3, 2), [36, 36], `(2 * (a, b) * 3) * (c, d)`);

  wat = compileSruti(`f(a,b,h) = ((a>=h, b>=h) ? (a--, b--); a,b)`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 3), [2, 2], `(a>=h, b>=h) ? (a--, b--)`);

  wat = compileSruti(`f(a,b,h) = ((a,b) * (h + 1))`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 1), [4, 6], `((a,b) * (h + 1))`);

  wat = compileSruti(`f(a,b,h) = ((a,b) >= h ? (a,b) = h-1; (a,b))`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(1, 3, 3), [1, 2], `(a,b) >= h ? (a,b) = h-1`);

  wat = compileSruti(`x=[1,2,3]; (a, b, c) = x[0,1,2]`)
  mod = compileWat(wat)
  is([mod.instance.exports.a.value, mod.instance.exports.b.value, mod.instance.exports.c.value], [1, 2, 3], `(a,b,c)=x[0,1,2]`);
})
