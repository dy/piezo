import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t('readme: numbers', t => {
  let numbers = compileMel(`
    a=16, b=0x10, c=0b0;                 // int, hex or binary
    d=16.0, e=.1, f=1e3, g=2e-3;           // float
    a,b,c,d,e,f,g
  `, { imports: {} })
  let { a, b, c, d, e, f, g } = compileWat(numbers, {}).instance.exports
  is(a.value, 16), is(b.value, 0x10), is(c.value, 0b0), is(d.value, 16), is(e.value, 0.1), is(f.value, 1e3), is(g.value, 2e-3)
})

t('readme: standard operators', t => {
  let ops = compileMel(`
    a=3,b=2,c=1;
    (
      o0, o1, o2, o3, o4, o5, o5a, o6, o6a,
      o7, o8, o9, o10,
      o11, o12, o13, o14, o15, o16,
      o17, o18, o19, o20, o21, o22,
      o23, o24, o25, o26
    ) = (
      a + b, a-b, a*b, a/b, a%b, --a, ++a, b++, b--,                // arithmetical (float)
      a&&b, a||b, !a, a?b:c,                    // logical (boolean)
      a>b, a>=b, a<b, a<=b, a==b, a!=b,                // comparisons (boolean)
      a&b, a|b, a^b, ~a, a>>b, a<<b,                  // binary (integer)
      a**b, -a %% b, a <<< b, a >>> b
    )
  `, {})

  let { o0, o1, o2, o3, o4, o5, o5a, o6, o6a, o7, o8, o9, o10, o11, o12, o13, o14, o15, o16, o17, o18, o19, o20, o21, o22, o23, o24, o25, o26 } = compileWat(ops, {}).instance.exports
  is(o0.value, 5), is(o1.value, 1), is(o2.value, 6), is(o3.value, 3 / 2), is(o4.value, 3 % 2)
  is(o5.value, 2), is(o5a.value, 3), is(o6.value, 2), is(o6a.value, 3)
  is(o7.value, 2), is(o8.value, 3), is(o9.value, 0), is(o10.value, 2)
  is(o11.value, 1), is(o12.value, 1), is(o13.value, 0), is(o14.value, 0), is(o15.value, 0), is(o16.value, 1)
  is(o17.value, 3 & 2), is(o18.value, 3 | 2), is(o19.value, 3 ^ 2, 'a^b'), is(o20.value, ~3), is(o21.value, 3 >> 2), is(o22.value, 3 << 2)
  is(o23.value, 3 ** 2, 'a**b'), is(o24.value, 1, '-a %%%% b'), is(o25.value, rleft(3, 2)), is(o26.value, rright(3, 2))
  function rleft(value, numBits) {
    numBits = numBits % 32;
    return (value << numBits) | (value >>> (32 - numBits));
  }
  function rright(value, numBits) {
    numBits = numBits % 32;
    return (value >>> numBits) | (value << (32 - numBits));
  }
})
