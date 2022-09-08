# lino

**Lino** (*li*ne *no*ise) is audio/sound processing language for expressing sound formulas in short, fluent and intuitive form. Primarily targets [AudioWorkletProcessor](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process), [audio engines](https://github.com/audiojs/web-audio-api), etc.

[Motivation](./docs/motivation.md)  |  [Documentation](./docs/reference.md)  |  [Examples](./docs/examples.md).

## Intro

_Lino_ operates in audio block processing context: functions take either current sample or param arguments and may have internal state persisted between calls. That compiles to optimized bytecode (WASM) that is called for blocks of samples.

Let's consider examples.

### Gain Processor

Provides k-rate amplification of mono, stereo or generic input.

```fs
range = 0..1000;

// mono clause
gain1([left], volume <- range) = [left * volume];

// stereo clause
gain2([left, right], volume <- range) = [left * volume, right * volume];

// multi-channel clause
gain([..channels], volume <- range) = [..channels * volume].
```

Generally multi-channel case is enough, but mono/stereo clauses provide shortcuts for <span title="Autogenerating clauses from generic case would cause O(c^n) code size grow depending on number/type of arguments. So manual clauses is lower tax and allows better control over output.">better  performance*</span>.

Features:

<!-- * _function overload_ − function clause is matched by call signature in <span title="On export each clause gets name extension as gain_1a_1k, gain_2a_1k etc.">compile-time*</span>. -->
* _input/output_ − `[left]` for mono, `[left, right]` for stereo, `[..channels]` for any number of <span title="Output channels must be explicitly indicated as [], otherwise single value is returned.">channels*</span>.
* _params as arguments_ − direct `arg` indicates <em title="Controlling (historical artifact from CSound), blocK-rate">k-rate*</em> param, which value is fixed for full block, channeled `[arg]` indicates <em title="Audio, or precise rate">a-rate*</em> param.
* _range_ − is language-level primitive with `from..to` signature. Useful in arguments validation, array initialization etc.
* _validation_ − `a <- range` (_a ∈ range_, _a in range_) asserts and clamps argument to provided range, to avoid blowing up volume.
<!-- * _destructuring_ − collects array or group members as `[a,..bc] = [a,b,c]`. -->

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

* _import_ − done via URI string as `@ 'path/to/lib'`. Members can be indicated with hash as `@ 'path/to/lib#a,b,c'`. <!-- Built-in libs are: _math_, _std_. Additional libs: _sonr_, _latr_, _musi_ and [others]().--> _import-map.json_ can provide import aliases.
<!-- * _scope_ − parens `()` can define function body, besides expression groups. -->
* _state variables_ − `*state=init` persist value between <span title="Detected by callsite">function calls*</span>.
* _groups_ − comma enables group operations as `a,b = c,d` === `a=c, b=d`, `(a,b) + (c,d)` === `(a+b, c+d)` etc.
* _end operator_ − `.` indicates return statement or module exports.

### ZZFX

Full ZZFX is available in examples, we consider only [coin sound](https://codepen.io/KilledByAPixel/full/BaowKzv):
> `zzfx(...[,,1675,,.06,.24,1,1.82,,,837,.06])`

```fs
@ 'math';

pi2 = pi*2;
sampleRate = 44100;

// waveshape generators
oscillator = [
  saw: phase -> [1 - 4 * abs( round(phase/pi2) - phase/pi2 )],
  sine: phase -> [sin(phase)]
];

// adsr weighting
adssr(x, a, d, (s, sv), r) = (
  *i = 0;
  t = i++ / sampleRate;

  a = max(a, 0.0001);            // prevent click
  total = a + d + s + r;

  y = t >= total ? 0 : (
    t < a ? t/a :                // attack
    t < a + d ?                  // decay
    1-((t-a)/d)*(1-sv) :         // decay falloff
    t < a  + d + s ?             // sustain
    sv :                         // sustain volume
    (total - t)/r * sv
  ) * x;

  y.
);
adsr(x, a, d, s, r) = adssr(x, a, d, (s, 1), r);   // no-sv alias

// curve effect
curve(x, amt=1.82 <- 0..10) = (sign(x) * abs(x)) ** amt;

// coin = triangle with pitch jump
coin(freq=1675, jump=freq/2, delay=0.06, shape=0) = (
  *i=0, *phase=0;

  t = i++/sampleRate;
  phase += (freq + t > delay ? jump : 0) * pi2 / sampleRate;

  oscillator[shape](phase) | adsr(^, 0, 0, .06, .24) | curve(^, 1.82).
).
```

Features:

<!-- * _groups_ − groups are just syntax sugar and are always flat, ie. `a, d, (s, sv), r` == `a, d, s, sv, r`. They're desugared on compilation stage. -->
<!-- * _function overload_ − function clause is matched by call signature in <span title="On export each clause gets name extension as gain_1a_1k, gain_2a_1k etc.">compile-time*</span>. -->
* _pipes_ − `|` operator is overloaded for functions as `a | b` → `b(a)`.
* _partial function application_ − `?` after function argument indicates that function allows partial call creating curried function, that's useful for pipeline.
* _arrays_ − linear collection of elements: numbers, functions or other arrays. Unlike groups, elements are stored in memory.
* _named members_ − group or array members can get alias as `[foo: a, bar: b]`.

## [Freeverb](https://github.com/opendsp/freeverb/blob/master/index.js)

```fs
@ './combfilter.son#comb';
@ './allpass.son#allpass'
@ 'math';

sampleRate = 44100;

a1,a2,a3,a4 = 1116,1188,1277,1356;
b1,b2,b3,b4 = 1422,1491,1557,1617;
p1,p2,p3,p4 = 225,556,441,341;

stretch(n) = floor(n * sampleRate / 44100);

reverb([..input], room=0.5, damp=0.5) = (
  *combs_a = a0,a1,a2,a3 | stretch(^),
  *combs_b = b0,b1,b2,b3 | stretch(^),
  *aps = p0,p1,p2,p3 | stretch(^);

  (
    (combs_a | comb(^, input, room, damp) >- (a,b) -> a+b) +
    (combs_b | comb(^, input, room, damp) >- (a,b) -> a+b)
  ) |
  (^, aps) >- (input, coef) -> p + allpass(^, p, coef, room, damp).
).
```

Features:

* _lambda functions_ − useful for organizing inline pipe transforms `a | a -> a * 2`, reducers etc.
* _topic operator_ −  `^` refers to result of last expression in pipeline. It is syntactic sugar and unwrapped as arrow function in compilation stage: `x | ^+1` becomes `x | a -> a+1`.
* _multiarg pipes_ − pipe can consume multiple arguments. Depending on arity of target it can act as convolver: `a,b,c | (a,b) -> a+b` becomes  `(a,b | (a,b)->a+b), (b,c | (a,b)->a+b)`.
* _fold operator_ − `a,b,c >- fn` acts as `reduce(a,b,c, fn)`, provides efficient way to reduce a group or array to a single value.



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
  (i++ < 5) -< (
    melody += tri(
      time * mix(
        200 + (i * 900),
        500 + (i * 900),
        melodyString[floor(time * 2) % #melodyString] / 16
      )
    ) * (1 - fract(time * 4))
  );

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

* _loop operator_ − `cond -< expr` acts as _while_ loop, calling expression until condition holds true. Also used in list comprehension as `[i <- 0..10 -< i*2]`.
* _string literal_ − `"abc"` acts as array with ASCII codes.
* _cardinal (length) operator_ − `#items` returns number of items of either an array, a string or a group.

## Language Reference

...Coming


## Alternatives

* [mono](https://github.com/stagas/mono)
* [soul](https://github.com/soul-lang/SOUL/blob/master/docs/SOUL_Language.md)
* [elementary/audio](https://www.elementary.audio/docs/guides/Making_Sound)


<p align=center><a href="https://github.com/krsnzd/license/">🕉</a></p>
