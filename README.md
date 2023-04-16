# lino

**Lino** (*li*ne *no*ise) is micro-language for sound fx design, processing, and utilities. Lino features common syntax, type inference, and compiles to WASM bytecode, making it available to various environments and platforms - mainly targets [audio worklets](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process), workers, [nodejs](https://github.com/audiojs/web-audio-api), but can also be used in Rust, Python, and Go.
<!--[Motivation](./docs/motivation.md)  |  [Documentation](./docs/reference.md)  |  [Examples](./docs/examples.md).-->

> WIP: current stage is stabilized syntax and basic cases compilation; it requires full compiler implementation.

## Reference

```fs
//////////////////////////// naming convention
foo=1, bar=2;                 // declare multiple vars
Ab_C_F#, $0, Δx;              // names permit alnum, unicodes, #, _, $
fooBar123 == FooBar123;       // names are case-insensitive (lowcase encouraged!)
default=1, eval=fn, else=0;   // lino has no reserved words

//////////////////////////// numbers
16, 0x10, 0b0;                // int (dec, hex or binary form)
16.0, .1, 1e3, 2e-3;          // floats
true = 0b1, false = 0b0;      // hint: alias booleans

//////////////////////////// type cast
1 * 2; 12 - 10;               // ints persist type if possible
1 / 3; 2 * 3.14;              // ints cast to floats otherwise
3.14 | 0; ~~2.5;              // floats cast to ints in binary operations

//////////////////////////// standard operators
+ - * / % ** -- ++            // arithmetical (** for pow)
&& || ! ?:                    // logical
& | ^ ~ >> <<                 // binary
== != >= <=                   // comparisons

//////////////////////////// extra operators
| <| |> |=                    // iterate, loop, fold, transform
-< -<=                        // clamp
[]                            // length
^ ^^                          // continue/return, break/return
@ .                           // import, export

//////////////////////////// units
1k = 1000; 1pi = 3.1415;      // define units
1s = 44100; 1ms = 1s/1000;    // useful for sample indexes
10.1k, 2pi;                   // units deconstruct to numbers: 10100, 6.283
1h2m3.5s;                     // unit combinations

//////////////////////////// ranges
1..10;                        // basic range
1.., ..10;                    // open ranges
10..1;                        // reverse range
1.08..108.0;                  // float range
0>..10, 0..<10, 0>..<10;      // non-inclusive ranges
(x-1)..(x+1);                 // calculated ranges
1..2 + 2..3;                  // add ranges: 1..3
1..3 - 2..;                   // subtract ranges: 1..2
(-10..10)[];                  // length: 20
1..2[0]; 1..2[-1];            // min/max: 1; 2

//////////////////////////// clamp
x -< 0..10;                   // clamp(x, 0, 10)
x -< ..10;                    // min(x, 10)
x -< 0..;                     // max(0, x)
x -<= 0..10;                  // x = clamp(x, 0, 10)
4.. -< ..8;                   // clamp ranges: 4..8
x -< (x,y,z);                 // return x if it's in a group, null otherwise

//////////////////////////// length
[1,2,3][];                    // 3
(1,2,3)[];                    // 3
(-1..+2)[];                   // 3

//////////////////////////// groups
a, b, c;                      // groups are syntactic sugar
(a, b, c)++;                  // apply operation to multiple elements: (a++, b++, c++)
(a, (b, c));                  // groups are always flat == (a, b, c)
(a,b,c) = (d,e,f);            // assign: a=d, b=e, c=f
(a,b) = (b,a);                // swap: temp=a; a=b; b=temp;
(a,b) + (c,d);                // operations: (a+c, b+d)
(a,b).x;                      // (a.x, b.x);
(a,b).x();                    // (a.x(), b.x());
(a,b,c) = (d,e,f);            // (a=d, b=e, c=f);
(a,b,c) = d;                  // (a=d, b=d, c=d);
a = (b,c,d);                  // error: wrong number of assignment elements
a = b, c = d;                 // note: assignment precedence is higher: (a = b), (c = d)
(a,b,c) = fn();               // functions can return multiple values;

//////////////////////////// statements
foo();                        // semi-colons at end of line are mandatory
(c = a + b; c);               // parens define block, return last element
(a = b+1; a,b,c);             // block can return group
(a && ^b; c);                 // return/break operator can preliminarily return value

//////////////////////////// conditions
sign = a < 0 ? -1 : +1;       // inline ternary
(2+2 >= 4) ?                  // multiline ternary
  log("Math works!")          //
: "a" < "b" ?                 // else if
  log("Sort strings")         //
: (                           // else
  log("Get ready");           //
  log("Last chance")          //
);                            //
a > b && c;                   // if a > b then c
a < b || c;                   // if a < b else c

//////////////////////////// functions
double = n -> n*2;            // inline function
triple = (n=1) -> (           // optional args
  n == 0 ? ^n;                // preliminarily return n
  n*3                         // returns last value
);
triple();                     // 3
triple(5);                    // 15
triple(n: 10);                // 30. named argument.
copy = triple;                // capture function
copy(n: 10);                  // also 30
clamp = (v -< 0..10) -> v;    // clamp argument
x = () -> (1,2,3);            // return group (multiple values)
(a,b,c) = x();                // assign to a group

//////////////////////////// stateful variables
a = () -> ( *i=0; i++ );      // stateful variable - persist value between fn calls
a(), a();                     // 0, 1
b = () -> (                   //
  *i = [..4];                 // local memory of 4 items
  i >> 1;                     // shift memory right every fn call
  i.0 = i.1+1;                // write previous value i.1 to current value i.0
  i.0                         // return i.0
);                            //
b(), b(), b();                // 1, 2, 3

//////////////////////////// arrays
m = [1,2,3,4];                // create array of 4 items
m = [0..1000];                // create array of 1000 items
m = [l:2, r:4, c:6];          // create with position aliases
m = [0..8 | i -> i*2];        // create from list comprehension
m.0, m.1, m.2, m.3;           // access item by static index (0-based)
m[0], m[1], m[-1];            // access by dynamic index, negative for last element
m[];                          // get length
m[1..3] = (7,8);              // write multiple values
m[0..] = (1,2,3,4);           // write all values from index 0
m[-1..0] = m[0..];            // reverse order
m << 2; m >> 3;               // shift values in array right or left
n = [m[1..3, 5, 6..]];        // create copy from indicated subrange
~m;                           // dispose (free) array

//////////////////////////// loop
i=0; i++ < 3 <| log(i);       // inline loop: while i++ < 3 do log(i)
(i=0; i++ < 10 <| (           // multiline loop
  i < 3 ? ^^;                 // `^^` to break loop (can return value as ^^x)
  i < 5 ? ^;                  // `^` to continue loop (can return value as ^x)
  log(i);                     //
));                           //
[ j++ < 10 <| j * 2 ];        // list comprehension via loop

///////////////////////////// iterator
(a, b, c) | a -> a.x * 2;     // map items (syntactically)
[a, b, c] | x -> a(x);        // iterate over array
10..1 | i -> (                // iterate over range
  i < 3 ? ^^;                 // `^^` breaks iteration
  i < 5 ? ^;                  // `^` continues iteration
);                            //
[ 1..10 | x -> x * 2 ];       // list comprehension via iterator
items |= x -> x * 2;          // overwrite items in source array

//////////////////////////// fold
(a,b,c) |> (a,b) -> a + b;    // fold group (syntax sugar)
[a,b,c] |> (a,b) -> a + b;    // fold list

//////////////////////////// import
@'./path/to/module#x,y,z';    // any file can be imported directly
@'math#pi,sin,max';           // or defined via import-maps.json

//////////////////////////// export
x, y, z.                      // last statement in the file ending with . exports all members
```

<!--

//////////////////////////// strings
// NOTE: can be not trivial to
hi="hello";                   // strings
string="{hi} world";          // interpolated string: "hello world"
"\u0020", "\x20";             // unicode or ascii codes
string[1]; string.1;          // positive indexing from first element [0]: 'e'
string[-3];                   // negative indexing from last element [-1]: 'r'
string[2..10];                // substring
string[1, 2..10, -1];         // slice/pick multiple elements
string[-1..0];                // reverse
string[];                     // length
string == string;             // comparison (==,!=,>,<)
string + string;              // concatenation: "hello worldhello world"
string - string;              // removes all occurences of the right string in the left string: ""
string / string;              // split: "a b" / " " = ["a", "b"]
string * list;                // join: " " * ["a", "b"] = "a b"
string * 2;                   // repeat: "abc" * 2 = "abcabc"
"l" ~< string;                // find position of substring in the string
NOTE: indexOf can be done as `string | (x,i) -> (x == "l" ? i)`
-->

## Examples

### Gain Processor

Provides k-rate amplification of input audio.

```fs
gain = ( x, volume -< 0..100 ) -> (
  x * volume;  // write to output array
);

[0, .1, .2, .3, .4, .5] | x -> gain(x, 2);
// 0, .2, .4, .6, .8, 1
```

* _functions_ − arrow `(a, b -< 0..10, c=10) -> (expr1; expr2)` defines a function. Arguments may have range or default value indicators. Function returns last expression or sequence.
* _batch input/output_ − `[input]` batch argument indicates <em title="Audio, or precise rate">a-rate*</em> param; direct argument is <em title="Controlling (historical artifact from CSound), blocK-rate">k-rate*</em> param.
* _validation_ − `a -< range` (_a ∈ range_) clamps argument to provided range, to avoid blowing up values.
* _range_ − primitive with `from..to` signature, useful for clamping, slicing etc.


### Biquad Filter

Biquad filter processor for single-channel input.

```fs
@ 'math#pi,cos,sin';          // import pi, sin, cos from math

1pi = pi;                     // define pi units
1s = 44100;                   // define time units in samples
1k = 10000;                   // basic si units

// process single sample
lpf = (x0, freq = 100 -< 1..10k, Q = 1.0 -< 0.001..3.0) -> (
  *x1=0, *x2=0, *y1=0, *y2=0;     // filter state (defined by callsite)

  // lpf formula
  w = 2pi * freq / 1s;
  (sin_w, cos_w) = (sin(w), cos(w));
  a = sin_w / (2.0 * Q);

  (b0, b1, b2) = ((1.0 - cos_w) / 2.0, 1.0 - cos_w, b0);
  (a0, a1, a2) = (1.0 + a, -2.0 * cos_w, 1.0 - a);

  (b0, b1, b2, a1, a2) *= 1.0 / a0;

  y0 = b0*x0 + b1*x1 + b2*x2 - a1*y1 - a2*y2;

  (x1, x2) = (x0, x1);
  (y1, y2) = (y0, y1);

  y0
);

// process block (mutable)
lpf = (x, freq, Q) -> (x |= x -> lpf(x, freq, Q)).
```

* _import_ − done via URI string as `@ 'path/to/lib#foo,bar'`. <!-- Built-in libs are: _math_, _std_. Additional libs: _sonr_, _latr_, _musi_ and [others](). --> _import-map.json_ can provide import aliases.
* _state variables_ − `*state=init` persists value between <span title="Detected by callsite">function calls*</span>.
* _groups_ − group operations provide syntax sugar for easier and shorter notation.
* _scope_ − parens `()` besides precedence can indicate function body; returns last element or group.
* _export_ – last statement with period operator indicates exported entries.

### ZZFX

Consider [coin sound](https://codepen.io/KilledByAPixel/full/BaowKzv):
> `zzfx(...[,,1675,,.06,.24,1,1.82,,,837,.06])`

```fs
@ 'math#pi,abs,sin,round';

1pi = pi;
1s = 44100;
1ms = 1s / 1000;

oscillator = [
  saw: phase -> 1 - 4 * abs( round(phase/2pi) - phase/2pi ),
  sine: phase -> sin(phase);
];

adsr = (x, a, d, (s, sv=1), r) -> ( // optional group-argument
  *i = 0;
  t = i++ / 1s;

  a -<= 1ms..;                   // prevent click
  total = a + d + s + r;

  y = t >= total ? 0 : (
    t < a ? t/a :                // attack
    t < a + d ?                  // decay
    1-((t-a)/d)*(1-sv) :         // decay falloff
    t < a  + d + s ?             // sustain
    sv :                         // sustain volume
    (total - t)/r * sv
  ) * x;

  y
);

// curve effect
curve = (x, amt=1.82 -< 0..10) -> (sign(x) * abs(x)) ** amt;

// coin = triangle with pitch jump, produces block
coin = (freq=1675, jump=freq/2, delay=0.06, shape=0) -> (
  *i, *phase = 0, 0;  // current state
  *out=[..1024];      // output block of 1024 samples

  t = i++ / 1s;
  phase += (freq + t > delay ? jump : 0) * 2pi / 1s;

  out |= oscillator[shape](phase) | x -> adsr(x, 0, 0, .06, .24) | x -> curve(x, 1.82);

  out
);
```

* _groups_ − groups are just syntax sugar and are always flat, ie. `a, d, (s, sv), r` == `a, d, s, sv, r`. They're desugared on compilation stage.
* _units_ – define number multipliers as `1<unit> = <number>`. Units decompose to numbers on compiling stage.
* _pipes_ − `|` operator is overloaded for functions as `a | b` → `b(a)`.
* _arrays_ − flat collection of same-type elements: numbers or functions. Unlike groups, arrays are primitives and stored in memory.
* _named members_ − group or array members can get alias as `[foo: a, bar: b]`.


## [Freeverb](https://github.com/opendsp/freeverb/blob/master/index.js)

```fs
@ './combfilter.li#comb';
@ './allpass.li#allpass'

1s = 44100;

(a1,a2,a3,a4) = (1116,1188,1277,1356);
(b1,b2,b3,b4) = (1422,1491,1557,1617);
(p1,p2,p3,p4) = (225,556,441,341);

// TODO: stretch

reverb = ([]input, room=0.5, damp=0.5) -> (
  *combs_a = a0,a1,a2,a3 | a -> stretch(a),
  *combs_b = b0,b1,b2,b3 | b -> stretch(b),
  *aps = p0,p1,p2,p3 | p -> stretch(p);

  combs = (
    (combs_a | x -> comb(x, input, room, damp) |> (a,b) -> a+b) +
    (combs_b | x -> comb(x, input, room, damp) |> (a,b) -> a+b)
  );

  (combs, aps) |> (input, coef) -> p + allpass(p, coef, room, damp)
);
```

Features:

* _multiarg pipes_ − pipe can consume groups. Depending on arity of target it can act as convolver: `a,b,c | (a,b) -> a+b` becomes  `(a,b | (a,b)->a+b), (b,c | (a,b)->a+b)`.
* _fold operator_ − `a,b,c |> fn` acts as `reduce(a,b,c, fn)`, provides efficient way to reduce a group or array to a single value.

### [Floatbeat](https://dollchan.net/bytebeat/index.html#v3b64fVNRS+QwEP4rQ0FMtnVNS9fz9E64F8E38blwZGvWDbaptCP2kP3vziTpumVPH0qZyXzfzHxf8p7U3aNJrhK0rYHfgHAOZZkrlVVu0+saKbd5dTXazolRwnvlKuwNvvYORjiB/LpyO6pt7XhYqTNYZ1DP64WGBYgczuhAQgpiTXEtIwP29pteBZXqwTrB30jwc7i/i0jX2cF8g2WIGKlhriTRcPjSvcVMBn5NxvgCOc3TmqZ7/IdmmEnAMkX2UPB3oMHdE9WcKqVK+i5Prz+PKa98uOl60RgE6zP0+wUr+qVpZNsDUjKhtyLkKvS+LID0FYVSrJql8KdSMptKKlx9eTIbcllvdf8HxabpaJrIXEiycV7WGPeEW9Y4v5CBS07WBbUitvRqVbg7UDtQRRG3dqtZv3C7bsBbFUVcALvwH86MfSDws62fD7CTb0eIghE/mDAPyw9O9+aoa9h63zxXl2SW/GKOFNRyxbyF3N+FA8bPyzFb5misC9+J/XCC14nVKfgRQ7RY5ivKeKmmjOJMaBJSbEZJoiZZMuj2pTEPGunZhqeatOEN3zadxrXRmOw+AA==)

Transpiled floatbeat/bytebeat song:

```fs
@'math#asin,sin,pi';

sampleRate = 44100;

fract = (x) -> x % 1;
mix = (a, b, c) -> (a * (1 - c)) + (b * c);
tri = (x) -> 2 * asin(sin(x)) / pi;
noise = (x) -> sin((x + 10) * sin((x + 10) ** (fract(x) + 10)));
melodytest = (time) -> (
  melodyString = "00040008",
  melody = 0;
  i = 0;

  i++ < 5 <| (
    melody += tri(
      time * mix(
        200 + (i * 900),
        500 + (i * 900),
        melodyString[floor(time * 2) % melodyString[]] / 16
      )
    ) * (1 - fract(time * 4))
  );

  melody
)
hihat = (time) -> noise(time) * (1 - fract(time * 4)) ** 10;
kick = (time) -> sin((1 - fract(time * 2)) ** 17 * 100);
snare = (time) -> noise(floor((time) * 108000)) * (1 - fract(time + 0.5)) ** 12;
melody = (time) -> melodytest(time) * fract(time * 2) ** 6 * 1;

song = () -> (
  *t=0; time = t++ / sampleRate;
  (kick(time) + snare(time)*.15 + hihat(time)*.05 + melody(time)) / 4
).
```

Features:

* _loop operator_ − `cond <| expr` acts as _while_ loop, calling expression until condition holds true. Produces sequence as result.
* _string literal_ − `"abc"` acts as array with ASCII codes.
* _length operator_ − `items[]` returns total number of items of either an array, group, string or range.

[See all examples](/examples)


## Usage

Lino is available as JS package.

`npm i lino`

```js
import * as lino from 'lino'

// create wasm arrayBuffer
const buffer = lino.compile(`mult = (x,y) -> x*y; mult.`)

// create wasm instance
const module = new WebAssembly.Module(buffer)
const instance = new WebAssembly.Instance(module)

// use API
const {mult} = instance.exports
mult(108,2) // 216
```


## Inspiration

* [mono](https://github.com/stagas/mono) – spiritual brother at cowbell.lol.
* [min](https://github.com/r-lyeh/min) – syntax / style inspiration.

<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
