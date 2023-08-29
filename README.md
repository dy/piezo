# 🎧 aux

Microlanguage with ergonimic syntax, linear memory and compiling to 0-runtime WASM.<br>
Made for the purpose of audio/signal processing.
<!-- It also has smooth operator and organic sugar. -->

<!--[Motivation](./docs/motivation.md)  |  [Documentation](./docs/reference.md)  |  [Examples](./docs/examples.md).-->


## Reference

```
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ numbers
16, 0x10, 0b0;                  \ int, hex or binary
16.0, .1, 1e3, 2e-3;            \ float

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ standard operators
+ - * / % -- ++                 \ arithmetical (float)
&& || ! ?: ?                    \ logical (boolean)
> >= < <= == !=                 \ comparisons (boolean)
& | ^ ~ >> <<                   \ binary (integer)
[]                              \ member access, length

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ extended operators
** // %%                        \ power, floor div, unsigned mod
<? <?= ..                       \ clamp/min/max, range
|> <| <|=                       \ loop, map
*                               \ state variable
^ ^^                            \ continue, break

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ variables
foo=1, bar=2.0;                 \ declare vars
Ab_C_F#, $0, Δx, _, @1;         \ names permit alnum, unicodes, #_$@
fooBar123 == FooBar123;         \ names are case-insensitive
default=1, eval=fn, else=0;     \ no reserved words
true = 0b1, false = 0b0;        \ alias bools
inf = 1/0, nan = 0/0;           \ alias infinity, NaN

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ units
1k = 1000; 1pi = 3.1415926;     \ define units
1s = 44100; 1m = 60s;           \ useful for sample indexes
10.1k, 2pi;                     \ units deconstruct to numbers: 10100, 6.283
2m35s;                          \ allow combinations

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ statements
foo();                          \ semi-colons at end of line are mandatory
(c = a + b; c);                 \ parens return last statement
(a = b+1; a,b,c);               \ can return multiple values
(a ? ^b; c);                    \ or return early (break scope)
(a ? (b ? ^^c) : d);            \ break 2 scopes

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ conditions
sign = a < 0 ? -1 : +1;         \ ternary
(2+2 >= 4) ? log(1) :           \ multiline/switch
  3 <= 1..2 ? log(2) :          \ else if
  log(3);                       \ else
a || b ? c;                     \ if a or b then c
(a, b) ? (c, d);                \ group condition: (a ? c, b ? d)

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ ranges
0..10;                          \ from 1 to 9 (10 exclusive)
0.., ..10, ..;                  \ open ranges
10..1;                          \ reverse range
1.08..108.0;                    \ float range
(x-1)..(x+1);                   \ calculated ranges
x <= 0..10;                     \ is x in 0..10 range (10 inclusive)
x <? ..10, x <? 0..;            \ min(x, 10), max(x, 0)
x <? 0..10;                     \ clamp(x, 0, 10)
x <?= 0..10;                    \ x = clamp(x, 0, 10)
a,b,c = 0..2;                   \ a==0, b==1, c==2
(-10..10)[];                    \ span is 20

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ groups
a, b=1, c=2;                    \ define multiple values
(a, b, c)++;                    \ increment multiple: (a++, b++, c++)
(a,b,c) = (d,e,f);              \ assign multiple: a=d, b=e, c=f
(a,b) = (b,a);                  \ swap
(a,b) + (c,d);                  \ operator for multiple members: (a+c, b+d)
(a,b)[1] = c[2,3];              \ multiple props: (a[1]=c[2], b[1]=c[3])
(a,b,c) = d;                    \ duplicate: (a, b, c) = (d, d, d);
(a,,b) = (c,d,e);               \ skip: (a=c, d, b=e);

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ functions
double(n) = n*2;                \ define function
times(m = 1, n < 1..) = (       \ optional, clamped args
  n == 0 ? ^n;                  \ early return
  m*n                           \ default return
);                              \
times(3,2);                     \ 6
times(5);                       \ 5. optional argument
times(,10);                     \ 10. skipped argument
copy = triple;                  \ capture function
copy(10);                       \ also 30
dup(x) = (x,x);                 \ return multiple values
(a,b) = dup(b);                 \ get returns

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ state variables
a() = ( *i=0; ++i );            \ i persists value between calls
a(), a();                       \ 1, 2
fib() = (                       \
  *i=[1,0,0];                   \ local memory of 3 items
  i[1..] = i[0..];              \ shift memory
  i[0] = i[1] + i[2];           \ sum prev 2 items
);                              \
fib(), fib(), fib();            \ 1, 2, 3
c() = (fib(), fib(), fib());    \ state is defined by function scope
fib(); c();                     \ 5; 1, 2, 3;
d(_b) = (fib(), _b());          \ to get external state, pass fn as argument
d(b);                           \ 1, 8;

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ arrays
m = [..10];                     \ array of 10 elements
m = [..10 <| 2];                \ filled with value
m = [1,2,3,4];                  \ array of 4
m = [n[..]];                    \ copy n
m = [1, 2..4, 5];               \ mixed definition
m = [1, [2, 3, [4]]];           \ nested arrays (tree)
m = [0..4 <| @ * 2];            \ comprehension
(first, last) = (m[0], m[-1]);  \ get by index
(second, ..last) = m[1, 2..];   \ get multiple values
length = m[];                   \ get length
m[0] = 1;                       \ set value
m[2..] = (1, 2..4, n[1..3]);    \ set multiple values from offset 2
m[0..] = 0..4 <| @ * 2          \ set via iteration
m[1,2] = m[2,1];                \ rearrange
m[0..] = m[-1..0];              \ reverse order
m[0..] = m[1..,0];              \ rotate

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ loops
a, b, c |> x(@);                \ for each a, b, c do x(item)
10.. |> (                       \ iterate over range
  @ < 3 ? ^^;                   \ ^^ break
  @ < 5 ? ^;                    \ ^ continue
);                              \
i < 10 |> x(i++);               \ while i < 10 do x(i++)
items |> a(@);                  \ iterate over array
items |> a(@) |> b(@);          \ pipe iterations
0..w |> (                       \ nest iterations
  x=@; 0..h |> (y=@; a(x,y))    \
);                              \
x = a, b, c |> @;               \ returns last member: x == c
a, b, c <| @ * 2;               \ returns multiple members
x[3..5] <|= @ * 2;              \ map items from range

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ import, export
<math#pi,sin>;                  \ import (into global scope)
x, y, z.                        \ export (from global scope)
```

<!--
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ strings
hi="Hello, World!\n\t\x22\x27"; \ creates static array (uint8)
string="{hi} world";            \ interpolate: "hello world"
string[1];                      \ positive indexing from first element [0]: 'e'
string[-3];                     \ negative indexing from last element [-1]: 'r'
string[2..10];                  \ substring
string[1, 2..10, -1];           \ slice/pick multiple elements
string[-1..0];                  \ reverse
string[];                       \ length
string == string;               \ compare (==,!=,>,<)
string + string;                \ concat: "hello worldhello world"
string - string;                \ removes all occurences of the right string in the left string: ""
string / string;                \ split: "a b" / " " = ["a", "b"]
string * list;                  \ join: " " * ["a", "b"] = "a b"
string * 2;                     \ repeat: "abc" * 2 = "abcabc"
-->

## Examples

### Gain Processor

Provides k-rate amplification for block of samples.

```
gain(                               \ define a function with block, volume arguments.
  block,                            \ block is a list argument
  volume <= 0..100                  \ volume is limited to 0..100 range
) = (
  block <|= @ * volume;             \ map each sample by multiplying by value
);

gain([0..5 <| @ * 0.1], 2);         \ 0, .2, .4, .6, .8, 1

gain.                               \ export gain function
```

<!--Minifies as `gain(b,v)=b|=x->x*v.`-->

### Biquad Filter

A-rate (per-sample) biquad filter processor.

```
<math#pi,cos,sin>;                  \ import pi, sin, cos from math

1pi = pi;                           \ define pi units
1s = 44100;                         \ define time units in samples
1k = 10000;                         \ basic si units

lpf(                                \ per-sample processing function
  x0,                               \ input sample value
  freq <= 1..10k = 100,             \ filter frequency, float
  Q <= 0.001..3.0 = 1.0             \ quality factor, float
) = (
  *(x1, y1, x2, y2) = 0;            \ define filter state

  \ lpf formula
  w = 2pi * freq / 1s;
  (sin_w, cos_w) = (sin(w), cos(w));
  a = sin_w / (2.0 * Q);

  (b0, b1, b2) = ((1.0 - cos_w) / 2.0, 1.0 - cos_w, b0);
  (a0, a1, a2) = (1.0 + a, -2.0 * cos_w, 1.0 - a);

  (b0, b1, b2, a1, a2) *= 1.0 / a0;

  y0 = b0*x0 + b1*x1 + b2*x2 - a1*y1 - a2*y2;

  (x1, x2) = (x0, x1);              \ shift state
  (y1, y2) = (y0, y1);

  y0                                \ return y0
);

\ (0, .1, .3) <| lpf(@, 108, 5);

lpf.                                \ export lpf function, end program
```

### ZZFX

Generates ZZFX's [coin sound](https://codepen.io/KilledByAPixel/full/BaowKzv) `zzfx(...[,,1675,,.06,.24,1,1.82,,,837,.06])`.

```
<math#pi,abs,sin,round>;

1pi = pi;
1s = 44100;
1ms = 1s / 1000;

\ define waveform generators
oscillator = [
  saw(phase) = (1 - 4 * abs( round(phase/2pi) - phase/2pi )),
  sine(phase) = sin(phase)
];

\ applies adsr curve to sequence of samples
adsr(
  x,
  a <= 1ms..,                     \ prevent click
  d,
  (s, sv=1),                      \ optional group-argument
  r
) = (
  *i = 0;                         \ internal counter, increments after fn body
  t = i / 1s;

  total = a + d + s + r;

  y = t >= total ? 0 : (
    t < a ? t/a :                 \ attack
    t < a + d ?                   \ decay
    1-((t-a)/d)*(1-sv) :          \ decay falloff
    t < a  + d + s ?              \ sustain
    sv :                          \ sustain volume
    (total - t)/r * sv
  ) * x;
  i++;
  y
);

\ curve effect
curve(x, amt<=0..10=1.82) = (sign(x) * abs(x)) ** amt;

\ coin = triangle with pitch jump, produces block
coin(freq=1675, jump=freq/2, delay=0.06, shape=0) = (
  out[1023];                      \ output block of 1024 samples
  *i=0;
  *phase = 0;                     \ current phase
  t = i / 1s;

  out <|= oscillator[shape](phase)
      <| adsr(@, 0, 0, .06, .24)
      <| curve(@, 1.82)

  i++
  phase += (freq + (t > delay ? jump : 0)) * 2pi / 1s;
).
```

<!--
## [Freeverb](https://github.com/opendsp/freeverb/blob/master/index.js)

```
<./combfilter.li#comb>;
<./allpass.li#allpass>;

1s = 44100;

(a1,a2,a3,a4) = (1116,1188,1277,1356);
(b1,b2,b3,b4) = (1422,1491,1557,1617);
(p1,p2,p3,p4) = (225,556,441,341);

\ TODO: stretch

reverb(input, room=0.5, damp=0.5) = (
  *combs_a = a0,a1,a2,a3 | a -> stretch(a),
  *combs_b = b0,b1,b2,b3 | b -> stretch(b),
  *aps = p0,p1,p2,p3 | p -> stretch(p);

  combs = (
    (combs_a | x -> comb(x, input, room, damp) |> (a,b) -> a+b) +
    (combs_b | x -> comb(x, input, room, damp) |> (a,b) -> a+b)
  );

  (combs, aps) | (input, coef) -> p + allpass(p, coef, room, damp)
);
```

Features:

* _multiarg pipes_ − pipe can consume groups. Depending on arity of target it can act as convolver: `a,b,c | (a,b) -> a+b` becomes  `(a,b | (a,b)->a+b), (b,c | (a,b)->a+b)`.
* _fold operator_ − `a,b,c |> fn` acts as `reduce(a,b,c, fn)`, provides efficient way to reduce a group or array to a single value.

### [Floatbeat](https://dollchan.net/bytebeat/index.html#v3b64fVNRS+QwEP4rQ0FMtnVNS9fz9E64F8E38blwZGvWDbaptCP2kP3vziTpumVPH0qZyXzfzHxf8p7U3aNJrhK0rYHfgHAOZZkrlVVu0+saKbd5dTXazolRwnvlKuwNvvYORjiB/LpyO6pt7XhYqTNYZ1DP64WGBYgczuhAQgpiTXEtIwP29pteBZXqwTrB30jwc7i/i0jX2cF8g2WIGKlhriTRcPjSvcVMBn5NxvgCOc3TmqZ7/IdmmEnAMkX2UPB3oMHdE9WcKqVK+i5Prz+PKa98uOl60RgE6zP0+wUr+qVpZNsDUjKhtyLkKvS+LID0FYVSrJql8KdSMptKKlx9eTIbcllvdf8HxabpaJrIXEiycV7WGPeEW9Y4v5CBS07WBbUitvRqVbg7UDtQRRG3dqtZv3C7bsBbFUVcALvwH86MfSDws62fD7CTb0eIghE/mDAPyw9O9+aoa9h63zxXl2SW/GKOFNRyxbyF3N+FA8bPyzFb5misC9+J/XCC14nVKfgRQ7RY5ivKeKmmjOJMaBJSbEZJoiZZMuj2pTEPGunZhqeatOEN3zadxrXRmOw+AA==)

Transpiled floatbeat/bytebeat song:

```
<math#asin,sin,pi>;

1s = 44100;

fract(x) = x % 1;
mix(a, b, c) = (a * (1 - c)) + (b * c);
tri(x) = 2 * asin(sin(x)) / pi;
noise(x) = sin((x + 10) * sin((x + 10) ** (fract(x) + 10)));
melodytest(time) = (
  melodyString = "00040008",
  melody = 0;

  0..5 <| (
    melody += tri(
      time * mix(
        200 + (# * 900),
        500 + (# * 900),
        melodyString[floor(time * 2) % melodyString[]] / 16
      )
    ) * (1 - fract(time * 4))
  );

  melody
)
hihat(time) = noise(time) * (1 - fract(time * 4)) ** 10;
kick(time) = sin((1 - fract(time * 2)) ** 17 * 100);
snare(time) = noise(floor((time) * 108000)) * (1 - fract(time + 0.5)) ** 12;
melody(time) = melodytest(time) * fract(time * 2) ** 6 * 1;

song() = (
  *t=0; @t++; time = t / 1s;
  (kick(time) + snare(time)*.15 + hihat(time)*.05 + melody(time)) / 4
)
```

Features:

* _loop operator_ − `cond <| expr` acts as _while_ loop, calling expression until condition holds true. Produces sequence as result.
* _string literal_ − `"abc"` acts as array with ASCII codes.
* _length operator_ − `items[]` returns total number of items of either an array, group, string or range.
-->

### Other examples

* [Freeverb](/examples/freeverb.aux)
* [Floatbeat](/examples/floatbeat.aux)
* [Complete ZZFX](/examples/zzfx.aux)

See [all examples](/examples)


## Usage

_auro_ is available as CLI or JS package.

`npm i aux`

### CLI

```sh
aux source.aux -o dest.wasm
```

This produces compiled WASM binary.

### JS

```js
import * as aux from 'aux'

// create wasm arrayBuffer
const wast = aux.compile(`
  n=1;
  mult(x) = x*n;
  arr=[1,2,3];
  mult, n, arr.
`, { ...config })
const buffer = /* Compile wasm text to buffer somehow, eg. wabt or wat-compier */;

// create wasm instance
const module = new WebAssembly.Module(buffer)
const instance = new WebAssembly.Instance(module)

// use API
const {mult, n, arr, __memory} = instance.exports

// number exported as global
n.value = 2;

// function exported directly
mult(108) // 216

// array is a number pointer to memory
const arrValues = new Float64Array(__memory, arr.value, 3)
```

### Config

Config object specifies behaviour of imports, memory and other aspects.

```js
{
  // dict with imports
  imports: {
    // object
    math: {
      // direct value
      pi: Math.PI,
      // function / signature
      sin: Math.sin
    },

    // or aux source code
    latr: `...aux latr code`
  },

  // memory: false, exported name string or imported WebAssembly.Memory instance
  memory: "__memory",

  // heap size, in bytes
  heap: false
}
```

## Motivation

Audio processing doesn't have general cross-platform solution, many environments lack audio features.
JS _Web Audio API_ in particular is not suitable for audio purposes: unpredictable pauses, glitches and so on. It's better handled in worklet with WASM.<br/>
_Auro_ addresses these points, making audio code more accessible and robust.

That's personal attempt to rethink some JS parts and secure language ground. Someone may find it a line noise, but I find it beautiful.

<!--
It targets browsers, [audio worklets](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process), web-workers, nodejs, Python, [embedded systems](https://github.com/bytecodealliance/wasm-micro-runtime) etc.<br/>
-->

<!--
### Principles

* _Expressive_: common familiar expressions syntax, useful language patterns like range clamping, group operations etc.
* _No-keywords_: word means variable, symbol means operator. Allows truly i18l code.
* _Case-agnostic_: changing case doesn't break code: URL-safe. Typo-proof, eg. no `sampleRate` vs `samplerate` mistake.
* _Space-agnostic_: spaces/newlines (excluding comments) can be safely removed or added, eg. for compression or prettifying.
* _No types_: type is internal feature defined by operator. Focus on processing logic rather than language.
* _0 runtime_: statically analyzable, no OOP, no structures, no lamda functions, no dynamic scopes.
* _Explicit_: no implicit globals, no import-alls, no file conventions (like package.json).
* _Low-level_: no fancy features beyond math and buffers.
* _Static/Linear memory_: no garbage to collect, static-size heap.
* _Readability_: produced WASM must be readable.
-->

<!--
## Projects using aux

* [web-audio-api](https://github.com/audiojs/web-audio-api)
* [audiojs](https://github.com/audiojs/)
* [sonr](https://github.com/sonr/)
-->

### Inspiration

* [_mono_](https://github.com/stagas/mono)
* [_zzfx_](https://killedbyapixel.github.io/ZzFX/)
* [_bytebeat_](https://sarpnt.github.io/bytebeat-composer/)
* [_hxos_](https://github.com/stagas/hxos)
* [_min_](https://github.com/r-lyeh/min)
* [_porffor_](https://github.com/CanadaHonk/porffor)

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
