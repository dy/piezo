// test wast compiler

import t, { almost, is, not, ok, same, throws } from 'tst'
import parse from '../src/parse.js'
import compileLino from '../src/compile.js'
import Wabt from '../lib/wabt.js'
import watr from 'watr';


// convert wast code to binary
const wabt = await Wabt()
export function compileWat(code, imports = {}) {
  code =
    '(func $i32.log (import "imports" "log") (param i32))\n' +
    '(func $i32.log2 (import "imports" "log") (param i32 i32))\n' +
    '(func $i32.log3 (import "imports" "log") (param i32 i32 i32))\n' +
    '(func $f64.log (import "imports" "log") (param f64))\n' +
    '(func $f64.log2 (import "imports" "log") (param f64 f64))\n' +
    '(func $f64.log3 (import "imports" "log") (param f64 f64 f64))\n' +
    '(func $i64.log (import "imports" "log") (param i64))\n' +
    code

  // WABT compilation
  // const wasmModule = wabt.parseWat('inline', code, {
  //   simd: true,
  //   reference_types: true,
  //   gc: true,
  //   bulk_memory: true
  //   // function_references: true
  // })
  // const { buffer } = wasmModule.toBinary({
  //   log: true,
  //   canonicalize_lebs: true,
  //   relocatable: false,
  //   write_debug_names: false,
  // })
  // wasmModule.destroy()

  const buffer = watr(code)

  const config = {
    imports: {
      ...(imports.imports || {}),
      log(...args) { console.log(...args); },
    },
    ...imports
  }

  // sync instance - limits buffer size to 4kb
  const module = new WebAssembly.Module(buffer)
  return { module, instance: new WebAssembly.Instance(module, config) }

  // async instance
  // return WebAssembly.instantiate(binary.buffer, config)
}

// get length or an array
function len(n) {
  let data = new DataView(new ArrayBuffer(8))
  data.setFloat64(0, n)
  return data.getInt32(4)
}

t('compile: comments', t => {
  let wat = compileLino(`x(a,w,h)=(
    a=1
    // a=2
  ), y()=(
    // (
  ).`)
  let mod = compileWat(wat)
  let { x } = mod.instance.exports
  is(x(), 1)
})

t('compile: globals basic', t => {
  // TODO: single global
  // TODO: multiply wrong types
  // TODO: define globals via group (a,b,c).

  // FIXME: undefined variable throws error
  // throws(() => compileLino(analyse(parse(`pi2 = pi*2.0;`))), /pi is not defined/)

  let wat = compileLino(`
    pi = 3.14;
    pi2 = pi*2.0;
    sampleRate = 44100;
    sampleRate, pi, pi2.
  `)
  let mod = compileWat(wat)
  is(mod.instance.exports.pi.value, 3.14)
  is(mod.instance.exports.pi2.value, 3.14 * 2)
  is(mod.instance.exports.sampleRate.value, 44100)
})

t('compile: globals multiple', () => {
  // FIXME: must throw
  // let wat = compileLino(`pi, pi2, sampleRate = 3.14, 3.14*2, 44100.`)
  let wat = compileLino(`(pi, pi2, sampleRate) = (3.14, 3.14*2, 44100).`)
  let mod = compileWat(wat)
  is(mod.instance.exports.pi.value, 3.14)
  is(mod.instance.exports.pi2.value, 3.14 * 2)
  is(mod.instance.exports.sampleRate.value, 44100)

  wat = compileLino(`(a,b) = (-1, -1.0).`)
  mod = compileWat(wat)
  is(mod.instance.exports.a.value, -1)
  is(mod.instance.exports.b.value, -1)

  wat = compileLino(`(a,b) = (-1, -1.0).`)
  mod = compileWat(wat)
  is(mod.instance.exports.a.value, -1)
  is(mod.instance.exports.b.value, -1)
})

t.skip('compile: export - no junk exports', () => {
  let wat = compileLino(`w()=(); y=[1]; x()=(*i=0), z=[y[0], v=[1]].`)
  let mod = compileWat(wat)
  same(Object.keys(mod.instance.exports), ['__memory', 'x', 'z'])
})

t('compile: numbers negatives', t => {
  let wat = compileLino(`x=-1.`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)

  wat = compileLino(`x=-1.0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)
})

t('compile: numbers inc/dec', t => {
  let wat = compileLino(`x=0; y=x++; x,y.`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, 1)
  is(mod.instance.exports.y.value, 0)

  wat = compileLino(`x=0; y=++x; x,y.`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, 1)
  is(mod.instance.exports.y.value, 1)

  wat = compileLino(`x=0; y=x--; x,y.`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, -1)
})

t('compile: operators - pow', t => {
  // static
  let wat = compileLino(`x=2**(1/2),y=x**3,z=x**-2.`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, Math.sqrt(2))
  is(mod.instance.exports.y.value, mod.instance.exports.x.value ** 3)
  almost(mod.instance.exports.z.value, mod.instance.exports.x.value ** -2)

  // complex
  wat = compileLino(`pow(x,y)=(x**y).`)
  mod = compileWat(wat)
  is(mod.instance.exports.pow(1, 0), 1, '1**0')
  is(mod.instance.exports.pow(-1, 0), 1, `-1**0`)
  is(mod.instance.exports.pow(1, 1), 1, `1**1`)
  is(mod.instance.exports.pow(1, 108), 1, `1**108`)

  is(mod.instance.exports.pow(-1, 1), -1, `-1**1`)
  is(mod.instance.exports.pow(-1, 2), 1, `-1**2`)
  is(mod.instance.exports.pow(-1, 3), -1, `-1**3`)

  is(mod.instance.exports.pow(0, 10), 0, `0**10`)
  is(mod.instance.exports.pow(0, -10), Infinity, `0**-10`)

  is(mod.instance.exports.pow(Infinity, 10), Infinity, `+inf**10`)
  is(mod.instance.exports.pow(Infinity, -10), 0, `inf**-10`)

  is(mod.instance.exports.pow(-1.2, 3.4), NaN, `-1.2 ** 3.4`)
  is(mod.instance.exports.pow(-1.2, -3.4), NaN, `-1.2 ** -3.4`)

  is(mod.instance.exports.pow(2, Infinity), Infinity, `2**inf`)
  is(mod.instance.exports.pow(2, -Infinity), 0, `2**-inf`)

  is(mod.instance.exports.pow(1.2, 3.4), 1.2 ** 3.4, `1.2**3.4`)
  is(mod.instance.exports.pow(1.2, -3.4), 1.2 ** -3.4, `1.2**-3.4`)
  is(mod.instance.exports.pow(1.23456789, 9.87654321), 1.23456789 ** 9.87654321, `1.23456789 ** 9.87654321`)
})

t('compile: units', t => {
  let wat = compileLino(`
    pi = 3.1415;
    1k = 1000; 1pi = pi;
    1s = 44100; 1m=60s; 1h=60m; 1ms = 0.001s;
    a=10.1k, b=2pi, c=1h2m3.5s.
  `)

  let mod = compileWat(wat)
  is(mod.instance.exports.a.value, 10100)
  is(mod.instance.exports.b.value, 3.1415 * 2)
  is(mod.instance.exports.c.value, 60 * 60 * 44100 + 2 * 60 * 44100 + 3.5 * 44100)
})

t.todo('compile: units - errors', t => {
  // bad expressions
  //
  compileLino(`1h=1s;1s=44800;`)
  compileLino(`1k=x();`)
})

t('compile: conditions', t => {
  let wat, mod
  wat = compileLino(`a=1;b=2;c=a?1:2.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1)

  wat = compileLino(`a=1;b=2;a?c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2)

  wat = compileLino(`a=0;b=2;a?c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 0)

  wat = compileLino(`a=0.0;b=2.1;a?c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 0)

  wat = compileLino(`a=0.1;b=2.1;a?c=b;c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2.1)

  throws(() => {
    wat = compileLino(`a=0.0;b=2.1;c=a?b.`)
  }, /void/)

  throws(() => {
    wat = compileLino(`a=0.1;b=2.1;c=a?b.`)
  }, /void/)
  wat = compileLino(`x(px) = (px < 0 ? px = 0; px).`)
  mod = compileWat(wat)
  is(mod.instance.exports.x(-10), 0)
  is(mod.instance.exports.x(10), 10)
})

t('compile: conditions - or/and', t => {
  let wat, mod
  wat = compileLino(`z=1||0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1)
  wat = compileLino(`z=1.2||0.0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1.2)
  wat = compileLino(`z=1.2||0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1.2)
  wat = compileLino(`z=1||0.0.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 1)
  wat = compileLino(`z=1.2&&0.2.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 0.2)
  wat = compileLino(`z=1&&2.`)
  mod = compileWat(wat)
  is(mod.instance.exports.z.value, 2)
})

t('compile: function oneliners', t => {
  let wat, mod
  // no semi
  wat = compileLino(`mult(a, b=2) = a * b.`)
  mod = compileWat(wat)
  is(mod.instance.exports.mult(2, 4), 8)
  is(mod.instance.exports.mult(2), 4)

  // no result
  mod = compileWat(compileLino(` mult(a, b) = (a * b). `))
  is(mod.instance.exports.mult(2, 4), 8)

  // console.log(compileLino(` mult = (a, b) -> (b; a * b).`))
  mod = compileWat(compileLino(` mult(a, b) = (b; a * b).`))
  is(mod.instance.exports.mult(2, 4), 8)

  mod = compileWat(compileLino(` mult(a, b) = (b; a * b;). `))
  is(mod.instance.exports.mult(2, 4), 8)
})

t('compile: function shadows global args', t => {
  let mod = compileWat(compileLino(`a=1, mult(a) = (a=2).`))
  is(mod.instance.exports.a.value, 1)
  is(mod.instance.exports.mult(), 2)
  is(mod.instance.exports.a.value, 1)
})

t.skip('debugs', t => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const importObject = { x: { y: () => 123, z: 123 } };
  let { instance } = compileWat(`
    (memory (export "__memory") 1 2048)

    ;;;;;;;;;;;;;;;;;;;;;;;;;;;; Data
    (data (i32.const 0) "//")`, importObject)
  console.log(new Uint8Array(instance.exports.__memory.buffer))
  // instance.exports.x(instance.exports.x(instance.exports.cb))
})

t('compile: vars misc', t => {
  let wat, x;
  x = compileWat(compileLino(`x;x.`)).instance.exports.x // unknown type falls to f64
  x = compileWat(compileLino(`x=1;x.`)).instance.exports.x // int type
  x = compileWat(compileLino(`x=1.0;x.`)).instance.exports.x // float type
  x = compileWat(compileLino(`x()=1;x.`)).instance.exports.x // func type
  // x = compileWat(compileLino(`x=0..10;x.`)).instance.exports.x // range type
  x = compileWat(compileLino(`x=[];x.`)).instance.exports.x // arr type
  x = compileWat(compileLino(`x;x=1;x.`)).instance.exports.x // late-int type
  x = compileWat(compileLino(`x;x=1.0;x.`)).instance.exports.x // late-float type
  // x = compileWat(compileLino(`x;x()=1;x.`)).instance.exports.x // late-func type
  // x = compileWat(compileLino(`x;x=0..10;x.`)).instance.exports.x // late-range type
  x = compileWat(compileLino(`x;x=[];x.`)).instance.exports.x // late-arr type
})

t('compile: ranges basic', t => {
  let wat = compileLino(`x = 11 <? 0..10.`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, 10)

  wat = compileLino(`x = 0 <? 1..10.`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, 1)

  wat = compileLino(`clamp(x) = (x <? 0..10).`)
  mod = compileWat(wat)
  is(mod.instance.exports.clamp(11), 10)
  is(mod.instance.exports.clamp(-1), 0)
})

t('compile: group assign cases', t => {
  let wat, mod
  wat = compileLino(`a=1;b=2;c=(a,b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 2, 'c=(a,b)')

  wat = compileLino(`a=1;b=2,c=3;(b,a)=(c,b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.b.value, 3, '(b,a)=(c,b)')
  is(mod.instance.exports.a.value, 2)

  wat = compileLino(`a=1;b=2;(c,b)=(a,b);a,b,c.`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1, '(c,b)=(a,b)')
  is(mod.instance.exports.b.value, 2)
  is(mod.instance.exports.a.value, 1)

  throws(() => {
    wat = compileLino(`a=1;b=2;(c,a,b)=(a,b).`)
    mod = compileWat(wat)
    is(mod.instance.exports.c.value, 1, '(c,a,b)=(a,b)')
    is(mod.instance.exports.a.value, 2)
    is(mod.instance.exports.b.value, 2)
  }, /Mismatch/)

  wat = compileLino(`a=1;b=2;(c,d)=(a,b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.c.value, 1, '(c,d)=(a,b)')
  is(mod.instance.exports.d.value, 2)

  wat = compileLino(`a=1;b=2;a,(b,b)=a.`)
  mod = compileWat(wat)
  is(mod.instance.exports.b.value, 1, '(b,b)=a')
  is(mod.instance.exports.a.value, 1)

  wat = compileLino(`a=1;b=2,c;a,(b,c)=a.`)
  mod = compileWat(wat)
  is(mod.instance.exports.b.value, 1, '(b,c)=a')
  is(mod.instance.exports.c.value, 1)

  wat = compileLino(`a=1;b=2,c=3;(a,,c)=(b,b,b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.a.value, 2, '(a,,c)=(b,b,b)')
  is(mod.instance.exports.b.value, 2, '(a,,c)=(b,b,b)')
  is(mod.instance.exports.c.value, 2)
})

t('compile: group ops cases', t => {
  let wat, mod

  wat = compileLino(`f(a) = ((x, y) = (a+2,a-2); x,y).`)
  mod = compileWat(wat);
  is(mod.instance.exports.f(4), [6, 2], `(a,b)=(c+1,c-1)`);

  wat = compileLino(`f(a,b,h) = (a, b) * h.`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 3), [6, 9], `(a, b) * h`);

  wat = compileLino(`f(a,b,h) = h * (a, b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 3), [6, 9], `h * (a, b)`);

  wat = compileLino(`f(a,b,c,d) = (a, b) * (c, d).`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 4, 5), [8, 15], `(a,b)*(c,d)`);

  wat = compileLino(`f(a,b) = 2 * (a, b) * 3.`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3), [12, 18], `2 * (a, b) * 3`);

  wat = compileLino(`f(a,b,c,d) = (2 * (a, b)) * (c, d).`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 4, 5), [16, 30], `(2 * (a, b)) * (c, d)`);

  wat = compileLino(`f(a,b,c,d) = ((2 * (a, b) * 3) * (c,d)).`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 3, 2), [36, 36], `(2 * (a, b) * 3) * (c, d)`);

  wat = compileLino(`f(a,b,h) = ((a>=h, b>=h) ? (a--, b--); a,b).`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 3), [2, 2], `(a>=h, b>=h) ? (a--, b--)`);

  wat = compileLino(`f(a,b,h) = ((a,b) * (h + 1)).`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(2, 3, 1), [4, 6], `((a,b) * (h + 1))`);

  wat = compileLino(`f(a,b,h) = ((a,b) >= h ? (a,b) = h-1; (a,b)).`)
  mod = compileWat(wat)
  is(mod.instance.exports.f(1, 3, 3), [1, 2], `(a,b) >= h ? (a,b) = h-1`);

  wat = compileLino(`x=[1,2,3]; (a, b, c) = x[0,1,2].`)
  mod = compileWat(wat)
  is([mod.instance.exports.a.value, mod.instance.exports.b.value, mod.instance.exports.c.value], [1, 2, 3], `(a,b,c)=x[0,1,2]`);
})

t.todo('compile: strings', t => {
  let wat = compileLino(`x = "abc".`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { __memory: memory, x } = mod.instance.exports

  let xarr = new Uint8Array(memory.buffer, x.value, 3)

  is(xarr[0], 21, 'a')
  is(xarr[1], 22, 'b')
})

t('compile: list basic', t => {
  let wat = compileLino(`x = [1.1, 2.22, 3.333], y = [4.1234,5.54321,654321.123456,7.7777777]; x,y,xl=x[],yl=y[].`)
  let mod = compileWat(wat)
  let { __memory: memory, x, y, xl, yl } = mod.instance.exports
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

t('compile: list basic local', t => {
  let wat = compileLino(`x() = [1, 2].`)
  let mod = compileWat(wat)
  let { __memory: memory, x } = mod.instance.exports
  let x0 = new Float64Array(memory.buffer, x(), 2)
  is(x0[0], 1, 'x0')
  is(x0[1], 2, 'x1')
  not(x(), x(), 'each instance is new')
  // console.log(new Float64Array(memory.buffer))
})

t('compile: list from static range', t => {
  let wat = compileLino(`x=[..3], y=[0..4]; z=[4..0], x,y,xl=x[],yl=y[].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { __memory: memory, x, y, xl, yl, z } = mod.instance.exports
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

t('compile: list from dynamic range', t => {
  let wat = compileLino(`a=3, x=[0..a], xl=x[].`)
  // , y=[1, x[0]..x[2], 2..-2]; x,y, xl=x[],yl=y[].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { __memory: memory, x, y, xl, yl } = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 3)
  is(xarr[0], 0, 'x0')
  is(xarr[1], 1, 'x1')
  is(xarr[2], 2, 'x2')
  is(xl.value, 3, 'xlen')
})

t.todo('compile: lists from invalid ranges', t => {
  let wat = compileLino(`x=[2..]`)
  wat = compileLino(`x=[..]`)
  wat = compileLino(`x=[..-2]`)
  wat = compileLino(`x=[..-2]`)
})

t('compile: lists nested static', t => {
  let wat = compileLino(`x=[1, y=[2, [3,3.14]]], w=[4,5].`)
  // let wat = compileLino(`y=[2], x=[1, y], w=[4,5].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { __memory: memory, x, y, w } = mod.instance.exports
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

t.todo('compile: list comprehension', t => {
  let wat = compileLino(`x = [1..3 <| ^ * 2]`)
})

t.todo('compile: list nested comprehension', t => {
  let wat = compileLino(`x = [1..3 <| [0..^ <| ^ * 2]]`)
})

t('compile: list simple write', t => {
  let wat = compileLino(`x=[..3]; x[0]=1; x[1]=2; x[-1]=x[]; x.`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { __memory: memory, x } = mod.instance.exports
  let xarr = new Float64Array(memory.buffer, x.value, 3)
  is(xarr[0], 1, 'x0')
  is(xarr[1], 2, 'x1')
  is(xarr[2], 3, 'x2')
})

t('compile: list simple read', t => {
  let wat = compileLino(`x = [1, 2, 3]; a=x[0],b=x[1],c=x[2],d=x[-1].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { a, b, c, d } = mod.instance.exports
  is(a.value, 1)
  is(b.value, 2)
  is(c.value, 3)
  is(d.value, 3)
})

t('compile: list group read', t => {
  let wat = compileLino(`x = [1, 2, 3]; (a,b,c)=x[0,1,2].`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { a, b, c } = mod.instance.exports
  is(a.value, 1)
  is(b.value, 2)
  is(c.value, 3)
})

t('compile: list group write', t => {
  let wat = compileLino(`x = [..3]; x[0,1,2]=(1,2,3).`)
  // console.log(wat)
  let mod = compileWat(wat)
  let { x, __memory } = mod.instance.exports
  const mem = new Float64Array(__memory.buffer, x.value, 3)
  is(mem[0], 1)
  is(mem[1], 2)
  is(mem[2], 3)
})


t.todo('compile: sublist', t => {
  let wat = compileLino(`x = [1,2,3], y = [x].`)
  let mod = compileWat(wat)
  let { __memory: memory, x } = mod.instance.exports
  let arr = new Float64Array(memory.buffer, 0, 2), ptr = x.value
  is(arr[ptr], 1)
  is(arr[ptr + 1], 2)
})

t.skip('compile: memory grow', t => {
  // FIXME: possibly add option to export internals
  let wat = compileLino(`grow()=[..8192].`)
  let mod = compileWat(wat)
  let { __memory, __mem, grow } = mod.instance.exports
  for (let i = 1; i < 100; i++) {
    is(__mem.value, 65536 * i)
    grow()
  }
})

t('compile: early returns', t => {
  let wat = compileLino(`x(a)=(a ? ./-a; 123), y(a)=(a?./12;13.4), z(a)=(a?./11:./12.1;./13).`)
  let mod = compileWat(wat)
  let { __memory: memory, x, y, z } = mod.instance.exports
  is(x(0), 123);
  is(x(1), -1);

  is(y(0), 13.4);
  is(y(1), 12);

  is(z(0), 12.1);
  is(z(1), 11);

  throws(() => {
    compileLino(`y(a,b)=(a ? ./b; a,b).`)
  }, 'Inconsistent')
})

t.todo('compile: break multiple scopes', t => {
})

t.todo('compile: break/continue', t => {

})

t('compile: loops range global', t => {
  let wat, mod
  wat = compileLino(`x=[1..3]; 0..2 |> x[^]=^+1; x.`)
  mod = compileWat(wat)
  let { __memory: memory, x } = mod.instance.exports

  let arr = new Float64Array(memory.buffer, x.value, 3)

  is(arr[0], 1)
  is(arr[1], 2)
  is(arr[2], 3)
})

t('compile: loops range local', t => {
  let wat, mod
  wat = compileLino(`x=[1..3]; fill() = (0..x[] |> x[^]=^+1); fill, x.`)
  mod = compileWat(wat)
  let { __memory: memory, x, fill } = mod.instance.exports

  let arr = new Float64Array(memory.buffer, x.value, 3)
  is(fill(), 3);

  is(arr[0], 1)
  is(arr[1], 2)
  is(arr[2], 3)
})

t('compile: loop range in range', t => {
  let wat = compileLino(`a=[..9], f(a,w,h)=(
    0..w |> (x=^;
      0..h |> (y=^;
        a[y*w + x] = x+y*w
      )
    )
  ).`)
  let mod = compileWat(wat)
  let { __memory: memory, a, f } = mod.instance.exports

  let arr = new Float64Array(memory.buffer, a.value, 9)
  is(arr, [0, 0, 0, 0, 0, 0, 0, 0, 0])
  f(a, 3, 3)
  is(arr, [0, 1, 2, 3, 4, 5, 6, 7, 8])
})

t.todo('compile: loop in loop', t => {
  let wat = compileLino(`
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
  let { __memory: memory, x } = mod.instance.exports

  let arr = new Float64Array(memory.buffer, x.value, 4)

  is(arr[0], 0)
  is(arr[1], 1)
  is(arr[2], 2)
  is(arr[3], 3)
})

t.todo('compile: loop over list', t => {
  let wat = compileLino(`x = [1,2,3]; y = x <| x -> x * 2.`)
  let mod = compileWat(wat)
  let { memory, y } = mod.instance.exports
  let arr = new Float64Array(memory.buffer, 0, 3), ptr = y.value
  is(arr[ptr], 2)
  is(arr[ptr + 1], 4)
  not(arr[ptr + 2], 6)
})

t('compile: state variable - basic', t => {
  let wat = compileLino(`x()=(*i=0;i++).`)
  let mod = compileWat(wat)
  let { x } = mod.instance.exports
  is(x(), 0)
  is(x(), 1)
  is(x(), 2)
})

t('compile: state variable - scope', t => {
  let wat = compileLino(`x()=(*i=0;i++), y()=x().`)
  let mod = compileWat(wat)
  let { x, y } = mod.instance.exports
  is(x(), 0)
  is(y(), 0)
  is(x(), 1)
  is(x(), 2)
  is(y(), 1)
  is(y(), 2)
})

t('compile: state variable - array init', t => {
  let wat = compileLino(`x()=(*i=[..2]; i[0]++ + i[1]++), y()=x().`)
  let mod = compileWat(wat)
  let { x, y, __memory } = mod.instance.exports
  is(x(), 0)
  console.log(new Float64Array(__memory.buffer))
  is(x(), 2)
  console.log(new Float64Array(__memory.buffer))
  is(x(), 4)
  console.log(new Float64Array(__memory.buffer))
  is(y(), 0)
  console.log(new Float64Array(__memory.buffer))
  is(y(), 2)
  is(y(), 4)
})

t.todo('compile: state variable - group init', t => {
  let wat = compileLino(`x()=(*(i=0,j=1,k=2);i+j+k), y()=x().`)
  let mod = compileWat(wat)
  let { x, y } = mod.instance.exports
})

t.todo('compile: state variable - multiple states', t => {
  let wat = compileLino(`x()=(*i=0,*j=1,*a=[..2]; i++ + j++ + a[0]++ + a[1]++); y()=(x()+x());`)
  let mod = compileWat(wat)
  let { x, y } = mod.instance.exports
  is(x(), 1)
  is(x(), 5)
  is(x(), 9)
  is(x(), 13)
  is(y(), 6)
  is(y(), 21)
})

t.todo('compile: state variable - mixed deps', t => {
  let wat = compileLino(`x()=(*i=0,i++); y()=(*a=[0,1];x()+a[0]+a[1]++); z()=(x()+y());`)
  let mod = compileWat(wat)
  let { x, y, z } = mod.instance.exports
})

t.todo('compile: import simple', t => {
  // FIXME: need to use external imports, not internal
  const imports = { math: { sin: Math.sin, pi: Math.PI } };
  let wat = compileLino(`<math#pi,sin>; pi, sinpi(n=1)=sin(pi*n).`, { imports })
  let mod = compileWat(wat, imports)
  let { pi, sinpi } = mod.instance.exports
  is(pi.value, Math.PI)
  is(sinpi(1 / 2), Math.sin(Math.PI / 2))
  is(sinpi(2), Math.sin(Math.PI * 2))
})

t.todo('compile: import non-existent', t => {
})

t.todo('compile: audio-gain', t => {
  let wat = compileLino(`
  blockSize = 1024;
  gain = ([blockSize]data, volume <? 0..1000) -> [data | x -> x * volume];
  `)
  let mod = compileWat(wat)
  let { gain } = mod.instance.exports
  is(gain([1, 2, 3], 2), [2, 4, 6])

  // let wat = compileLino(`
  //   blockSize = 1024;
  //   gain = ([2, blockSize]data, volume <? 0..1000) -> [data | ch -> (ch | x -> x * volume)];
  // `)
})

t.todo('compile: sine gen', t => {
  let wat = compileLino(analyse(parse(`
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

t('compile: readme numbers', t => {
  let numbers = compileLino(`
    a=16, b=0x10, c=0b0;                 // int, hex or binary
    d=16.0, e=.1, f=1e3, g=2e-3;           // float
    a,b,c,d,e,f,g.
  `, { imports: {} })
  let { a, b, c, d, e, f, g } = compileWat(numbers, {}).instance.exports
  is(a.value, 16), is(b.value, 0x10), is(c.value, 0b0), is(d.value, 16), is(e.value, 0.1), is(f.value, 1e3), is(g.value, 2e-3)
})

t('compile: readme standard operators', t => {
  let ops = compileLino(`
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
    ).
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
