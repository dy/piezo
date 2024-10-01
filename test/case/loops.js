import t, { almost, is, not, ok, same, throws } from 'tst'
import compileSruti from '../../src/compile.js'
import { compileWat } from '../util.js'

t('loops: range global', t => {
  let wat, mod, arr
  wat = compileSruti(`x=[1..3]; 0..x[] |> x[_]=_+1; x`)
  mod = compileWat(wat);
  let { memory, x } = mod.instance.exports
  arr = new Float64Array(memory.buffer, x.value, 3)
  is(arr[0], 1)
  is(arr[1], 2)
  is(arr[2], 0, 'unitialized')
})

t('loops: range local', t => {
  let wat, mod
  wat = compileSruti(`x=[1..3], c = 0, fill() = (0..x[] |> (x[_]+=1,^c++))`)
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
  wat = compileSruti(`x=[1..3]; x[..] |> _+=1; x`)
  mod = compileWat(wat)
  let { memory, x } = mod.instance.exports
  arr = new Float64Array(memory.buffer, x.value, 3)
  is(arr[0], 1)
  is(arr[1], 2)
  is(arr[2], 0, 'unitialized')
})

t('loop: range in range', t => {
  let wat = compileSruti(`a=[..9], f(a,w,h)=(
    0..w |> (x=_;
      0..h |> (y=_;
        a[y*w + x] = x+y*w;
      );
    )
  )`)
  let mod = compileWat(wat)
  let { memory, a, f } = mod.instance.exports

  let arr = new Float64Array(memory.buffer, a.value, 9)
  is(arr, [0, 0, 0, 0, 0, 0, 0, 0, 0])
  f(a, 3, 3)
  is(arr, [0, 1, 2, 3, 4, 5, 6, 7, 8])
})

t.todo('loop: as fn return', () => {
  let wat = compileSruti(`x=[1..3]; fill() = (0..x[] |> x[_]=_+1); fill, x`)
})

t

t.todo('compile: current item assignment', t => {
  let wat = compileSruti(`
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
  let wat = compileSruti(`
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
  let wat = compileSruti(`x = [1,2,3]; y = x <| x -> x * 2`)
  let mod = compileWat(wat)
  let { memory, y } = mod.instance.exports
  let arr = new Float64Array(memory.buffer, 0, 3), ptr = y.value
  is(arr[ptr], 2)
  is(arr[ptr + 1], 4)
  not(arr[ptr + 2], 6)
})

t.todo('loop: iterate over range', () => {
  let wat, mod, memory, a, b

  wat = compileSruti(`a = (x = (1, 3..5, a[1..])) |> x;`)
  // supposed to compile to
  // 0.out ;; output of 0 group
  // 0.idx = 0 ;; 0 group element index
  // 0.cur ;; 0 group range cursor (current item)
  // 0.cur.null = 1 ;; if 0.cur is not active indicator
  // while() {
  //   if (0.idx == 0) 0.out = 1, 0.idx++
  //   else if (0.idx == 1) {
  //     if (0.cur.null) 0.cur = 3, 0.cur.null = 0
  //     0.out = 0.cur++
  //     if (0.cur >= 5) 0.idx++, 0.cur.null = 1
  //   }
  //   else if (0.idx == 2) {
  //     if (0.cur.null) 0.cur = 1, 0.cur.null = 0
  //     0.out = a[0.cur++]
  //     if (0.cur >= a[]) 0.idx++, 0.cur.null = 1
  //   }
  //   else break
  //   x = 0.out
  //   x
  // }
  mod = compileWat(wat);
  ; ({ memory, a, b } = mod.instance)

  is(new Float64Array(memory.buffer, b.value, 1), [2], `[(a,b..c) |> _]`);

  //

  //   `a..b |> _`
  //   `a.. |> _`
  //   `..b |> _`
  //   `.. |> _`
  //   `(a,b..c) |> _`
  //   `(a,b..) |> _`
  //   `(a,..c) |> _`
  //   `(a,..) |> _`
  //   `(a,b[c..]) |> _`
  //   `(a,b[c..],..d|>_*2) |> _`

  //   `a[b..c] |> _`
  //   `a[b..] |> _`
  //   `a[..c] |> _`
  //   `a[..] |> _`

  //   `a[a..b,c] |> _`
  //   `a[a..b,c..d] |> _`

  //   `a..b + c.. |> _`
  //   `(x = (a,b..c) + d..) |> _`
})
