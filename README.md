# lino

**Lino** (*li*ne *no*ise) is sound processing language with enhanced ergonomics and accessibility.
It has C/JS/Python-y syntax and compiles to optimized WASM bytecode, making it available for different environments, eg. [AudioWorkletProcessor](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process), [audio engines](https://github.com/audiojs/web-audio-api), etc.

<!--[Motivation](./docs/motivation.md)  |  [Documentation](./docs/reference.md)  |  [Examples](./docs/examples.md).-->

> WORK IN PROGRESS NOTICE: current stage is stabilized syntax and basic cases compilation; it requires full compiler implementation.

## Reference

```fs
//////////////////////////// naming convention
foo_bar == Foo_Bar;         // identifiers are case-insensitive
if=12; for=some_Variable;   // lino has no reserved words

//////////////////////////// primitives
16, 0x10, 0b0;               // int, (dec, hex or binary)
true=0b1, false=0b0;         // alias booleans (not provided by default)
16.0, .1, 1e3, 2e-3;         // floats
"abc", "\x12";               // strings (ascii and utf8 notations)
'path/to/my/file';           // imports, atoms

//////////////////////////// units
1k = 1000; 1pi = 3.1415;     // define units
1s = 44100; 1ms = 1s/1000;   // useful for sample indexes
10.1k, 2pi;                  // any numbers get converted to floats
1h2m3s, 4.5s;                // permits combinations

//////////////////////////// ranges
1..10;                       // basic range
1.., ..10;                   // open ranges
10..1;                       // reverse-direction range
1.08..108.0;                 // float range
0>..10, 0..<10, 0>..<10;     // non-inclusive ranges
(x-1)..(x+1);                // calculated ranges
-10..10[];                   // length (20)

//////////////////////////// standard operators
+ - * / % **                // arithmetical (** for pow)
&& || !                     // logical
& | ^ ~                     // int / binary ops
== != >= <=                 // comparisons

//////////////////////////// type cast
1/3; 2*3.14;                // ints upgrade to floats implicitly
3.0 | 0;                    // floats floor to ints explicitly

//////////////////////////// clamp operator
x <- 0..10;                  // clamp(x, 0, 10)
x <- ..10;                   // min(x, 10)
x <- 0..;                    // max(0, x)
x <-= 0..10;                 // x = clamp(x, 0, 10)

//////////////////////////// length operator
[1,2,3][];                   // 3
(1,2,3)[];                   // 3
"abc"[];                     // 3
-1..+2[];                    // 3

//////////////////////////// groups
a, b, c;                    // groups are syntactic sugar, not data type
(a, b, c)++;                // they apply operation to multiple elements: (a++, b++, c++)
(a, (b, c)) == a, b, c;     // groups are always flat
a,b,c = d,e,f;              // assign: a=d, b=e, c=f
a,b = b,a;                  // swap: temp=a; a=b; b=temp;
(a,b) + (c,d);              // operations: (a+c, b+d)
(a,b).x;                    // (a.x, b.x);
(a,b).x();                  // (a.x(), b.x());
a,b,c = (d,e,f);            // a=d, b=e, c=f
(a,b,c) = d;                // a=d, b=d, c=d
a = b,c,d;                  // a=b, a=c, a=d

//////////////////////////// strings
hi="hello";                 // strings can use "quotes"
string="%hi world";         // interpolated string: "hello world"
string[1]; string.1;        // positive indexing from first element [0]: 'e'
string[-3];                 // negative indexing from last element [-1]: 'r'
string[2..10];              // substring
string[1, 2..10, -1];       // slice/pick multiple elements
string[-1..0];              // reverse
string[];                   // length
string == string;           // comparison (==,!=,>,<)
string + string;            // concatenation: "hello worldhello world"
string - string;            // removes all occurences of the right string in the left string: ""
string / string;            // split: "a b" / " " = ["a", "b"]
string * list;              // join: " " * ["a", "b"] = "a b"
string ~> "l";              // indexOf: 2
string <~ "l";              // rightIndexOf: -2

//////////////////////////// lists
list = [l:2, r:4, c:6, 8];  // list from elements (with aliases)
list = [0..10];             // list from range
list = [0..8 | i -> i*2];   // list comprehension
list = [list1, list2];      // list concat (always flat)
list.0, list.1, list.2;     // short index access notation
list.l = 2;                 // alias index access
list[0];                    // positive indexing from first element [0]: 2
list[-2]=5;                 // negative indexing from last element [-1]: list becomes [2,4,5,8]
list[];                     // length
list[1..3, 5]; list[5..];   // slice
list[-1..0];                // reverse
list | x -> x * 2;          // iterate/map items
list ~> item;               // find index of the item
list <~ item;               // rfind

//////////////////////////// statements
foo();                      // semi-colons at end of line are mandatory
(c = a + b; c);             // parens define block, return last element
(a=b+1; a,b,c);             // block can return group
(a ? ^b; c);                // return/break operator can preliminarily return value
(foo(); bar(););            // semi-colon after last statement returns void

//////////////////////////// conditions
sign = a < 0 ? -1 : +1;     // inline ternary
(2+2 >= 4) ?                // multiline ternary
  log("Math works!")        //
: "a" < "b" ?               // else if
  log("Sort strings")       //
: (                         // else
  log("Get ready");         //
  log("Last chance")        //
);                          //
                            //
a > b ? b++;                // if operator
a > b ?: b++;               // elvis operator (else if)

//////////////////////////// loops
s = "Hello";                    //
(s[] < 50) -< (s += ", hi");    // inline loop: `while (s.length < 50) s += ", hi"`
                                //
(i=10; i-- > 1 -< (             // multiline loop
  i < 3 ? ^^;                   // `^^` to break loop (can return value as ^^x)
  i < 5 ? ^;                    // `^` to continue loop (can return value as ^x)
  log(i);                       //
));                             //
                                //
a0,a1,a2 = (i=0; i++ < 2 -< i); // loop creates group as result: a0=0, a1=1, a2=2
[j++ < 10 -< x * 2];            // list comprehension via loop

//////////////////////////// functions
double = n -> n*2;          // inline function
triple = (n=1) -> (         // optional args
  n == 0 ? ^n;              // preliminarily return n
  n*3                       // returns last value
);
triple();                   // 3
triple(5);                  // 15
triple(n: 10);              // 30. named argument.
copy = triple;              // capture function
copy(10);                   // also 30
clamp = (v <- 0..100) -> v; // clamp argument
x = () -> 1,2,3;            // return group (multiple values)
gain = ([]in, amp) -> in*amp;          // list argument
gain = ([1024]in, amp) -> in*amp;      // sublist argument

//////////////////////////// stateful variables
a = () -> ( *i=0; i++ );             // stateful variable persist value between fn calls
a(), a();                            // 0, 1
b = () -> ( *[4]i; i.0=i.1+1; i.0 ); // memory size with past state access
b(), b(), b();                       // 1, 2, 3

///////////////////////////// map
[a, b, c] | x -> a(x);      // maps list to new list
(a, b, c) | a -> a.x * 2;   // unfolds group to constructs
10..1 | i -> (              // iteration over range (produces group)
  i < 3 ? ^^;               // `^^` breaks iteration
  i < 5 ? ^;                // `^` continues iteration
);                          // returns group
[ 1..10 | x -> x * 2 ];     // list comprehension

///////////////////////////// fold
items >- (sum, x) -> sum+x;   // fold operator with reducer
(a, b, c) >- (a, b) -> a + b; // can be applied to groups (syntax sugar)
[a, b, c] >- (a, b) -> a + b; // can be applied to lists

//////////////////////////// import
@ './path/to/module';        // any file can be imported directly
@ 'math';                    // or defined via import-maps.json
@ 'my-module#x,y,z';         // import selected members

//////////////////////////// export
x, y, z                      // last members in a file get exported (no semi!)
```


## Examples

### Gain Processor

Provides k-rate amplification of input audio.

```fs
gain = ([]input, volume <- 0..100) -> input * volume;

gain([0,.1,.2,.3,.4,.5], 2); // [0,.2,.4,.6,.8,1]
```

Features:

* _block input/output_ − `[]` prefix indicates array argument (usually <em title="Audio, or precise rate">a-rate*</em> input/param); direct argument can be used for <em title="Controlling (historical artifact from CSound), blocK-rate">k-rate*</em> param.
* _validation_ − `a <- range` (_a ∈ range_) clamps argument to provided range, to avoid blowing up values.
* _range_ − primitive with `from..to` signature, useful to clamp value.


### Biquad Filter

Biquad filter processor for single-channel input.

```fs
@ 'math#pi,cos,sin';

1pi = pi;                     // define pi units
1s = 44100;                   // define time units in samples
blockLen = 1024;

lp = ([blockLen]x, freq = 100 <- 1..10000, Q = 1.0 <- 0.001..3.0) -> (
  *x1, *x2, *y1, *y2 = 0;     // state

  w = 2pi * freq / 1s;
  sin_w, cos_w = sin(w), cos(w);
  a = sin_w / (2.0 * Q);

  b0, b1, b2 = (1.0 - cos_w) / 2.0, 1.0 - cos_w, b0;
  a0, a1, a2 = 1.0 + a, -2.0 * cos_w, 1.0 - a;

  b0, b1, b2, a1, a2 *= 1.0 / a0;

  // produce output block
  x | x0 -> (
    y0 = b0*x0 + b1*x1 + b2*x2 - a1*y1 - a2*y2;

    x1, x2 = x0, x1;
    y1, y2 = y0, y1;

    y0
  )
)
```

Features:

* _import_ − done via URI string as `@ 'path/to/lib'`. Members can be imported as `@ 'path/to/lib#a,b,c'`. <!-- Built-in libs are: _math_, _std_. Additional libs: _sonr_, _latr_, _musi_ and [others]().--> _import-map.json_ can provide import aliases.
* _state variables_ − `*state=init` persists value between <span title="Detected by callsite">function calls*</span>.
* _groups_ − comma enables group operations as `a,b = c,d` === `a=c, b=d`, `(a,b) + (c,d)` === `(a+b, c+d)` etc.
* _scope_ − parens `()` besides precedence can indicate function body; returns last element or group.
* _functions_ − arrow syntax `(arg1, arg2) -> (expr1; expr2)` defines a function.
* _export_ – last element in a file is automatically exported (`lp`).

### ZZFX

Consider [coin sound](https://codepen.io/KilledByAPixel/full/BaowKzv):
> `zzfx(...[,,1675,,.06,.24,1,1.82,,,837,.06])`

```fs
@ 'math';

1pi = pi;
1s = 44100;

oscillator = [
  saw: phase -> [1 - 4 * abs( round(phase/2pi) - phase/2pi )],
  sine: phase -> [sin(phase)];
];

adsr = (x, a, d, (s, sv=1), r) -> (
  *i = 0;
  t = i++ / 1s;

  a = a <- 0.0001..;                // prevent click
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
curve = (x, amt=1.82 <- 0..10) -> (sign(x) * abs(x)) ** amt;

// coin = triangle with pitch jump
coin = (freq=1675, jump=freq/2, delay=0.06, shape=0) -> (
  *i=0, *phase=0;

  t = i++ / 1s;
  phase += (freq + t > delay ? jump : 0) * 2pi / 1s;

  oscillator[shape](phase) | x -> adsr(x, 0, 0, .06, .24) | x -> curve(x, 1.82)
);
```

Features:

<!-- * _groups_ − groups are just syntax sugar and are always flat, ie. `a, d, (s, sv), r` == `a, d, s, sv, r`. They're desugared on compilation stage. -->
* _units_ – define number multipliers as `1<unit> = <number>`. Units decompose to numbers on compiling stage.
* _pipes_ − `|` operator is overloaded for functions as `a | b` → `b(a)`.
* _arrays_ − flat collection of same-type elements: numbers or functions. Unlike groups, arrays are primitives and stored in memory.
* _named members_ − group or array members can get alias as `[foo: a, bar: b]`.

<!--

## [Freeverb](https://github.com/opendsp/freeverb/blob/master/index.js)

```fs
@ './combfilter.son#comb';
@ './allpass.son#allpass'
@ 'math';

1s = 44100;

a1,a2,a3,a4 = 1116,1188,1277,1356;
b1,b2,b3,b4 = 1422,1491,1557,1617;
p1,p2,p3,p4 = 225,556,441,341;

// TODO: stretch

reverb = ([]input, room=0.5, damp=0.5) -> (
  *combs_a = a0,a1,a2,a3 | stretch,
  *combs_b = b0,b1,b2,b3 | stretch,
  *aps = p0,p1,p2,p3 | stretch;

  combs = (
    (combs_a | x -> comb(x, input, room, damp) >- (a,b) -> a+b) +
    (combs_b | x -> comb(x, input, room, damp) >- (a,b) -> a+b)
  );

  (combs, aps) >- (input, coef) -> p + allpass(p, coef, room, damp)
);
```

Features:

* _multiarg pipes_ − pipe can consume groups. Depending on arity of target it can act as convolver: `a,b,c | (a,b) -> a+b` becomes  `(a,b | (a,b)->a+b), (b,c | (a,b)->a+b)`.
* _fold operator_ − `a,b,c >- fn` acts as `reduce(a,b,c, fn)`, provides efficient way to reduce a group or array to a single value.

-->

## [Floatbeat](https://dollchan.net/bytebeat/index.html#v3b64fVNRS+QwEP4rQ0FMtnVNS9fz9E64F8E38blwZGvWDbaptCP2kP3vziTpumVPH0qZyXzfzHxf8p7U3aNJrhK0rYHfgHAOZZkrlVVu0+saKbd5dTXazolRwnvlKuwNvvYORjiB/LpyO6pt7XhYqTNYZ1DP64WGBYgczuhAQgpiTXEtIwP29pteBZXqwTrB30jwc7i/i0jX2cF8g2WIGKlhriTRcPjSvcVMBn5NxvgCOc3TmqZ7/IdmmEnAMkX2UPB3oMHdE9WcKqVK+i5Prz+PKa98uOl60RgE6zP0+wUr+qVpZNsDUjKhtyLkKvS+LID0FYVSrJql8KdSMptKKlx9eTIbcllvdf8HxabpaJrIXEiycV7WGPeEW9Y4v5CBS07WBbUitvRqVbg7UDtQRRG3dqtZv3C7bsBbFUVcALvwH86MfSDws62fD7CTb0eIghE/mDAPyw9O9+aoa9h63zxXl2SW/GKOFNRyxbyF3N+FA8bPyzFb5misC9+J/XCC14nVKfgRQ7RY5ivKeKmmjOJMaBJSbEZJoiZZMuj2pTEPGunZhqeatOEN3zadxrXRmOw+AA==)

Transpiled floatbeat/bytebeat song:

```fs
@'math';

sampleRate = 44100;

fract = (x) -> x % 1;
mix = (a, b, c) -> (a * (1 - c)) + (b * c);
tri = (x) -> 2 * asin(sin(x)) / pi;
noise = (x) -> sin((x + 10) * sin((x + 10) ** (fract(x) + 10)));
melodytest = (time) -> (
  melodyString = "00040008",
  melody = 0;
  i = 0;

  i++ < 5 -< (
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
);
```

Features:

* _loop operator_ − `cond -< expr` acts as _while_ loop, calling expression until condition holds true. Produces sequence as result.
* _string literal_ − `"abc"` acts as array with ASCII codes.
* _length operator_ − `items[]` returns total number of items of either an array, group, string or range.



## Alternatives

* [mono](https://github.com/stagas/mono)
* [soul](https://github.com/soul-lang/SOUL/blob/master/docs/SOUL_Language.md)
* [elementary/audio](https://www.elementary.audio/docs/guides/Making_Sound)


<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
