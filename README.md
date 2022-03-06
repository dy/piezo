# sonelang

> Sound language compiling to WASM

Soundscript is designed to be useful for writing sound formulas / audio processing code for various target environments, such as: [AudioWorkletProcessor](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process), [web-audio-api](https://github.com/audiojs/web-audio-api), individual audio nodes etc. Inspired by [bytebeat](https://github.com/greggman/html5bytebeat), [zzfx](https://github.com/KilledByAPixel/ZzFX), [fundsp](https://github.com/SamiPerttu/fundsp), [hxos](https://github.com/stagas/hxos) and others.

## Goals

* familiar & intuitive syntax.
* fluent & expressive.
* radically minimal & performant.
* 0 runtime, types predictable in advance, static memory.
* compiling to wasm.

<!--
## Use cases

- describing sounds with tiny footprint (copy-pasteable string);
- reproducing synthesizers;
- alternative to heavy soundfonts ([like this](https://magenta.github.io/magenta-js/music/index.html#soundfonts));
- variable sounds (by analogy with [variable fonts](https://en.wikipedia.org/wiki/Variable_font)) − in reality sounds _are_ variable;
- fun.
-->

<!-- * drop `source | filter() | reverb() | fx()` and get controls with defaults; changing controls changes values; -->

## Examples

[ZZFX Coin](https://codepen.io/KilledByAPixel/full/BaowKzv): `zzfx(...[,,1675,,.06,.24,1,1.82,,,837,.06])`

```son
import pow, sign, round, abs, max, pi, inf from 'math'

pi2 = pi*2
sampleRate = 44100

// triangle oscillator
tri(freq in 10..10000) = (
  ...phase = 0                      // phase state
  phase += freq * pi2 / sampleRate
  (1 - 4 * abs( round(phase/pi2) - phase/pi2 ))
)

// adsr weighting
x | adsr(a, d, s, r=1) = (
  ...i=0, t=i++/sampleRate

  a = max(a, 0.0001)                 // prevent click
  total = a + d + s + r

  t >= total ? 0 : x * (
    t < a ? t/a :                    // attack
    t < a + d ?                      // decay
    1-((t-a)/d)*(1-sv) :             // decay falloff
    t < a  + d + s ?                 // sustain
    sv :                             // sustain volume
    (total - t)/r * sv
  )
)

// curve effect
x | curve(amt=1.82 in 0..10, #in) = pow(sign(x) * abs(x), amt)

// coin is triangle oscillator with pitch jump
coin(freq=1675, jump=freq/2, delay=0.06) = (
  ...i=0, t=i+=/sampleRate

  tri(freq + t>delay?jump:0) | adsr(0, 0, .06, .24) | curve(1.82)
)
```

## Features

* import, export
* groups, swizzles
* ranges
* operator overloading
* lambda
* reduce operator
* state management
* loop operator
* elvis operator
* disregard variable case
* minimum keywords
* autoscopes

