# lino

> Lino (**Li**ne **no**ise is sound language compiling to WASM

_Line noise_ is designed primarily for writing sound formulas / audio processing code for various audio targets, such as [AudioWorkletProcessor](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process), [audio engines](https://github.com/audiojs/web-audio-api), individual audio nodes etc. But can be extended to non-audio environments.

[Motivation](./docs/motivation.md)

## Examples

### Gain

Gain processor, providing k-rate amplification of mono, stereo or generic input.

```fs
range = 0..1000;

gain([left], volume <- range) = [left * volume];
gain([left, right], volume <- range) = [left * volume, right * volume];
gain([..channels], volume <- range) = [..channels * volume];
```

Mono/stereo clauses inform the compiler to provide shortcuts for better performance. Generally multi-channel case is enough.

Features:

* _function overload_ − function clause is matched by call signature.
* _channeled_ input/output − `[left]` for mono, `[left, right]` for stereo, `[..channels]` for any number of input channels<strong title="Note that channels is a group, not array, so output must be explicit array.">*</strong>.
* _a-rate_/_k-rate param type_ − `[arg]` indicates <em title="Accurate, or audio-rate">a-rate</em> param passed as block, direct `arg` param is <em title="Controlling (historical artifact from CSound), ie. block-rate">k-rate</em>, passed as direct value per-block.
* _range_ − is language-level primitive with `from..to`, `from..<to`, `from>..to` signature, useful in arguments validation, array initialization etc.
* _validation_ − `a <- range` (`a` in `range`) asserts and clamps argument to provided range, to avoid blowing up volume.
* _destructuring_ − collects array or group members as `[a,..bc] = [a,b,c]`.

### Biquad Filter

Biquad filter processor for single-channel input.

```fs
@ 'math#pi,cos,sin';

pi2 = pi*2;
sampleRate = 44100;

lp([x0], freq = 100 <- 1..10000, Q = 1.0 <- 0.001..3.0) = (
  *x1, *x2, *y1, *y2 = 0;    // state

  w = pi2 * freq / sampleRate;
  sin_w, cos_w = sin(w), cos(w);
  a = sin_w / (2.0 * Q);

  b0, b1, b2 = (1.0 - cos_w) / 2.0, 1.0 - cos_w, b0;
  a0, a1, a2 = 1.0 + a, -2.0 * cos_w, 1.0 - a;

  b0, b1, b2, a1, a2 *= 1.0 / a0;

  y0 = b0*x0 + b1*x1 + b2*x2 - a1*y1 - a2*y2;

  x1, x2 = x0, x1;
  y1, y2 = y0, y1;

  [y0].
).
```

Features:

* _import_ − organized via `@ 'lib'` or `@ 'path/to/lib#a,b,c'`. If import members `#a,b,c` are not provided, it imports everything. Built-in libs are: _math_, _std_. Additional libs: _sonr_, _latr_, _musi_ and [others]().
* _block scope_ − parens `()` may act as block scope, like one-line arrow functions in JS.
* _state variables_ − defined as `*state=initValue`, persist value between fn calls. Like language-level react hooks.
* _grouping_ − comma operator allows bulk operations on multiple operands, eg. `a,b = c,d` → `a=c, b=d`, `(a,b) + (c,d)` → `(a+b, c+d)` etc.
* _end operator_ − `.` indicates return statement or module exports.

### [ZZFX Coin](https://codepen.io/KilledByAPixel/full/BaowKzv)

> `zzfx(...[,,1675,,.06,.24,1,1.82,,,837,.06])`:

```fs
@ 'math';

pi2 = pi*2;
sampleRate = 44100;

// waveshape generators
oscillator = (
  saw: phase -> [1 - 4 * abs( round(phase/pi2) - phase/pi2 )],
  sine: phase -> [sin(phase)]
);

// adsr weighting
adsr(x, a, d, (s, sv), r) = (
  *i=0;
  t=i++/sampleRate;

  a = max(a, 0.0001);                // prevent click
  total = a + d + s + r;

  t >= total ? 0 : x * (
    t < a ? t/a :                    // attack
    t < a + d ?                      // decay
    1-((t-a)/d)*(1-sv) :             // decay falloff
    t < a  + d + s ?                 // sustain
    sv :                             // sustain volume
    (total - t)/r * sv
  ).
);
adsr(x, a, d, s, r) = adsr(x, a, d, (s, 1), r);   // no-sv alias
adsr(a, d, s, r) = x -> adsr(x, a, d, s, r);      // pipe

// curve effect
curve(x, amt=1.82 <- 0..10) = (sign(x) * abs(x)) ** amt;
curve(amt) = x -> curve(x, amt);

// coin = triangle with pitch jump
coin(freq=1675, jump=freq/2, delay=0.06, shape=0) = (
  *i=0, *phase=0;

  t = i++/sampleRate;
  phase += (freq + t > delay ? jump : 0) * pi2 / sampleRate;

  oscillator[shape](phase) | adsr(0, 0, .06, .24) | curve(1.82).
).
```

Features:

* _pipes_ − `|` operator is overloaded as function call for function types, `a | b` → `b(a)`.
* _lambda functions_ − useful for organizing pipe transforms. <!-- Don't require parens for arguments, since `,` has higher precedence than `->`.-->
* _named members_ − group members can get alias names as `(foo: a, bar: b)`.
<!-- * _arrays_ − linear collection of same-type elements with fixed size. Useful for organizing enums, dicts, buffers etc. Arrays support alias name for items: `a = [first: 1, second: 2]` → `a[0] == a.first == 1`. -->

## [Freeverb](https://github.com/opendsp/freeverb/blob/master/index.js)

```fs
@ './combfilter.son';
@ './allpass.son'
@ 'math';

sampleRate = 44100;

a1,a2,a3,a4 = 1116,1188,1277,1356;
b1,b2,b3,b4 = 1422,1491,1557,1617;
p1,p2,p3,p4 = 225,556,441,341;

stretch(n) = floor(n * sampleRate / 44100);
sum(a, b) = a + b;

reverb([..input], room=0.5, damp=0.5) = (
  *combs_a = a0,a1,a2,a3 | stretch,
  *combs_b = b0,b1,b2,b3 | stretch,
  *aps = p0,p1,p2,p3 | stretch;

  // combs_a.pipe(a -> comb(a,input,room,damp)).reduce(sum)
  combs_a | a -> comb(a, input, room, damp) >- sum +
  combs_b | a -> comb(a, input, room, damp) >- sum;

  ^, aps >- input, coef -> p + allpass(p, coef, room, damp).
).
```

Features:

* _multiarg pipes_ − pipe transforms can be applied to multiple arguments; also pipe accounts for transformer number of arguments. <!--(similar to jQuery style).-->
* _fold operator_ − `a,b,c >- fn` acts as `reduce((a,b,c), fn)`, provides efficient way to fold a group or an array to a single value.
* _topic operator_ −  `^` refers to result of last expression, to be joined in flow fashion without intermediary variables. <!--(that's similar to [Hack pipeline](https://docs.hhvm.com/hack/expressions-and-operators/pipe) or [JS pipeline](https://github.com/tc39/proposal-pipeline-operator), without special operator).-->

## [Floatbeat](https://dollchan.net/bytebeat/index.html#v3b64fVNRS+QwEP4rQ0FMtnVNS9fz9E64F8E38blwZGvWDbaptCP2kP3vziTpumVPH0qZyXzfzHxf8p7U3aNJrhK0rYHfgHAOZZkrlVVu0+saKbd5dTXazolRwnvlKuwNvvYORjiB/LpyO6pt7XhYqTNYZ1DP64WGBYgczuhAQgpiTXEtIwP29pteBZXqwTrB30jwc7i/i0jX2cF8g2WIGKlhriTRcPjSvcVMBn5NxvgCOc3TmqZ7/IdmmEnAMkX2UPB3oMHdE9WcKqVK+i5Prz+PKa98uOl60RgE6zP0+wUr+qVpZNsDUjKhtyLkKvS+LID0FYVSrJql8KdSMptKKlx9eTIbcllvdf8HxabpaJrIXEiycV7WGPeEW9Y4v5CBS07WBbUitvRqVbg7UDtQRRG3dqtZv3C7bsBbFUVcALvwH86MfSDws62fD7CTb0eIghE/mDAPyw9O9+aoa9h63zxXl2SW/GKOFNRyxbyF3N+FA8bPyzFb5misC9+J/XCC14nVKfgRQ7RY5ivKeKmmjOJMaBJSbEZJoiZZMuj2pTEPGunZhqeatOEN3zadxrXRmOw+AA==)

Transpiled floatbeat/bytebeat song:

```fs
@ 'math';

sampleRate = 44100;

fract(x) = x % 1;
mix(a, b, c) = (a * (1 - c)) + (b * c);
tri(x) = 2 * asin(sin(x)) / pi;
noise(x) = sin((x + 10) * sin((x + 10) ** (fract(x) + 10)));
melodytest(time) = (
	melodyString = "00040008",
	melody = 0;
	i = 0;
  i++ < 5 -<
    melody += tri(
      time * mix(
        200 + (i * 900),
        500 + (i * 900),
        melodyString[floor(time * 2) % melodyString.length] / 16
      )
    ) * (1 - fract(time * 4));
	melody.
)
hihat(time) = noise(time) * (1 - fract(time * 4)) ** 10;
kick(time) = sin((1 - fract(time * 2)) ** 17 * 100);
snare(time) = noise(floor((time) * 108000)) * (1 - fract(time + 0.5)) ** 12;
melody(time) = melodytest(time) * fract(time * 2) ** 6 * 1;

song() = (
  *t=0; time = t++ / sampleRate;
  [(kick(time) + snare(time)*.15 + hihat(time)*.05 + melody(time)) / 4].
).
```

Features:

* _loop operator_ − `cond -< expr` acts as _while_ loop, calling expression until condition holds true. Used in list comprehension as `[x <- 0..10 -< x*2]`.
* _string literal_ − `"abc"` acts as array with ASCII codes.


## Language Reference

...Coming


## Alternatives

* [mono](https://github.com/stagas/mono)
* [soul](https://github.com/soul-lang/SOUL/blob/master/docs/SOUL_Language.md)
* [elementary/audio](https://www.elementary.audio/docs/guides/Making_Sound)


<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
