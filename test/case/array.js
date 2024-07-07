import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t('array: basic', t => {
  let wat = compileMel(`x = [1.1, 2.22, 3.333], y = [4.1234,5.54321,654321.123456,7.7777777]; x,y,xl=x[],yl=y[]`)
  let mod = compileWat(wat)
  let { memory, x, y, xl, yl } = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 3)
  is(xarr[0], 1.1, 'x0')
  is(xarr[1], 2.22, 'x1')
  is(xarr[2], 3.333, 'x2')
  is(xl.value, 3, 'xlen')
  let yarr = new Float64Array(memory.buffer, y.value, 4)
  is(yarr[0], 4.1234, 'y0')
  is(yarr[1], 5.54321, 'y1')
  is(yarr[2], 654321.123456, 'y2')
  is(yarr[3], 7.7777777, 'y3')
  is(yl.value, 4, 'ylen')
})

t('array: basic local', t => {
  let wat = compileMel(`x() = [1, 2]`)
  let mod = compileWat(wat)
  let { memory, x } = mod.instance.exports
  let x0 = new Float64Array(memory.buffer, x(), 2)
  is(x0[0], 1, 'x0')
  is(x0[1], 2, 'x1')
  not(x(), x(), 'each instance is new')
  // console.log(new Float64Array(memory.buffer))
})

t('array: from static range', t => {
  let wat = compileMel(`x=[..3], y=[0..4]; z=[4..0], x,y,xl=x[],yl=y[]`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { memory, x, y, xl, yl, z } = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 10)
  is(xarr[0], 0, 'x0')
  is(xarr[1], 0, 'x1')
  is(xarr[2], 0, 'x2')
  is(xl.value, 3, 'xlen')
  let yarr = new Float64Array(memory.buffer, y.value, 4)
  is(yarr[0], 0, 'y0')
  is(yarr[1], 1, 'y1')
  is(yarr[2], 2, 'y2')
  is(yarr[3], 3, 'y3')
  is(yl.value, 4, 'ylen')
  let zarr = new Float64Array(memory.buffer, z.value, 4)
  is(zarr[0], 4, 'z0')
  is(zarr[1], 3, 'z1')
  is(zarr[2], 2, 'z2')
  is(zarr[3], 1, 'z3')
})

t('array: from dynamic range', t => {
  let wat = compileMel(`a=3, x=[0..a], xl=x[]`)
  // , y=[1, x[0]..x[2], 2..-2]; x,y, xl=x[],yl=y[]`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { memory, x, y, xl, yl } = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 3)
  is(xarr[0], 0, 'x0')
  is(xarr[1], 1, 'x1')
  is(xarr[2], 2, 'x2')
  is(xl.value, 3, 'xlen')
})

t('array: from invalid ranges', t => {
  let wat
  throws(() => { wat = compileMel(`x=[2..]`) }, /range/)
  throws(() => { wat = compileMel(`x=[..]`) }, /range/)
  throws(() => { wat = compileMel(`x=[..-2]`) }, /range/)
})

t('array: nested static', t => {
  let wat = compileMel(`x=[1, y=[2, [3,3.14]]], w=[4,5]`)
  // let wat = compileMel(`y=[2], x=[1, y], w=[4,5]`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { memory, x, y, w } = mod.instance.exports
  console.log(new Float64Array(memory.buffer))
  let xarr = new Float64Array(memory.buffer, x.value, 10)
  is(xarr[0], 1, 'x0')
  is(xarr[1], y.value, 'x1')
  is(len(x.value), 2, 'xlen')
  let yarr = new Float64Array(memory.buffer, y.value, 3)
  is(yarr[0], 2, 'y0')
  is(len(y.value), 2, 'ylen')
  let zarr = new Float64Array(memory.buffer, yarr[1], 3)
  is(zarr[0], 3, 'z0')
  is(zarr[1], 3.14, 'z1')
  is(len(yarr[1]), 2, 'zlen')
  let warr = new Float64Array(memory.buffer, w.value, 3)
  is(len(w.value), 2, 'wlen')
  is(warr[0], 4, 'w0')
  is(warr[1], 5, 'w1')
})

t.todo('array: comprehension', t => {
  let wat = compileMel(`x = [1..3 |> _ * 2]`)
  let mod = compileWat(wat)
  let { memory, x } = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x, 2)
  is(xarr, [1, 2])
})

t.todo('array: nested comprehension', t => {
  let wat = compileMel(`x = [1..3 <| [0.._ <| _ * 2]]`)
})

t('array: simple write', t => {
  let wat = compileMel(`x=[..3]; x[0]=1; x[1]=2; x[-1]=x[]; x`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { memory, x } = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 3)
  is(xarr[0], 1, 'x0')
  is(xarr[1], 2, 'x1')
  is(xarr[2], 3, 'x2')
})

t('array: simple read', t => {
  let wat = compileMel(`x = [1, 2, 3]; a=x[0],b=x[1],c=x[2],d=x[-1]`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { a, b, c, d } = mod.instance.exports
  is(a.value, 1)
  is(b.value, 2)
  is(c.value, 3)
  is(d.value, 3)
})

t('array: group read', t => {
  let wat = compileMel(`x = [1, 2, 3]; (a,b,c)=x[0,1,2]`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { a, b, c } = mod.instance.exports
  is(a.value, 1)
  is(b.value, 2)
  is(c.value, 3)
})

t('array: group write', t => {
  let wat = compileMel(`x = [..3]; x[0,1,2]=(1,2,3)`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { x, memory } = mod.instance.exports
  const mem = new Float64Array(memory.buffer, x.value, 3)
  is(mem[0], 1)
  is(mem[1], 2)
  is(mem[2], 3)
})

t('compile: sublist', t => {
  let wat = compileMel(`x = [1,2,3], y = [x]`)
  let mod = compileWat(wat)
  let { memory, x, y } = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x, 3), yarr = new Float64Array(memory.buffer, y, 1)
  is(xarr[0], 1)
  is(xarr[1], 2)
  is(xarr[2], 3)
  is(yarr[0], x.value)
})



// get length or an array
export function len(n) {
  let data = new DataView(new ArrayBuffer(8))
  data.setFloat64(0, n)
  return data.getInt32(4)
}
