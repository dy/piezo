import t, { almost, is, not, ok, same, throws } from 'tst'
import compileCode from '../../src/compile.js'
import { compileWat } from '../util.js'

t('static: basic', t => {
  let wat = compileCode(`x()=(*i=0;i++)`)
  let mod = compileWat(wat)
  let { x } = mod.instance.exports
  is(x(), 0)
  is(x(), 1)
  is(x(), 2)

  wat = compileCode(`x()=(*i;i++;i)`)
  mod = compileWat(wat)
  x = mod.instance.exports.x
  is(x(), NaN)
  is(x(), NaN)
})


t('static: array init', t => {
  let wat = compileCode(`x()=(*i=[..2]; i[0]++ + i[1]++), y()=x()`)
  let mod = compileWat(wat)
  let { x, y, memory } = mod.instance.exports
  is(x(), 0)
  is(x(), 2)
  is(x(), 4)
  is(y(), 6)
  is(y(), 8)
  is(y(), 10)
})

t('static: group init', t => {
  let wat = compileCode(`x()=(*(i=0,j=1,k=2);i,j,k;^(i,j,k)++);`)
  let mod = compileWat(wat)
  let { x } = mod.instance.exports
  is(x(), [0, 1, 2])
  is(x(), [1, 2, 3])
})

t('static: multiple states', t => {
  let wat = compileCode(`x()=(*i=0,*j=1,*a=[..2]; i++ + j++ + a[0]++ + a[1]++);`)
  let mod = compileWat(wat)
  let { x } = mod.instance.exports
  is(x(), 1)
  is(x(), 5)
  is(x(), 9)
  is(x(), 13)
})

t.todo('static: mixed deps', t => {
  let wat = compileCode(`x()=(*i=0,i++); y()=(*a=[0,1];x()+a[0]+a[1]++); z()=(x()+y());`)
  let mod = compileWat(wat)
  let { x, y, z } = mod.instance.exports
})
