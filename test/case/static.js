import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSone from '../../src/compile.js'
import { compileWat } from '../util.js'

t('static: basic', t => {
  let wat = compileSone(`x()=(*i=0;i++)`)
  let mod = compileWat(wat)
  let { x } = mod.instance.exports
  is(x(), 0)
  is(x(), 1)
  is(x(), 2)
})

t('static: scope', t => {
  let wat = compileSone(`x()=(*i=0;i++), y()=x()`)
  let mod = compileWat(wat)
  let { x, y } = mod.instance.exports
  is(x(), 0)
  is(y(), 1)
  is(x(), 2)
  is(x(), 3)
  is(y(), 4)
  is(y(), 5)
})

t('static: array init', t => {
  let wat = compileSone(`x()=(*i=[..2]; i[0]++ + i[1]++), y()=x()`)
  let mod = compileWat(wat)
  let { x, y, memory } = mod.instance.exports
  is(x(), 0)
  console.log(new Float64Array(memory.buffer))
  is(x(), 2)
  console.log(new Float64Array(memory.buffer))
  is(x(), 4)
  console.log(new Float64Array(memory.buffer))
  is(y(), 6)
  console.log(new Float64Array(memory.buffer))
  is(y(), 8)
  is(y(), 10)
})

t.todo('static: group init', t => {
  let wat = compileSone(`x()=(*(i=0,j=1,k=2);i+j+k), y()=x()`)
  let mod = compileWat(wat)
  let { x, y } = mod.instance.exports
})

t.todo('static: multiple states', t => {
  let wat = compileSone(`x()=(*i=0,*j=1,*a=[..2]; i++ + j++ + a[0]++ + a[1]++); y()=(x()+x());`)
  let mod = compileWat(wat)
  let { x, y } = mod.instance.exports
  is(x(), 1)
  is(x(), 5)
  is(x(), 9)
  is(x(), 13)
  is(y(), 6)
  is(y(), 21)
})

t.todo('static: mixed deps', t => {
  let wat = compileSone(`x()=(*i=0,i++); y()=(*a=[0,1];x()+a[0]+a[1]++); z()=(x()+y());`)
  let mod = compileWat(wat)
  let { x, y, z } = mod.instance.exports
})
