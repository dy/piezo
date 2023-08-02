// test wast compiler

import t, { almost, is, not, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import compile from '../src/compile.js'
import Wabt from '../lib/wabt.js'
// import Wabt from 'wabt'


function clean (str) {
	if (Array.isArray(str)) str = String.raw.apply(String, arguments)
	return str.trim()
    .replace(/^\s*\n/gm, '') //remove empty lines
    .replace(/^\s*/gm, '') //remove indentation/tabulation
    .replace(/[\n\r]+/g, '\n') //transform all \r to \n
    .replace(/(\s)\s+/g, '$1') //replace duble spaces/tabs to single ones
}

// convert wast code to binary
const wabt = await Wabt()
export function compileWat (code, imports={}) {
  code =
  '(func $funcref.log (import "imports" "log") (param funcref))\n' +
  '(func $externref.log (import "imports" "log") (param externref) (result externref))\n' +
  '(func $i32.log (import "imports" "log") (param i32) (result i32))\n' +
  '(func $i32.log2 (import "imports" "log") (param i32 i32) (result i32 i32))\n' +
  '(func $i32.log3 (import "imports" "log") (param i32 i32 i32) (result i32 i32 i32))\n' +
  '(func $f64.log (import "imports" "log") (param f64) (result f64))\n' +
  '(func $f64.log2 (import "imports" "log") (param f64 f64) (result f64 f64))\n' +
  '(func $f64.log3 (import "imports" "log") (param f64 f64 f64) (result f64 f64 f64))\n' +
  '(func $i64.log (import "imports" "log") (param i64) (result i64))\n' +
  code

  const wasmModule = wabt.parseWat('inline', code, {
    simd: true,
    reference_types: true,
    gc: true,
    bulk_memory: true
    // function_references: true
  })

  const binary = wasmModule.toBinary({
    log: true,
    canonicalize_lebs: true,
    relocatable: false,
    write_debug_names: false,
  })
  wasmModule.destroy()

  const config = {
    imports: {
      ...(imports.imports||{}),
      log(...args){ console.log(...args); },
    },
    ...imports
  }
  // sync instance - limits buffer size to 4kb
  const module = new WebAssembly.Module(binary.buffer)
  return { module, instance: new WebAssembly.Instance(module, config) }

  // async instance
  // return WebAssembly.instantiate(binary.buffer, config)
}

t('compile: comments', t => {
  let wat = compile(`x(a,w,h)=(
    a=1
    ;; a=2
  ), y()=(
    ;;(
  ).`)
  let mod = compileWat(wat)
  let {x} = mod.instance.exports
  is(x(), 1)
})

t('compile: globals basic', t => {
  // TODO: single global
  // TODO: multiply wrong types
  // TODO: define globals via group (a,b,c).

  // FIXME: undefined variable throws error
  // throws(() => compile(analyse(parse(`pi2 = pi*2.0;`))), /pi is not defined/)

  let wat = compile(`
    pi = 3.14;
    pi2 = pi*2.0;
    sampleRate = 44100;
    sampleRate, pi, pi2.
  `)
  let mod = compileWat(wat)
  is(mod.instance.exports.pi.value, 3.14)
  is(mod.instance.exports.pi2.value, 3.14*2)
  is(mod.instance.exports.sampleRate.value, 44100)
})

t('compile: globals multiple', () => {
  // FIXME: must throw
  // let wat = compile(`pi, pi2, sampleRate = 3.14, 3.14*2, 44100.`)
  let wat = compile(`(pi, pi2, sampleRate) = (3.14, 3.14*2, 44100).`)
  let mod = compileWat(wat)
  is(mod.instance.exports.pi.value, 3.14)
  is(mod.instance.exports.pi2.value, 3.14*2)
  is(mod.instance.exports.sampleRate.value, 44100)

  wat = compile(`(a,b) = (-1, -1.0).`)
  mod = compileWat(wat)
  is(mod.instance.exports.a.value, -1)
  is(mod.instance.exports.b.value, -1)

  wat = compile(`(a,b) = (-1, -1.0).`)
  mod = compileWat(wat)
  is(mod.instance.exports.a.value, -1)
  is(mod.instance.exports.b.value, -1)
})

t('compile: export - no junk exports', () => {
  let wat = compile(`w()=(); y=[1]; x()=(*i=0), z=[y.0, v=[1]].`)
  let mod = compileWat(wat)
  same(Object.keys(mod.instance.exports), ['__memory','x','z'])
})

t('compile: numbers negatives', t => {
  let wat = compile(`x=-1.`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)

  wat = compile(`x=-1.0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)
})

t('compile: numbers inc/dec', t => {
  let wat = compile(`x=0; y=x++; x,y.`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, 1)
  is(mod.instance.exports.y.value, 0)

  wat = compile(`x=0; y=++x; x,y.`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, 1)
  is(mod.instance.exports.y.value, 1)

  wat = compile(`x=0; y=x--; x,y.`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)
})

t('compile: operators - pow', t => {
  let wat = compile(`x=2**(1/2),y=x**3,z=x**-2.`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, Math.sqrt(2))
  is(mod.instance.exports.y.value, mod.instance.exports.x.value**3)
  almost(mod.instance.exports.z.value, mod.instance.exports.x.value**-2)
})

t('compile: units', t => {
  let wat = compile(`
    1k = 1000; 1pi = 3.1415;
    1s = 44100; 1m=60s; 1h=60m; 1ms = 0.001s;
    a=10.1k, b=2pi, c=1h2m3.5s.
  `)

  let mod = compileWat(wat)
  is(mod.instance.exports.a.value, 10100)
  is(mod.instance.exports.b.value, 3.1415*2)
  is(mod.instance.exports.c.value, 60*60*44100 + 2*60*44100 + 3.5*44100)
})

t.todo('compile: units - errors', t => {
  // bad expressions
  //
  compile(`1h=1s;1s=44800;`)
  compile(`1k=x();`)
})

t('compile: conditions', t => {
  let wat, mod
  wat = compile(`a=1;b=2;c=a?1:2.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1)

  wat = compile(`a=1;b=2;a?c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2)

  wat = compile(`a=0;b=2;a?c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 0)

  wat = compile(`a=0.0;b=2.1;a?c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 0)

  wat = compile(`a=0.1;b=2.1;a?c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2.1)

  wat = compile(`a=1;b=2;a?:c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 0)

  wat = compile(`a=0;b=2;a?:c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2)

  wat = compile(`a=0.0;b=2.1;a?:c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2.1)

  wat = compile(`a=0.0;b=2.1;c=a?b.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 0)

  wat = compile(`a=0.1;b=2.1;c=a?b.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2.1)

  wat = compile(`x(px) = (px < 0 ? px = 0; px).`)
  mod = compileWat(wat)
  is(mod.instance.exports.x(-10), 0)
  is(mod.instance.exports.x(10), 10)
})

t('compile: conditions - or/and', t => {
  let wat, mod
  wat = compile(`z=1||0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1)
  wat = compile(`z=1.2||0.0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1.2)
  wat = compile(`z=1.2||0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1.2)
  wat = compile(`z=1||0.0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1)
  wat = compile(`z=1.2&&0.2.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 0.2)
  wat = compile(`z=1&&2.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 2)
})

t('compile: function oneliners', t => {
  let wat, mod
  // no semi
  wat = compile(`mult(a, b=2) = a * b.`)
  mod = compileWat(wat)
  is(mod.instance.exports.mult(2,4), 8)
  is(mod.instance.exports.mult(2), 4)

  // no result
  mod = compileWat(compile(` mult(a, b) = (a * b). `))
  is(mod.instance.exports.mult(2,4), 8)

  // console.log(compile(` mult = (a, b) -> (b; a * b).`))
  mod = compileWat(compile(` mult(a, b) = (b; a * b).`))
  is(mod.instance.exports.mult(2,4), 8)

  mod = compileWat(compile(` mult(a, b) = (b; a * b;). `))
  is(mod.instance.exports.mult(2,4), 8)
})

t('compile: function shadows global args', t => {
  let mod = compileWat(compile(`a=1, mult(a) = (a=2).`))
  is(mod.instance.exports.a.value, 1)
  is(mod.instance.exports.mult(), 2)
  is(mod.instance.exports.a.value, 1)
})

t.todo('debugs', t => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const importObject = { x: { y: ()=>123, z:123 }};
  let {instance} = compileWat(`
    (import "x" "y" (func $xy (result i32)))
    (import "x" "z" (global $xy i32))
    (memory (export "__memory") 1 2048)
    (export "xy" (func $xy))
  `, importObject)
  console.log(instance)
  // instance.exports.x(instance.exports.x(instance.exports.cb))
})

t('compile: vars misc', t => {
  let wat,x;
  x = compileWat(compile(`x;x.`)).instance.exports.x // unknown type falls to f64
  x = compileWat(compile(`x=1;x.`)).instance.exports.x // int type
  x = compileWat(compile(`x=1.0;x.`)).instance.exports.x // float type
  x = compileWat(compile(`x()=1;x.`)).instance.exports.x // func type
  // x = compileWat(compile(`x=0..10;x.`)).instance.exports.x // range type
  x = compileWat(compile(`x=[];x.`)).instance.exports.x // arr type
  x = compileWat(compile(`x;x=1;x.`)).instance.exports.x // late-int type
  x = compileWat(compile(`x;x=1.0;x.`)).instance.exports.x // late-float type
  // x = compileWat(compile(`x;x()=1;x.`)).instance.exports.x // late-func type
  // x = compileWat(compile(`x;x=0..10;x.`)).instance.exports.x // late-range type
  x = compileWat(compile(`x;x=[];x.`)).instance.exports.x // late-arr type
})

t('compile: ranges basic', t => {
  let wat = compile(`x = 11 <? 0..10.`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, 10)

  wat = compile(`x = 0 <? 1..10.`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, 1)

  wat = compile(`clamp(x) = (x <? 0..10).`)
  mod = compileWat(wat)
  is(mod.instance.exports.clamp(11), 10)
  is(mod.instance.exports.clamp(-1), 0)
})

t('compile: group assign cases', t => {
  let wat, mod
  wat = compile(`a=1;b=2;c=(a,b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1, 'c=(a,b)')

  wat = compile(`a=1;b=2,c=3;(b,a)=(c,b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.b.value, 3, '(b,a)=(c,b)')
  is(mod.instance.exports.a.value, 2)

  wat = compile(`a=1;b=2;(c,b)=(a,b);a,b,c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1,'(c,b)=(a,b)')
  is(mod.instance.exports.b.value, 2)
  is(mod.instance.exports.a.value, 1)

  wat = compile(`a=1;b=2;(c,a,b)=(a,b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1, '(c,a,b)=(a,b)')
  is(mod.instance.exports.a.value, 2)
  is(mod.instance.exports.b.value, 2)

  wat = compile(`a=1;b=2;(c,d)=(a,b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1, '(c,d)=(a,b)')
  is(mod.instance.exports.d.value, 2)

  wat = compile(`a=1;b=2;a,(b,b)=a.`)
  mod = compileWat(wat)
  is(mod.instance.exports.b.value, 1, '(b,b)=a')
  is(mod.instance.exports.a.value, 1)

  wat = compile(`a=1;b=2,c;a,(b,c)=a.`)
  mod = compileWat(wat)
  is(mod.instance.exports.b.value, 1, '(b,c)=a')
  is(mod.instance.exports.c.value, 1)
})

t('compile: group ops cases', t => {
  let wat, mod

  wat = compile(`f(a) = ((x, y) = (a+2,a-2); x,y).`)
  mod = compileWat(wat);
  is(mod.instance.exports.f(4), [6,2], `(a,b)=(c+1,c-1)`);

  // wat = compile(`f(a,b,h) = (a, b) * h.`)
  // mod = compileWat(wat)
  // is(mod.instance.exports.f(2,3,3), [6,9], `(a, b) * h`);

  // wat = compile(`f(a,b,h) = (a, b) * (c, d).`)
  // mod = compileWat(wat)
  // is(mod.instance.exports.f(2,3,3), [6,2], `(a,b)=(c+1,c-1)`);

  // wat = compile(`f(a,b,h) = (a>=h, b>=h) ? (a=h-1, b=h-1).`)
  // mod = compileWat(wat)
  // is(mod.instance.exports.f(2,3,3), [6,2], `(a,b)=(c+1,c-1)`);

  // wat = compile(`f(a,b,h) = (a,b) >= h ? (a,b) = h-1.`)
  // mod = compileWat(wat)
  // is(mod.instance.exports.f(2,3,3), [6,2], `(a,b)=(c+1,c-1)`);

  // wat = compile(`(ptr0, ptr1, ptr2) = (y, y1, y2) * w;`)
  // mod = compileWat(wat)

  // wat = compile(`(val0, val1, val2 = data[ptr0 + (x, x1, x2)];`)
  // mod = compileWat(wat)
})

t('compile: list basic', t => {
  let wat = compile(`x = [1, 2, 3], y = [4,5,6,7]; x,y,xl=x[],yl=y[].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let {__memory:memory, x, y, xl, yl} = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 3)
  // let i32s = new Int32Array(memory.buffer, 0)
  is(xarr[0], 1,'x0')
  is(xarr[1], 2,'x1')
  is(xarr[2], 3,'x2')
  is(xl.value,3,'xlen')
  let yarr = new Float64Array(memory.buffer, y.value, 4)
  is(yarr[0], 4,'y0')
  is(yarr[1], 5,'y1')
  is(yarr[2], 6,'y2')
  is(yarr[3], 7,'y3')
  is(yl.value,4,'ylen')
})

t('compile: list from static range', t => {
  let wat = compile(`x=[..3], y=[0..4]; x,y,xl=x[],yl=y[].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let {__memory:memory, x, y, xl, yl} = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 10)
  is(xarr[0], 0,'x0')
  is(xarr[1], 0,'x1')
  is(xarr[2], 0,'x2')
  is(xl.value,3,'xlen')
  let yarr = new Float64Array(memory.buffer, y.value, 4)
  is(yarr[0], 0,'y0')
  is(yarr[1], 1,'y1')
  is(yarr[2], 2,'y2')
  is(yarr[3], 3,'y3')
  is(yl.value,4,'ylen')
})

t('compile: list from dynamic range', t => {
  let wat = compile(`a=3, x=[0..a], xl=x[].`)
  // , y=[1, x[0]..x[2], 2..-2]; x,y, xl=x[],yl=y[].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let {__memory:memory, x, y, xl, yl} = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 3)
  is(xarr[0], 0,'x0')
  is(xarr[1], 1,'x1')
  is(xarr[2], 2,'x2')
  is(xl.value, 3,'xlen')
})

t.todo('compile: lists from invalid ranges', t => {
  let wat = compile(`x=[2..]`)
      wat = compile(`x=[..]`)
      wat = compile(`x=[..-2]`)
      wat = compile(`x=[..-2]`)
})

t('compile: lists - nested static', t => {
  let wat = compile(`x=[1, y=[2, z=[3]]], y, z, w=[1,2], xl=x[], yl=y[], zl=z[], wl=w[].`)
  // let wat = compile(`x=[1,[2]].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let {__memory:memory, x, y, z, xl, yl, zl, w, wl} = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 10)
  is(xarr[0], 1,'x0')
  is(xarr[1], y.value,'x1')
  is(xl.value, 2,'xlen')
  let yarr = new Float64Array(memory.buffer, y.value, 3)
  is(yarr[0], 2,'y0')
  is(yarr[1], z.value,'y1')
  is(yl.value, 2,'ylen')
  let zarr = new Float64Array(memory.buffer, z.value, 3)
  is(zarr[0], 3,'z0')
  is(zl.value, 1,'zlen')
  let warr = new Float64Array(memory.buffer, w.value, 3)
  is(warr[0], 1,'w0')
  is(warr[1], 2,'w1')
  is(wl.value, 2,'wlen')
})

t.todo('compile: list comprehension', t => {
  let wat = compile(`x = [1..3 <| @ * 2]`)
})

t.todo('compile: list nested comprehension', t => {
  let wat = compile(`x = [1..3 <| [0..@ <| @ * 2]]`)
})

t('compile: list simple write', t => {
  let wat = compile(`x = [..3]; x[0]=1; x.1=2; x[-1]=x[]; x.`)
  // console.log(wat)
  let mod = compileWat(wat)
  let {__memory:memory, x} = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 3)
  is(xarr[0], 1,'x0')
  is(xarr[1], 2,'x1')
  is(xarr[2], 3,'x2')
})

t('compile: list wrap index', t => {
  let wat = compile(`x = [1, 2, 3]; a=x.0,b=x.1,c=x[2],d=x[-1].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let {a,b,c,d} = mod.instance.exports
  is(a.value, 1)
  is(b.value, 2)
  is(c.value, 3)
  is(d.value, 3)
})

t.todo('compile: sublist', t => {
  let wat = compile(`x = [1,2,3], y = [x].`)
  let mod = compileWat(wat)
  let {__memory:memory, x} = mod.instance.exports
  let arr = new Float64Array(memory.buffer, 0, 2), ptr = x.value
  is(arr[ptr], 1)
  is(arr[ptr+1], 2)
})

t.skip('compile: memory grow', t => {
  // FIXME: possibly add option to export internals
  let wat = compile(`grow()=[..8192].`)
  let mod = compileWat(wat)
  let {__memory, __mem, grow} = mod.instance.exports
  for (let i = 1; i < 100; i++) {
    is(__mem.value, 65536*i)
    grow()
  }
})

t('compile: early returns', t => {
  let wat = compile(`x(a)=(a ? ^-a; 123), y(a)=(a?^12;13.4), z(a)=(a?^11:^12.1;^13).`)
  let mod = compileWat(wat)
  let {__memory:memory, x, y, z} = mod.instance.exports
  is(x(0), 123);
  is(x(1), -1);

  is(y(0), 13.4);
  is(y(1), 12);

  is(z(0), 12.1);
  is(z(1), 11);

  throws(() => {
    compile(`y(a,b)=(a ? ^b; a,b).`)
  }, 'Inconsistent')
})

t.todo('compile: break multiple scopes', t => {
})

t.todo('compile: break/continue', t => {

})

t('compile: loops range global', t => {
  let wat, mod
  wat = compile(`x=[1..3]; 0..2 |> x[@]=@+1; x.`)
  mod = compileWat(wat)
  let {__memory:memory, x} = mod.instance.exports

  let arr = new Float64Array(memory.buffer, x.value, 3)

  is(arr[0], 1)
  is(arr[1], 2)
  is(arr[2], 3)
})

t('compile: loops range local', t => {
  let wat, mod
  wat = compile(`x=[1..3]; fill() = (0..x[] |> x[@]=@+1); fill, x.`)
  mod = compileWat(wat)
  let {__memory:memory, x, fill} = mod.instance.exports

  let arr = new Float64Array(memory.buffer, x.value, 3)
  is(fill(),3);

  is(arr[0], 1)
  is(arr[1], 2)
  is(arr[2], 3)
})

t('compile: loop range in range', t => {
  let wat = compile(`a=[..9], f(a,w,h)=(
    0..w |> (x=@;
      0..h |> (y=@;
        a[y*w + x] = x+y*w
      )
    )
  ).`)
  let mod = compileWat(wat)
  let {__memory:memory, a, f} = mod.instance.exports

  let arr = new Float64Array(memory.buffer, a.value, 9)
  is(arr, [0,0,0,0,0,0,0,0,0])
  f(a,3,3)
  is(arr, [0,1,2,3,4,5,6,7,8])
})

t.todo('compile: loop in loop', t => {
  let wat = compile(`
    x=[..4];
    i=0;
    i<2 |> (
      j=0;
      j<2 |> (
        x[i*2+j]=i*2+j;
        j++
      );
      i++;
    );
  x.`)
  let mod = compileWat(wat)
  let {__memory:memory, x} = mod.instance.exports

  let arr = new Float64Array(memory.buffer, x.value, 4)

  is(arr[0], 0)
  is(arr[1], 1)
  is(arr[2], 2)
  is(arr[3], 3)
})

t.todo('compile: loop over list', t => {
  let wat = compile(`x = [1,2,3]; y = x <| x -> x * 2.`)
  let mod = compileWat(wat)
  let {memory, y} = mod.instance.exports
  let arr = new Float64Array(memory.buffer, 0, 3), ptr = y.value
  is(arr[ptr], 2)
  is(arr[ptr+1], 4)
  not(arr[ptr+2], 6)
})

t('compile: state variable - basic', t => {
  let wat = compile(`x()=(*i=0;i++).`)
  let mod = compileWat(wat)
  let {x} = mod.instance.exports
  is(x(),0)
  is(x(),1)
  is(x(),2)
})

t('compile: state variable - scope', t => {
  let wat = compile(`x()=(*i=0;i++), y()=x().`)
  let mod = compileWat(wat)
  let {x,y} = mod.instance.exports
  is(x(),0)
  is(y(),0)
  is(x(),1)
  is(x(),2)
  is(y(),1)
  is(y(),2)
})

t('compile: state variable - array init', t => {
  let wat = compile(`x()=(*i=[..2]; i.0++ + i.1++), y()=x().`)
  let mod = compileWat(wat)
  let {x,y} = mod.instance.exports
  is(x(),0)
  is(x(),2)
  is(x(),4)
  is(y(),0)
  is(y(),2)
  is(y(),4)
})

t.todo('compile: state variable - group init', t => {
  let wat = compile(`x()=(*(i=0,j=1,k=2);i+j+k), y()=x().`)
  let mod = compileWat(wat)
  let {x,y} = mod.instance.exports
})

t.todo('compile: state variable - multiple states', t => {
  let wat = compile(`x()=(*i=0,*j=1,*a=[..2]; i++ + j++ + a[0]++ + a[1]++); y()=(x()+x());`)
  let mod = compileWat(wat)
  let {x,y} = mod.instance.exports
  is(x(),1)
  is(x(),5)
  is(x(),9)
  is(x(),13)
  is(y(),6)
  is(y(),21)
})

t.todo('compile: state variable - mixed deps', t => {
  let wat = compile(`x()=(*i=0,i++); y()=(*a=[0,1];x()+a[0]+a[1]++); z()=(x()+y());`)
  let mod = compileWat(wat)
  let {x,y,z} = mod.instance.exports
})

t('compile: import simple', t => {
  const imports = {math:{sin:Math.sin, pi:Math.PI}};
  let wat = compile(`<math#pi,sin>; pi, sinpi(n=1)=sin(pi*n).`, {imports})
  let mod = compileWat(wat, imports)
  let {pi,sinpi} = mod.instance.exports
  is(pi.value, Math.PI)
  is(sinpi(1/2), Math.sin(Math.PI / 2))
  is(sinpi(2), Math.sin(Math.PI * 2))
})

t.todo('compile: import non-existent', t => {

})

t.todo('compile: audio-gain', t => {
  let wat = compile(`
  blockSize = 1024;
  gain = ([blockSize]data, volume <? 0..1000) -> [data | x -> x * volume];
  `)
  let mod = compileWat(wat)
  let {gain} = mod.instance.exports
  is(gain([1,2,3],2),[2,4,6])

  // let wat = compile(`
  //   blockSize = 1024;
  //   gain = ([2, blockSize]data, volume <? 0..1000) -> [data | ch -> (ch | x -> x * volume)];
  // `)
})

t.todo('compile: sine gen', t => {
  let wat = compile(analyse(parse(`
    pi = 3.14;
    pi2 = pi*2;
    sampleRate = 44100;

    sine(freq) = (
      *phase=0;
      phase += freq * pi2 / sampleRate;
      [sin(phase)].
    ).
  `)))
  console.log(wat)

  is(wat, [])
})

