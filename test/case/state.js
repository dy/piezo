import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t('state: basic', t => {
  let wat = compileMel(`x()=(*i=0;i++)`)
  let mod = compileWat(wat)
  let { x } = mod.instance.exports
  is(x(), 0)
  is(x(), 1)
  is(x(), 2)
})

t('state: scope', t => {
  let wat = compileMel(`x()=(*i=0;i++), y()=x()`)
  let mod = compileWat(wat)
  let { x, y } = mod.instance.exports
  is(x(), 0)
  is(y(), 0)
  is(x(), 1)
  is(x(), 2)
  is(y(), 1)
  is(y(), 2)
})

t('state: array init', t => {
  let wat = compileMel(`x()=(*i=[..2]; i[0]++ + i[1]++), y()=x()`)
  let mod = compileWat(wat)
  let { x, y, memory } = mod.instance.exports
  is(x(), 0)
  console.log(new Float64Array(memory.buffer))
  is(x(), 2)
  console.log(new Float64Array(memory.buffer))
  is(x(), 4)
  console.log(new Float64Array(memory.buffer))
  is(y(), 0)
  console.log(new Float64Array(memory.buffer))
  is(y(), 2)
  is(y(), 4)
})

t.todo('state: group init', t => {
  let wat = compileMel(`x()=(*(i=0,j=1,k=2);i+j+k), y()=x()`)
  let mod = compileWat(wat)
  let { x, y } = mod.instance.exports
})

t.todo('state: multiple states', t => {
  let wat = compileMel(`x()=(*i=0,*j=1,*a=[..2]; i++ + j++ + a[0]++ + a[1]++); y()=(x()+x());`)
  let mod = compileWat(wat)
  let { x, y } = mod.instance.exports
  is(x(), 1)
  is(x(), 5)
  is(x(), 9)
  is(x(), 13)
  is(y(), 6)
  is(y(), 21)
})

t.todo('state: mixed deps', t => {
  let wat = compileMel(`x()=(*i=0,i++); y()=(*a=[0,1];x()+a[0]+a[1]++); z()=(x()+y());`)
  let mod = compileWat(wat)
  let { x, y, z } = mod.instance.exports
})
