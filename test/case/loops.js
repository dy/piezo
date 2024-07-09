import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t('loops: range global', t => {
  let wat, mod, arr
  wat = compileMel(`x=[1..3]; 0..x[] |> x[_]=_+1; x`)
  mod = compileWat(wat);
  let { memory, x } = mod.instance.exports
  arr = new Float64Array(memory.buffer, x.value, 3)
  is(arr[0], 1)
  is(arr[1], 2)
  is(arr[2], 0, 'unitialized')
})

t('loops: range local', t => {
  let wat, mod
  wat = compileMel(`x=[1..3], c = 0, fill() = (0..x[] |> (x[_]+=1,c++).)`)
  mod = compileWat(wat)
  let { memory, x, fill, c } = mod.instance.exports

  let arr = new Float64Array(memory.buffer, x.value, 3)
  is(arr[0], 1)
  is(arr[1], 2)

  // is(fill(), 3);
  fill()

  is(c.value, 2, 'length is ok')
  is(arr[0], 2)
  is(arr[1], 3)
  is(arr[2], 0, 'unitialized members')
})

t.todo('loop: current item write', t => {
  let wat, mod
  wat = compileMel(`x=[1..3]; x[..] |> _+=1; x`)
  mod = compileWat(wat)
  let { memory, x } = mod.instance.exports
  arr = new Float64Array(memory.buffer, x.value, 3)
  is(arr[0], 1)
  is(arr[1], 2)
  is(arr[2], 0, 'unitialized')
})

t('loop: range in range', t => {
  let wat = compileMel(`a=[..9], f(a,w,h)=(
    0..w |> (x=_;
      0..h |> (y=_;
        a[y*w + x] = x+y*w
      ).
    ).
  )`)
  let mod = compileWat(wat)
  let { memory, a, f } = mod.instance.exports

  let arr = new Float64Array(memory.buffer, a.value, 9)
  is(arr, [0, 0, 0, 0, 0, 0, 0, 0, 0])
  f(a, 3, 3)
  is(arr, [0, 1, 2, 3, 4, 5, 6, 7, 8])
})

t.todo('loop: as fn return', () => {
  let wat = compileMel(`x=[1..3]; fill() = (0..x[] |> x[_]=_+1); fill, x`)
})

t.todo('compile: current item assignment', t => {
  let wat = compileMel(`
    x=[..4];
    (i=..3) |> x[i]=i*2`)
  let mod = compileWat(wat)
  let { memory, x } = mod.instance.exports

  let arr = new Float64Array(memory.buffer, x.value, 4)

  is(arr[0], 0)
  is(arr[1], 2)
  is(arr[2], 4)
  is(arr[3], 0, 'undefined')
})

t.todo('loop: in loop', t => {
  let wat = compileMel(`
    x=[..4];
    (i=..2) |> (
      (j=..2) |> (
        x[i*2+j]=i*2+j;
        j++
      );
      i++;
    );
    x`)
  let mod = compileWat(wat)
  let { memory, x } = mod.instance.exports

  let arr = new Float64Array(memory.buffer, x.value, 4)

  is(arr[0], 0)
  is(arr[1], 1)
  is(arr[2], 2)
  is(arr[3], 3)
})

t.todo('loop: over list', t => {
  let wat = compileMel(`x = [1,2,3]; y = x <| x -> x * 2`)
  let mod = compileWat(wat)
  let { memory, y } = mod.instance.exports
  let arr = new Float64Array(memory.buffer, 0, 3), ptr = y.value
  is(arr[ptr], 2)
  is(arr[ptr + 1], 4)
  not(arr[ptr + 2], 6)
})
