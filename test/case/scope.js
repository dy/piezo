import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t('scope: early returns', t => {
  let wat = compileMel(`x(a)=(a ? ./-a; 123), y(a)=(a?./12;13.4)`)
  let mod = compileWat(wat)
  let { memory, x, y, z } = mod.instance.exports
  is(x(0), 123);
  is(x(1), -1);

  is(y(0), 13.4);
  is(y(1), 12);

  console.log('---------compile z')
  wat = compileMel(`z(a)=(a ? ./11 : ./12.1; ./13)`)
  mod = compileWat(wat);
  z = mod.instance.exports.z
  is(z(0), 12.1);
  is(z(1), 11);

  throws(() => {
    compileMel(`y(a,b)=(a ? ./b; a,b)`)
  }, 'Inconsistent')
})

t.todo('scope: break multiple scopes', t => {
})

t.todo('scope: break/continue', t => {

})
