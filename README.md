# piezo ![stability](https://img.shields.io/badge/stability-experimental-black) [![test](https://github.com/dy/piezo/actions/workflows/test.yml/badge.svg)](https://github.com/dy/piezo/actions/workflows/test.yml)

Low-level language for signal processing, synthesis and analysis.<br/>
Compiles to compact 0-runtime WASM with linear memory.<br/>

<!-- [Examples](https://dy.github.io/piezo/examples/) | [Motivation](#motivation) -->

## Reference

```
;; Operators
+ - * / % -- ++               ;; arithmetical (float)
** %% //                      ;; power, unsigned mod, flooring div
& | ^ ~ >> <<                 ;; binary (integer)
<<< >>>                       ;; rotate left, right
&& || !                       ;; logical
> >= < <= == !=               ;; comparisons (boolean)
?: ?                          ;; conditions
x[i] x[]                      ;; member access, length
a..b a.. ..b ..               ;; ranges
|> #                          ;; pipe/loop, map
./ ../ /                      ;; continue/skip, break/stop, return
~ ~/ ~*                       ;; clamp, normalize, lerp
* ^                           ;; static, defer

;; Numbers
16, 0x10, 0b0;                ;; int, hex or binary
16.0, .1, 2e-3;               ;; float
1k = 1000; 1pi = 3.1415926;   ;; units
1s = 44100; 1m = 60s;         ;; eg: sample indexes
10.1k, 2pi, 1m30s;            ;; 10100, 6.283..., 66150

;; Variables
foo=1, bar=2.0;               ;; declare vars
AbC, $0, Δx, x@1, A#;         ;; names permit alnum, unicodes, _$#@
foo == Foo, bar == bAr;       ;; case-insensitive
default=1, eval=fn, else=0;   ;; no reserved words
true = 0b1, false = 0b0;      ;; eg: alias bools
inf = 1/0, nan = 0/0;         ;; eg: alias infinity, NaN

;; Ranges
0..10;                        ;; from 1 to 9 (10 exclusive)
0.., ..10, ..;                ;; open ranges
10..1;                        ;; reverse range
1.08..108.0;                  ;; float range
(a-1)..(a+1);                 ;; computed range
0..3 * 2;                     ;; mapped range: 0*2, 1*2, 2*2
(a,b,c) = 0..3 * 2;           ;; destructure: a=0, b=2, c=4
a <> 0..10;                   ;; a >= 0 && a < 10
a ~ 0..10;                    ;; clamp(a, 0, 10);
a ~/ 0..10;                   ;; normalize(a, 0, 10)
a ~* 0..10;                   ;; lerp(a, 0, 10);

;; Groups
(a,b,c) = (1,2,3);            ;; assign: a=1, b=2, c=3
(a,b) = (b,a);                ;; swap
(a,b,c) = d;                  ;; duplicate: a=d, b=d, c=d
(a,,b) = (c,d,e);             ;; skip: a=c, b=e
(a,b) + (c,d);                ;; group binary: a+c, b+d
(a, b, c)++;                  ;; group unary: a++, b++, c++
(a,b)[1] = c[2,3];            ;; props: a[1]=c[2], b[1]=c[3]
(a,..,z) = (1,2,3,4);         ;; pick: a=1, z=4
a = (b,c,d);                  ;; pick first: a=b; see loops

;; Arrays
m = [..10];                   ;; array of 10 elements
m = [..10 |> 2];              ;; filled with 2
m = [1,2,3,4];                ;; array of 4 elements
m = [n[..]];                  ;; copy n
m = [1, 2..4, 5];             ;; mixed definition
m = [1, [2, 3, [4]]];         ;; nested arrays (tree)
m = [0..4 |> # ** 2];         ;; list comprehension
(a, z) = (m[0], m[-1]);       ;; get by index
(b, .., z) = m[1, 2..];       ;; get multiple values
length = m[];                 ;; get length
m[0] = 1;                     ;; set value
m[2..] = (1, 2..4, n[1..3]);  ;; set multiple values from offset 2
m[1,2] = m[2,1];              ;; swap
m[0..] = m[-1..];             ;; reverse
m[0..] = m[1..,0];            ;; rotate

;; Conditions
a ? b;                        ;; if a then b (else nan)
sign = a < 0 ? -1 : +1;       ;; ternary conditional
(2+2 >= 4) ? log(1) :         ;; multiline/switch
  3 <= 1..2 ? log(2) :        ;; else if
  log(3);                     ;; else
a && b || c;                  ;; (a and b) or c

;; Loops
(a, b, c) |> f(#);            ;; for each item in a, b, c do f(item)
(i = 10..) |> (               ;; descend over range
  i < 5 ? a ./;               ;; if item < 5 skip (continue)
  i < 0 ? a ../;              ;; if item < 0 stop (break)
);                            ;;
x[..] |> f(#) |> g(#);        ;; pipeline sequence
(i = 0..w) |> (               ;; nest iterations
  (j = 0..h) |> f(i, j);      ;; f(x,y)
);                            ;;
((a,b) = 0..10) |> a+b;       ;; iterate pairs
(x,,y) = (a,b,c) |> # * 2;    ;; capture result x = a*2, y = c*2;
.. |> i < 10 ? i++ : ../;     ;; while i < 10 i++

;; Functions
double(n) = n*2;              ;; define a function
times(m = 1, n ~ 1..) = (    ;; optional, clamped arg
  n == 0 ? /n;                ;; early return
  m * n;                      ;; returns last statement
);                            ;;
times(3,2);                   ;; 6
times(4), times(,5);          ;; 4, 5: optional, skipped arg
dup(x) = (x,x);               ;; return multiple
(a,b) = dup(b);               ;; destructure
a=1,b=1; x()=(a=2;b=2); x();  ;; a==1, b==2: first statement declares locals

;; Static vars
a() = ( *i=0; ++i );          ;; i keeps value between calls
a(), a();                     ;; 1,2
a1() = ( *copy=a; copy() );   ;; clone function
a(), a(); a1(), a1();         ;; 3,4; 1,2;
f() = ( *t=0; ^t++; t*2 );    ;; defer: t++ called after return
x(a[], f()) = f(a[0]);        ;; array, func args

;; Export
x, y, z;                      ;; exports last statement
```

<!--
;; strings
hi="Hello, World!\n\t\x22\x27";;; creates static array (uint)
string="$<hi> world";         ;; interpolate: "hello world"
string[1];                    ;; positive indexing from first element [0]: 'e'
string[-3];                   ;; negative indexing from last element [-1]: 'r'
string[2..10];                ;; substring
string[1, 2..10, -1];         ;; slice/pick multiple elements
string[-1..0];                ;; reversed
string[];                     ;; length
(..a[] |> a[#] == b[#] ?: ../)[-1];   ;; compare (==,!=,>,<)
a = b ++ c;                   ;; concat: "hello worldhello world"
a[..] |> _==" " ? (a[from..to],from=to) : to++              ;; split: "a b" / " " = ["a", "b"]
(list[..]|>(_[..]," "))[..-1];;; join: " " * ["a", "b"] = "a b"
..2 |> b[..]                  ;; repeat: "abc" * 2 = "abcabc"

 -->

<!--
## Examples

<details>
<summary><strong>Gain</strong></summary>

Provides k-rate amplification for block of samples.

```
gain(                             ;; define a function with block, volume arguments.
  block,                          ;; block is a array argument
  volume <> 0..100                ;; volume is limited to 0..100 range
) = (
  block[..] |>= # * volume        ;; multiply each sample by volume value
);

gain([0..5 * 0.1], 2);            ;; 0, .2, .4, .6, .8, 1
```

</details>


<details>
<summary><strong>Biquad Filter</strong></summary>

A-rate (per-sample) biquad filter processor.

```
1pi = pi;                         ;; define pi units
1s = 44100;                       ;; define time units in samples
1k = 10000;                       ;; basic si units

lpf(                              ;; per-sample processing function
  x0,                             ;; input sample value
  freq = 100 <> 1..10k,            ;; filter frequency, float
  Q = 1.0 <> 0.001..3.0            ;; quality factor, float
) = (
  *(x1, y1, x2, y2) = 0;          ;; define filter state

  ;; lpf formula
  w = 2pi * freq / 1s;
  sin_w, cos_w = sin(w), cos(w);
  a = sin_w / (2.0 * Q);

  b0, b1, b2 = (1.0 - cos_w) / 2.0, 1.0 - cos_w, b0;
  a0, a1, a2 = 1.0 + a, -2.0 * cos_w, 1.0 - a;

  b0, b1, b2, a1, a2 *= 1.0 / a0;

  y0 = b0*x0 + b1*x1 + b2*x2 - a1*y1 - a2*y2;

  x1, x2 = x0, x1;            ;; shift state
  y1, y2 = y0, y1;

  y0                              ;; return y0
);

;; i = [0, .1, .3] |> lpf(i, 108, 5);
```

</details>

<details>
<summary><strong>ZZFX</strong></summary>

Generates ZZFX's [coin sound](https://codepen.io/KilledByAPixel/full/BaowKzv) `zzfx(...[,,1675,,.06,.24,1,1.82,,,837,.06])`.

```
1pi = pi;
1s = 44100;
1ms = 1s / 1000;

;; define waveform generators
oscillator = [
  saw(phase) = (1 - 4 * abs( round(phase/2pi) - phase/2pi )),
  sine(phase) = sin(phase)
];

;; applies adsr curve to sequence of samples
adsr(
  x,
  a <> 1ms..,                    ;; prevent click
  d,
  (s, sv=1),                    ;; optional group-argument
  r
) = (
  *i = 0;                       ;; internal counter, increments after fn body
  t = i / 1s;

  total = a + d + s + r;

  y = t >= total ? 0 : (
    t < a ? t/a :               ;; attack
    t < a + d ?                 ;; decay
    1-((t-a)/d)*(1-sv) :        ;; decay falloff
    t < a  + d + s ?            ;; sustain
    sv :                        ;; sustain volume
    (total - t)/r * sv
  ) * x;
  i++;
  y
);

;; curve effect
curve(x, amt~0..10=1.82) = (sign(x) * abs(x)) ** amt;

;; coin = triangle with pitch jump, produces block
coin(freq=1675, jump=freq/2, delay=0.06, shape=0) = (
  *out=[..1024];
  *i=0;
  *phase = 0;                   ;; current phase
  t = i / 1s;

  ;; generate samples block, apply adsr/curve, write result to out
  ..  |> oscillator[shape](phase)
      |> adsr(_, 0, 0, .06, .24)
      |> curve(_, 1.82)
      |> out[..] = _;

  i++;
  phase += (freq + (t > delay && jump)) * 2pi / 1s;
)
```

</details>
-->
<!--
## [Freeverb](https://github.com/opendsp/freeverb/blob/master/index.js)

```
<./combfilter.s#comb>;
<./allpass.s#allpass>;

1s = 44100;

(a1,a2,a3,a4) = (1116,1188,1277,1356);
(b1,b2,b3,b4) = (1422,1491,1557,1617);
(p1,p2,p3,p4) = (225,556,441,341);

;; TODO: stretch

reverb(input, room=0.5, damp=0.5) = (
  *combs_a = a0,a1,a2,a3 | a: stretch(a),
  *combs_b = b0,b1,b2,b3 | b: stretch(b),
  *aps = p0,p1,p2,p3 | p: stretch(p);

  combs = (
    (combs_a | x -> comb(x, input, room, damp) |: (a,b) -> a+b) +
    (combs_b | x -> comb(x, input, room, damp) |: (a,b) -> a+b)
  );

  (combs, aps) | (input, coef) -> p + allpass(p, coef, room, damp)
);
```

Features:

* _multiarg pipes_ − pipe can consume groups. Depending on arity of target it can act as convolver: `a,b,c | (a,b) -> a+b` becomes  `(a,b | (a,b)->a+b), (b,c | (a,b)->a+b)`.
* _fold operator_ − `a,b,c |: fn` acts as `reduce(a,b,c, fn)`, provides efficient way to reduce a group or array to a single value.

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
<!--
* [Freeverb](/examples/freeverb.s)
* [Floatbeat](/examples/floatbeat.s)
* [Complete ZZFX](/examples/zzfx.s)

See [all examples](/examples) -->


## Usage

_piezo_ is available as CLI or JS package.

`npm i -g piezo`

### CLI

```sh
piezo source.z -o dest.wasm
```

This produces compiled WASM binary.

### JS

```js
import piezo from 'piezo'

// create wasm arrayBuffer
const buffer = piezo.compile(`
  n=1;
  mult(x) = x*PI;
  arr=[1, 2, sin(1.08)];
  mult, n, arr;
`, {
  // js objects or paths to files
  imports: {
    math: Math,
    mylib: './path/to/my/lib.z'
  },
  // optional: import memory
  memory: true
})

// create wasm instance
const module = new WebAssembly.Module(buffer)
const instance = new WebAssembly.Instance(module, {
  imports: {
    math: Math,
    // imported memory
    memory: new WebAssembly.Memory({
      initial: 10,
      maximum: 100,
    })
  }
})

// use API
const { mult, n, arr, memory } = instance.exports

// number exported as global
n.value = 2;

// function exported directly
mult(108)

// array is a pointer to memory, get values via
const arrValues = new Float64Array(arr, memory)
```


## Motivation

Audio processing has no cross-platform solution, various environments deal with audio differently, some don't have audio processing at all. _Web Audio API_ is unreliable - it has unpredictable pauses, glitches and so on, so <q>audio is better handled in WASM worklet</q> ([@stagas](https://github.com/stagas)).

_Piezo_ attempts to fill that gap, providing a common layer. It is also a personal attempt on language design - rethinking parts and providing safe haven. WASM target gives max performance and compatibility - browsers, [audio/worklets](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process), web-workers, nodejs, [embedded systems](https://github.com/bytecodealliance/wasm-micro-runtime) etc.


### Principles

* _Intuitivity_: common syntax, familiarity, no intimidation with new operators.
* _Elegance_: compact expressions, fit for live coding.
* _Performance_: compiles optimal code quickly, suitable for live envs.
* _0 keywords_: word means variable, symbol means operator, allows i18l code.
* _0 runtime_: statically analyzable, no OOP, no dynamic structures, no lamda funcs, no nested scopes.
* _0 waste_: no GC, linear memory, fixed heap.
* _Implicit types_: only int and float defined by operator, to focus on logic rather than language.
* _Explicit vars_: no implicit globals, no import-alls, no implicit file conventions (like package.json).
* _Space-agnostic_: spaces/newlines can be removed or added, eg. for compression or prettifying.
* _Case-agnostic_: changing vars case doesn't break code, no `sampleRate` vs `samplerate` mistakes.
* _Normalized syntax_: no smart parsing rules, everything is just unary, binary or nary operators.
* _Readabile output_: produces readable wasm text.
* _Low-level_: no fancy features beyond math and buffers, compilable to ASM envs.

<!--
## Projects using piezo

* [web-audio-api](https://github.com/audiojs/web-audio-api)
* [audiojs](https://github.com/audiojs/)
-->


### Inspiration

[_mono_](https://github.com/stagas/mono), [_zzfx_](https://killedbyapixel.github.io/ZzFX/), [_bytebeat_](https://sarpnt.github.io/bytebeat-composer/), [_glitch_](https://github.com/naivesound/glitch), [_hxos_](https://github.com/stagas/hxos), [_min_](https://github.com/r-lyeh/min), [_roland_](https://github.com/DenialAdams/roland), [_porffor_](https://github.com/CanadaHonk/porffor)

### Acknowledgement

* @stagas for initial drive & ideas

<p align=center><a href="https://github.com/krsnzd/license/">⚡ 🕉</a></p>
