## Examples

# Filter

```son
import sin, cos, pi2 from 'math'

// by default input/params are a-rate
export lp(x0, freq = 100 in 1..1k, Q = 1.0 in 0.001..3.0) =
  ...x1, x2, y1, y2;

  w = pi2 * freq / #sampleRate;
  sin_w, cos_w = sin(w), cos(w);
  a = sin_w / (2.0 * Q);

  b0, b1, b2 = (1.0 - cos_w) / 2.0, 1.0 - cos_w, b0;
  a0, a1, a2 = 1.0 + a, -2.0 * cos_w, 1.0 - a;

  b0,b1,b2,a1,a2 *= 1.0 / a0;

  y0 = b0*x0 + b1*x1 + b2*x2 - a1*y1 - a2*y2;

  x1, x2 = x0, x1;
  y1, y2 = y0, y1;

  y0.

export lp(freq, Q) = lp(#input, freq, Q). // pipe alias

export default src -> src | lp(freq, Q) | amp(gain)
```

## Bytebeat drone

```
import sin, pow from 'math'

fract(x) = x % 1.
mix(a, b, c) = (a * (1 - c)) + (b * c).
noise(x) = sin((x + 10) * sin(pow(x + 10, fract(x) + 10))).
main(x) =
  time = #t / #sampleRate / 4;
  a = 0, j = 0;
  while (j++ < 13)
    a += sin((2100 + (noise((j + 2) + floor(time)) * 2500)) * time) *
    (1 - fract(time * floor(mix(1, 5, noise((j + 5.24) + floor(time))))));
  a / 9
.
```

## Subscript fragment

```
import err from 'stdlib'

skip(n=1, from=idx, l) = cur.slice(from, idx += n).
skip(fn, from=idx, l) = cond(cur.charCodeAt(idx)) && idx++; cur.slice(from, idx).

// a + b - c
expr = (prec=0, end, cc, token, newNode, fn) =>
  while (
    cc=space() ?
    newToken=(
      lookup[cc]?.(token, prec) ?:    // if operator with higher precedence isn't found
      !token ? lookup[0]()            // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
    )
  ) token = newToken;

  // check end character
  // FIXME: can't show "Unclose paren", because can be unknown operator within group as well
  end ? cc==end ? idx++ : err();

  token
.

// skip space chars, return first non-space character
space(cc) = while ((cc = cur.charCodeAt(idx)) <= SPACE) idx++; cc.

```

## AudioGain

```typescript
memory.grow(1);

export const INPUT_BUFFER_POINTER: i32 = 0;
export const INPUT_BUFFER_SIZE: i32 = 1024;
export const OUTPUT_BUFFER_POINTER: i32 = INPUT_BUFFER_POINTER + INPUT_BUFFER_SIZE;
export const OUTPUT_BUFFER_SIZE: i32 = INPUT_BUFFER_SIZE;

export function amplifyAudioInBuffer(): void {
  for (let i = 0; i < INPUT_BUFFER_SIZE; i++) {
    let audioSample: u8 = load<u8>(INPUT_BUFFER_POINTER + i);

    audioSample *= 2;

    // Store the audio sample into our output buffer
    store<u8>(OUTPUT_BUFFER_POINTER + i, audioSample);
  }
}
```

```son
gain(frame, amp=1 in 0..1 as aRate) = frame*amp.
```

## Delay


```
// opendsp version: https://github.com/opendsp/delay/blob/master/index.js

delay(delay in 1..10, feedback in 1..10) =
  ...size=512, buffer=[..size], count=0;

  back = count - delay * sampleRate;
  back < 0 ? back = size + back;
  i0, i_1, i1, i2 = floor(back), i0-1, i0+1, i0+2;

  i_1 < 0 ? i_1 = size - 1;
  i1 >= size ? i1 = 0;
  i2 >= size ? i2 = 0;

  y_1, y0, y1, y2 = buffer[i_1], buffer[i0], buffer[i1], buffer[i2];

  x = back - i0;

  c0, c1, c2, c3 = y0, 0.5 * (y1 - y_1), y_1 - 2.5 * y0 + 2.0 * y1 - 0.5 * y2, 0.5 * (y2 - y_1) + 1.5 * (y0 - y1);

  out = ((c3*x+c2)*x+c1)*x+c0;

  buffer[count] = input + output * feedback;

  ++count >= size ? count = 0;

  out.
```

## Oscillator

```
export sine(f=432 in 0..20k as kRate) = sin(f * t * 2pi).

export saw(f=432 in 0..20k as kRate) = 1 - 2 * (t % (1 / f)) * f.

export ramp(f) = 2 * (t % (1 / f)) * f - 1.

export tri(f) = abs(1 - (2 * t * f) % 2) * 2 - 1.

export sqr(f) = (t*f % 1/f < 1/f/2) * 2 - 1.

export pulse(f, w) = (t*f % 1/f < 1/f/2*w) * 2 - 1.

export noise() = rand() * 2 - 1.
```

## nopop

https://github.com/opendsp/nopop/blob/master/index.js
```
export ladder(threshold=.05, amount=.12) =
  ...next, prev
  diff=next-prev
  abs(diff) > threshold ? prev += diff * amount : prev = next
  prev.
```

## step

https://github.com/opendsp/step/blob/master/index.js

```
step(bpm, sig, offset=0) =
    ...offset = round((60 / bpm * 4) * sampleRate * offset),
    max = round((60 / bpm * 4) * sampleRate * sig),
    acc = 0, prev = 0

    frame += offset;
    acc = frame - prev;
    acc === 0 || acc === max ?
      prev = frame;
      acc = 0;
      1;
    :
      0;
    .

```

## envelope

```
import exp from 'math'

envelope(measure, decay, release) =
  ...t as time
  t / 4 % measure | v -> exp(-v.l * decay * exp(v.l * release)).
```

## [freeverb](https://github.com/opendsp/freeverb/blob/master/index.js)

See [fold](https://en.wikipedia.org/wiki/Fold_(higher-order_function)#In_various_languages) in different langs.

```rs
import comb from './combfilter'
import allpass from './allpass'
import floor from 'math'

a1,a2,a3,a4 = 1116,1188,1277,1356
b1,b2,b3,b4 = 1422,1491,1557,1617
p1,p2,p3,p4 = 225,556,441,341

sum(a, b) = a + b
waterfall(p, fn) = p + fn(p)
stretch(n, rate) = floor(n * rate / 44100)

Comb(coef) = input, room, damp -> comb(input, coef, room, damp)
Allpass(coef) = input, room, damp -> allpass(input, coef, room, damp)

export reverb(input, room=0.5 as kRate, damp=0.5 as kRate) = (
  ...rate as sampleRate
  ...combs_a = a0,a1,a2,a3 | a-> stretch(a, rate) | Comb
  ...combs_b = b0,b1,b2,b3 | b-> stretch(b, rate) | Comb
  ...aps = p0,p1,p2,p3 | p-> stretch(p, rate) | Allpass

  output = combs_a(input, room, damp) >- sum + combs_b(input, room, damp) >- sum
  (output, aps) >- waterfall
).
```

## dynamic processor

```
```

# Extra

* [BitCrusher](https://github.com/jaz303/bitcrusher)
* [ogg decoder](https://en.wikipedia.org/wiki/HTML5_audio#Supported_audio_coding_formats)
