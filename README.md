# lino

**Lino** (*li*ne *no*ise) is micro-language for sound design, processing and utilities. It has minimal JS-like syntax<span title="Common base from C, JS, Java, Python, Swift, Kotlin, Rust. No-keywords allows better minification and internationalization; Case-agnostic makes it URL-safe and typo-proof.">\*</span>, subtle type inference<span title="Types are inferred from code hints like 0.0 vs 0 or by operations.">\*</span> and refined language patterns<span title="Pipes, deferring, stateful variables, ranges, units, tuples">\*</span>. It has linear no-GC memory and compiles to 0-runtime WASM bytecode for compactness, robustness and accessibility: browsers, [audio worklets](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process), web-workers, nodejs, VST, Rust, Python, Go, [embedded systems](https://github.com/bytecodealliance/wasm-micro-runtime) etc.

<!--[Motivation](./docs/motivation.md)  |  [Documentation](./docs/reference.md)  |  [Examples](./docs/examples.md).-->

<!--
## Projects using lino

* [web-audio-api](https://github.com/audiojs/web-audio-api)
* [audiojs](https://github.com/audiojs/)
* [sonr](https://github.com/sonr/)
-->


## Reference

```
\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ variables
foo=1, bar=2;                   \\ declare vars
Ab_C_F#, $0, Δx, _;             \\ names permit alnum, unicodes, #, _, $
fooBar123 == FooBar123;         \\ names are case-insensitive (lowcase encouraged!)
default=1, eval=fn, else=0;     \\ lino has no reserved words

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ numbers
16, 0x10, 0b0;                  \\ int (dec, hex or binary form)
16.0, .1, 1e3, 2e-3;            \\ floats
true = 0b1, false = 0b0;        \\ hint: alias booleans

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ type cast
1 * 2; 12 - 10;                 \\ ints persist type if possible
1 / 3; 2 * 3.14;                \\ ints upgrade to floats via float operations
3.14 | 0; 2.5 // 1;             \\ floats cast to ints in int operations

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ units
1k = 1000; 1pi = 3.1415;        \\ define units
1s = 44100; 1ms = 0.001s;       \\ useful for sample indexes
10.1k, 2pi;                     \\ units deconstruct to numbers: 10100, 6.283
1h2m3.5s;                       \\ unit combinations

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ standard operators
+ - * / % -- ++                 \\ arithmetical
&& || ! ?:                      \\ logical
& | ^ ~ >> <<                   \\ binary
== != >= <=                     \\ comparisons

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ extended operators
** // %%                        \\ pow, int (floor) division, unsigned mod (wraps negatives)
<| <|= #                        \\ for each, map, member
-< -<=                          \\ clamp
[]                              \\ prop, length
* >                             \\ (unary) declare state, defer
^ ^^                            \\ continue/return, break/return
@ .                             \\ import, end of program

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ ranges
1..10;                          \\ basic range
1.., ..10, ..;                  \\ open ranges
10..1;                          \\ reverse range
1.08..108.0;                    \\ float range
0>..10, 0..<10, 0>..<10;        \\ non-inclusive ranges
(x-1)..(x+1);                   \\ calculated ranges
1..2 + 2..3;                    \\ add ranges: 1..3
1..3 - 2..;                     \\ subtract ranges: 1..2
(-10..10)[];                    \\ span: 20
x -< 0..10;                     \\ clamp(x, 0, 10)
x -< ..10;                      \\ min(x, 10)
x -< 0..;                       \\ max(0, x)
x -<= 0..10;                    \\ x = clamp(x, 0, 10)
a,b,c = 0..2;                   \\ ranges are sugar, not data type: a==0, b==1, c==2

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ groups
a, b, c;                        \\ groups are sugar, not tuple
(a, b, c)++;                    \\ apply operation to multiple elements: (a++, b++, c++)
(a, (b, c));                    \\ groups are always flat == (a, b, c)
(a,b,c) = (d,e,f);              \\ assign: a=d, b=e, c=f
(a,b) = (b,a);                  \\ swap: temp=a; a=b; b=temp;
(a,b) + (c,d);                  \\ operations: (a+c, b+d)
(a,b).x;                        \\ (a.x, b.x);
(a,b).x();                      \\ (a.x(), b.x());
(a,b) = (c,d,e);                \\ (a=c, b=d);
(a,b,c) = d;                    \\ (a=d, b=d, c=d);
a = (b,c,d);                    \\ (a=b);
a = b, c = d;                   \\ note: assignment precedence is higher: (a = b), (c = d)
(a,b,c) = fn();                 \\ functions can return multiple values;

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ statements
foo();                          \\ semi-colons at end of line are mandatory
(c = a + b; c);                 \\ parens define block, return last element
(a = b+1; a,b,c);               \\ block can return group
(a ? ^b ; c);                   \\ return/break operator can preliminarily return value
(a;b;);                         \\ note: returns null, if semicolon is last within block
(a=1; a=1.0);                   \\ a is upgraded to float

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ conditions
sign = a < 0 ? -1 : +1;         \\ inline ternary
(2+2 >= 4) ?                    \\ multiline ternary
  log("Math works!")
: "a" < "b" ?                   \\ else if
  log("Sort strings")
: (                             \\ else
  log("Get ready");
  log("Last chance")
);
a || b ? c;                     \\ if a or b then c
a && b ?: c;                    \\ elvis: if not a and b then c

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ functions
double(n) = n*2;                \\ inline function
triple(n=1) = (                 \\ optional args
  n == 0 ? ^n;                  \\ return n
  n*3                           \\ returns last value
);
triple();                       \\ 3
triple(5);                      \\ 15
triple(n: 10);                  \\ 30. named argument.
copy = triple;                  \\ capture function
copy(n: 10);                    \\ also 30
clamp(v -< 0..10) = v;          \\ clamp argument
x() = (1,2,3);                  \\ return group (multiple values)
(a,b,c) = x();                  \\ assign to a group

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ stateful variables
a() = ( *i=0; i++ );            \\ stateful variable - persist value between fn calls
a(), a();                       \\ 0, 1
b() = (
  *i = [..4];                   \\ local memory of 4 items
  >i = i[-1,1..];               \\ defer memory shift, called after fn body
  i.0 = i.1+1;                  \\ write previous value i.1 to current value i.0
  i.0                           \\ return i.0
);
b(), b(), b();                  \\ 1, 2, 3

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ buffers
m = [1,2,3,4];                  \\ create buffer of 4 items
m = [..1000];                   \\ create buffer of 1000 items
m = [l:2, r:4, c:6];            \\ create with position aliases
m = [n[1..3, 5, 6..]];          \\ create copy from indicated subrange
m = [1, 2..4, ..10, n];         \\ create from mixed definition (buffer is always flat)
m.0, m.1, m.2, m.3;             \\ read item by static index (0-based)
m[0], m[1], m[-1];              \\ read by dynamic index, negative for last element
m[1..2];                        \\ read multiple values
m[];                            \\ get length
m[0] = 1;                       \\ write single value
m[1..] = (7,8);                 \\ write multiple values from specified index
m[1,2] = m[2,1];                \\ rearrange items
m[0..] = m[-1..0];              \\ reverse order
m = m[1..,0];                   \\ rotate memory left

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ loops
[a, b, c] <| x(#);              \\ for each item # call x(item)
10..1 <| (                      \\ iterate range
  # < 3 ? ^^;                   \\ ^^ breaks loop
  # < 5 ? ^;                    \\ ^ continues loop
);
0.. <| # >= 3 ? ^^ : log(#);    \\ while idx < 3 log(idx)
[1..10 <| # * 2];               \\ list comprehension
items <| a(#) <| b(#);          \\ chain iterations

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ import, export
@./path/to/module#x,y,z;        \\ any file can be imported directly
@math#pi,sin,max;               \\ or defined via import-maps.json
x, y, z                         \\ last statement ending with . exports members
```

## Examples

### Gain Processor

Provides k-rate amplification for block of samples.

```
gain(                               \\ define a function with block, volume arguments.
  block,                            \\ block type is inferred as buffer from pipe operation |=
  volume -< 0..100.0                \\ volume is clamped to 0..100, type is inferred as float
) = (
  block <|= # * volume;             \\ map each sample via multiplying by value
);

gain([0, .1, .2, .3, .4, .5], 2);   \\ [0, .2, .4, .6, .8, 1]

gain.                               \\ export gain function
```

<!--Minifies as `gain(b,v)=b|=x->x*v.`-->

### Biquad Filter

A-rate (per-sample) biquad filter processor.

```
@math#pi,cos,sin;                   \\ import pi, sin, cos from math

1pi = pi;                           \\ define pi units
1s = 44100;                         \\ define time units in samples
1k = 10000;                         \\ basic si units

lpf(                                \\ per-sample processing function
  x0,                               \\ input sample value
  freq = 100 -< 1..10k,             \\ filter frequency, float
  Q = 1.0 -< 0.001..3.0             \\ quality factor, float
) = (
  *(x1, y1, x2, y2) = 0;            \\ define filter state
  >(x1, x2) = (x0, x1);             \\ defer shifting state
  >(y1, y2) = (y0, y1);

  \\ lpf formula
  w = 2pi * freq / 1s;
  (sin_w, cos_w) = (sin(w), cos(w));
  a = sin_w / (2.0 * Q);

  (b0, b1, b2) = ((1.0 - cos_w) / 2.0, 1.0 - cos_w, b0);
  (a0, a1, a2) = (1.0 + a, -2.0 * cos_w, 1.0 - a);

  (b0, b1, b2, a1, a2) *= 1.0 / a0;

  y0 = b0*x0 + b1*x1 + b2*x2 - a1*y1 - a2*y2;
  y0                                \\ return y0
);

\\ [0, .1, ...] <| lpf(#, 108, 5)

lpf.                                \\ export lpf function, end program
```

### ZZFX

Generates ZZFX's [coin sound](https://codepen.io/KilledByAPixel/full/BaowKzv) `zzfx(...[,,1675,,.06,.24,1,1.82,,,837,.06])`.

```
@math#pi,abs,sin,round;

1pi = pi;
1s = 44100;
1ms = 1s / 1000;

// define waveform generators table
oscillator = [
  saw(phase) = (1 - 4 * abs( round(phase/2pi) - phase/2pi )),
  sine(phase) = sin(phase)
];

// applies adsr curve to sequence of samples
adsr(x, a, d, (s, sv=1), r) = (   \\ optional group-argument
  *i = 0; >i++;                   \\ internal counter, increments after fn body
  t = i / 1s;

  a -<= 1ms..;                    \\ prevent click
  total = a + d + s + r;

  y = t >= total ? 0 : (
    t < a ? t/a :                 \\ attack
    t < a + d ?                   \\ decay
    1-((t-a)/d)*(1-sv) :          \\ decay falloff
    t < a  + d + s ?              \\ sustain
    sv :                          \\ sustain volume
    (total - t)/r * sv
  ) * x;
  y
);

\\ curve effect
curve(x, amt=1.82 -< 0..10) = (sign(x) * abs(x)) ** amt;

\\ coin = triangle with pitch jump, produces block
coin(freq=1675, jump=freq/2, delay=0.06, shape=0) = (
  out=[..1024];                   \\ output block of 1024 samples
  *i=0; >i++;
  *phase = 0;                     \\ current phase
  t = i / 1s;
  >phase += (freq + (t > delay ? jump : 0)) * 2pi / 1s;

  out <|= oscillator[shape](phase)
      <| adsr(#, 0, 0, .06, .24)
      <| curve(#, 1.82)
).
```

<!--
## [Freeverb](https://github.com/opendsp/freeverb/blob/master/index.js)

```fs
@'./combfilter.li#comb';
@'./allpass.li#allpass';

1s = 44100;

(a1,a2,a3,a4) = (1116,1188,1277,1356);
(b1,b2,b3,b4) = (1422,1491,1557,1617);
(p1,p2,p3,p4) = (225,556,441,341);

\\ TODO: stretch

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

```fs
@'math#asin,sin,pi';

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

* [Freeverb](/examples/freeverb.li)
* [Floatbeat](/examples/floatbeat.li)
* [Complete ZZFX](/examples/zzfx.li)

See [all examples](/examples)


## Usage

Lino is available as JS package.

`npm i lino`

<!--
CLI:
```sh
lino source.li > compiled.wasm
```
-->

From JS:

```js
import * as lino from 'lino'

// create wasm arrayBuffer
const buffer = lino.compile(`mult(x,y) = x*y; mult.`)

// create wasm instance
const module = new WebAssembly.Module(buffer)
const instance = new WebAssembly.Instance(module)

// use API
const {mult} = instance.exports
mult(108,2) // 216
```



<!--

\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ strings
\\ NOTE: can be not trivial to
hi="hello";                     \\ strings
string="{hi} world";            \\ interpolated string: "hello world"
"\u0020", "\x20";               \\ unicode or ascii codes
string[1]; string.1;            \\ positive indexing from first element [0]: 'e'
string[-3];                     \\ negative indexing from last element [-1]: 'r'
string[2..10];                  \\ substring
string[1, 2..10, -1];           \\ slice/pick multiple elements
string[-1..0];                  \\ reverse
string[];                       \\ length
string == string;               \\ comparison (==,!=,>,<)
string + string;                \\ concatenation: "hello worldhello world"
string - string;                \\ removes all occurences of the right string in the left string: ""
string / string;                \\ split: "a b" / " " = ["a", "b"]
string * list;                  \\ join: " " * ["a", "b"] = "a b"
string * 2;                     \\ repeat: "abc" * 2 = "abcabc"
NOTE: indexOf can be done as `string | (x,i) -> (x == "l" ? i)`
-->


## Motivation

JavaScript and _Web Audio API_ is not suitable for sound purposes – it has unpredictable pauses, glitches and so on. It better be handled in worklet with WASM code.

_Lino_ is intended to be low-level static language with minimal JS-like syntax. Inspired by [_mono_](https://github.com/stagas/mono), _zzfx_, _bytebeat_, _[hxos](https://github.com/stagas/hxos)_, [_min_](https://github.com/r-lyeh/min) etc.


### Principles

* _Common syntax_: familiar code, copy-pastable floatbeats.
* _No-keywords_: safe var names, max minification, i18l code.
* _Case-agnostic_: URL-safe, typo-proof.
* _Subtle type inference_: type by-operator, not dedicated syntax.
* _No OOP_: functions, stateful vars.
* _Groups_: multiple returns, multiple operands.
* _No implicit globals_: wysiwyg.
* _Ranges_: prevent blowing up values.
* _Pipes_: iterators instead of loops.
* _Low-level_: no fancy features beyond math and buffers.
* _Static/Linear memory_: no garbage to collect.
* _0 runtime_: statically analyzable.
* _Flat_: no nested scopes, flat arrays.

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
