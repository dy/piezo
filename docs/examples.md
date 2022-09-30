## Examples

# Filter

```fs
@ 'math#sin,cos,pi';
@ 'latr#amp';

pi2 = pi*2;

// by default input/params are a-rate
lp([x0], freq = 100 <- 1..1k, Q = 1.0 <- 0.001..3.0) = (
  *(x1, x2, y1, y2);

  w = pi2 * freq / sampleRate;
  sin_w, cos_w = sin(w), cos(w);
  a = sin_w / (2.0 * Q);

  b0, b1, b2 = (1.0 - cos_w) / 2.0, 1.0 - cos_w, b0;
  a0, a1, a2 = 1.0 + a, -2.0 * cos_w, 1.0 - a;

  b0, b1, b2, a1, a2 *= 1.0 / a0;

  y0 = b0*x0 + b1*x1 + b2*x2 - a1*y1 - a2*y2;

  x1, x2 = x0, x1;
  y1, y2 = y0, y1;

  [y0]
);

default([..ch], gain) = ch | lp(freq, Q) | amp(gain).
```

## Bytebeat drone

```fs
@ 'math#sin';

sampleRate = 44100;

fract(x) = x % 1;
mix(a, b, c) = (a * (1 - c)) + (b * c);
noise(x) = sin((x + 10.0) * sin((x + 10.0) ** fract(x) + 10.0));
main(x) = (
  *t=0; time = ++t / sampleRate / 4.0;
  a = 0, j = 0;
  j++ < 13 -<
    a += sin((2100 + (noise((j + 2) + floor(time)) * 2500)) * time) *
    (1 - fract(time * floor(mix(1, 5, noise((j + 5.24) + floor(time))))));

  a / 9.0.
).
```

## Subscript fragment

```fs
@ 'std#err';

skip(n=1, from=idx, l) = cur[from..(idx+=n)];
skip(fn, from=idx, l) = ( cond(cur[idx]) ? idx++; cur.slice(from, idx) );

// a + b - c
expr = (prec=0, end, cc, token, newNode, fn) => (
  cc=space() ?
  newToken=(
    lookup[cc]?.(token, prec) ||    // if operator with higher precedence isn't found
    !token && lookup[0]()            // parse literal or quit. token seqs are forbidden: `a b`, `a "b"`, `1.32 a`
  )
  -< token = newToken;

  // check end character
  // FIXME: can't show "Unclose paren", because can be unknown operator within group as well
  end && cc==end ? idx++ : err();

  token.
);

// skip space chars, return first non-space character
space(cc) = ((cc = cur.charCodeAt(idx)) <= SPACE -< idx++; cc).

```

## AudioGain

```fs
gain(frame, amp=1 <- 0..1) = frame*amp.
```

## Delay


```fs
// opendsp version: https://github.com/opendsp/delay/blob/master/index.js

dly(delay <- 1..10, feedback <- 1..10) = (
  *(size=512, buffer=[..size], count=0);

  back = count - delay * sampleRate;
  back < 0 ? back = size + back;
  i0, i_1, i1, i2 = floor(back), i0-1, i0+1, i0+2;

  i_1 < 0 ? i_1 = size - 1;
  i1 >= size && i1 = 0;
  i2 >= size && i2 = 0;

  y_1, y0, y1, y2 = buffer[i_1], buffer[i0], buffer[i1], buffer[i2];

  x = back - i0;

  c0, c1, c2, c3 = y0, 0.5 * (y1 - y_1), y_1 - 2.5 * y0 + 2.0 * y1 - 0.5 * y2, 0.5 * (y2 - y_1) + 1.5 * (y0 - y1);

  out = ((c3*x+c2)*x+c1)*x+c0;

  buffer[count] = input + output * feedback;

  ++count >= size ? count = 0;

  [out]
).
```

## Oscillator

```fs
sine(f=432 <- 0..20k) = sin(f * t * 2pi);

saw(f=432 <- 0..20k) = 1 - 2 * (t % (1 / f)) * f;

ramp(f) = 2 * (t % (1 / f)) * f - 1;

tri(f) = abs(1 - (2 * t * f) % 2) * 2 - 1;

sqr(f) = (t*f % 1/f < 1/f/2) * 2 - 1;

pulse(f, w) = (t*f % 1/f < 1/f/2*w) * 2 - 1;

noise() = rand() * 2 - 1;
```

## nopop

https://github.com/opendsp/nopop/blob/master/index.js
```fs
ladder(threshold=0.05, amount=0.12) = (
  *next, *prev;
  diff=next-prev;
  abs(diff) > threshold ? prev += diff * amount : prev = next;
  prev
);
```

## step

https://github.com/opendsp/step/blob/master/index.js

```fs
sampleRate = 44100;

step(bpm, sig, offset=0) = (
  *offset = round((60 / bpm * 4) * sampleRate * offset);
  *max = round((60 / bpm * 4) * sampleRate * sig);
  *acc = 0, prev = 0;

  frame += offset;
  acc = frame - prev;
  acc === 0 || acc === max ? (prev = frame; acc = 0; 1) : 0;
).
```

## envelope

```fs
@ 'math#exp';

envelope(measure, decay, release) = (
  ...t=0;
  (t / 4 % measure) | v -> exp(-v.l * decay * exp(v.l * release));
).
```

## [freeverb](https://github.com/opendsp/freeverb/blob/master/index.js)

See [fold](https://en.wikipedia.org/wiki/Fold_(higher-order_function)#In_various_languages) in different langs.

```fs
@ './combfilter.son#comb';
@ './allpass.son#allpass';
@ 'math#floor';

sampleRate = 44100;

a1,a2,a3,a4 = 1116,1188,1277,1356;
b1,b2,b3,b4 = 1422,1491,1557,1617;
p1,p2,p3,p4 = 225,556,441,341;

stretch(n, rate) = floor(n * rate / 44100);
sum(a, b) = a + b;
waterfall(p, apcoef) = p + allpass(p, apcoef, room, damp);

// Comb(coef) = (input, room, damp) -> comb(input, coef, room, damp).
// Allpass(coef) = (input, room, damp) -> allpass(input, coef, room, damp).

// pipes
// + implicitly passed arg works well
// + it also saves output space
// - reducer has a bit of stretch here - it doesn't simply extend pipe as |> → ||>, but adds "fold" meaning
reverb((..input), room=0.5, damp=0.5) = (
  *combs_a = a0,a1,a2,a3 |> stretch(sampleRate);
  *combs_b = b0,b1,b2,b3 |> stretch(sampleRate);
  *aps = p0,p1,p2,p3 |> stretch(sampleRate);

  output = ..combs_a |> comb(input, room, damp) ||> sum() + ..combs_b |> comb(input, room, damp) ||> sum();

  output, ..aps ||> waterfall();
).

// lambdas
// + only >- new operator
// + holds conventions: lambda, pipe
// + resolves syntactically merged scope issue
// + no implicit args, indicates apparently what's going on under the hood
// + plays well with >-
// - introduces fn overload, which might be ok for funcrefs
// - introduces lambdas, which might be unavoidable anyways
// - introduces operator precedence issue, | being above `,` which can be mitigated by raising , precedence
// - overuses lambdas and/or curried functions constructors, if say we want `source | filter(freq, Q)`, can be mitigated by |> operator
reverb((..input), room=0.5, damp=0.5) = (
  *combs_a = a0,a1,a2,a3 | coef -> stretch(coef, sampleRate);
  *combs_b = b0,b1,b2,b3 | coef -> stretch(coef, sampleRate);
  *aps = p0,p1,p2,p3 | coef -> stretch(coef, sampleRate);

  combs = ..combs_a | a -> comb(a, input, room, damp) >- sum + ..combs_b | b -> comb(b, input, room, damp) >- sum;

  ..combs, ..aps >- waterfall;

// loops
// + only >- new operator
// + holds conventions: lambda, pipe
// + resolves syntactically merged scope issue
// + no implicit args, indicates apparently what's going on under the hood
// + plays well with >-
// - introduces fn overload, which might be ok for funcrefs
// - introduces lambdas, which might be unavoidable anyways
// - introduces operator precedence issue, | being above `,` which can be mitigated by raising , precedence
// - overuses lambdas and/or curried functions constructors, if say we want `source | filter(freq, Q)`, can be mitigated by |> operator
reverb((..input), room=0.5, damp=0.5) = (
  *combs_a = a <- a0,a1,a2,a3 -< stretch(a, sampleRate);
  *combs_b = b <- b0,b1,b2,b3 -< stretch(b, sampleRate);
  *aps = p <- p0,p1,p2,p3 -< stretch(p, sampleRate);

  a <- combs_a -< comb(a, input, room, damp) | sum + b <- combs_b -< comb(b, input, room, damp) | sum;

  ^, ..aps >- waterfall;
).
```

## dynamic processors

```
```

# Extra

* [BitCrusher](https://github.com/jaz303/bitcrusher)
* [ogg decoder](https://en.wikipedia.org/wiki/HTML5_audio#Supported_audio_coding_formats)


# [floatbeat 1](https://dollchan.net/bytebeat/index.html#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)

```fs
@ 'math#pi,sin,abs';

// Main arpeggio
m = "5:=5:=5:<5:<5:<:16:18:161:168:68";
// First bell-like sound.
m2 = ": ";
// First melody
m3 = ": : 5 8 ::::: :<= < : 8 ::::::: ";
// Second melody
m4b = ":: 55 ::6666 6:<<<<<88AA66666   ";
// Second melody
m4 = ":: 55 ::6666 6:<==<<::AA66666   ";
// Fill in at end of second melody
m5 = "                        ?A? = < ";
// Intermezzo melody
m6 = ":51...55:::::::<===<<<8811111111";
// Intermezzo bass
m7 = ": ::: ::: ::: ::6 666 666 666 66";

// Get Melody function. This is the real synthesizer.
M(p, o, q, m, s, m2, j) = (
	j = j || 0x2000;
	r = m[q] || 0;
	q = m2 != null ? m2[q] || 0 : 0;
	r = q === 0 ? r : (r - q) * ((t % j) / j) + q;
	// Get absolute pitch from semitone.
	g = r < 33 ? 0 : ((t % j) / ratio) * pow(2, (r + p) / 12 - o);
	// This section is used by both saw and triangle wave (as tri is nothing more than abs(saw))
	x = (g % 255) / 128 - 1;
	// The real magic: decide between pulse, saw and triangle and synthesize them.
	s ? s < 2 ? x : s < 3 ? abs(x) * 3 : sin(PI * x) : (g & 128) / 64 - 1;
);


// Base drum
bd() = (
  btime = 2 << 12;
  bm = (80 - 40) * (1 - (t % btime) / btime) ** 10 - 80;
  bm2 = 0b01;
  (bm2 >> (t / btime) % 2) & 1 ?
    sin(PI * (t % btime) * 2 ** (bm / 12 - 1)) * (1 - (t % btime) / btime) ** 10 : 0;
);

// Hi tom
bt() = (
  btime = 2 << 11;
  btm = (80 - 15) * (1 - (t % btime) / btime) ** 10 - 80;
  btm2 = 0b1111010111010111;
  (btm2 >> (t / btime) % 16) & 1 ?
    sin(PI * (t % btime) * 2 ** (btm / 12 - 1)) * (1 - (t % btime) / btime) ** 10 * 0.3 : 0;
);

song() = (
  ...t=0;
  t++;
  t *= 5.6;     // Match the speed that the original song has.
  ratio = 0.78; // ratio is multiplied here and removed again inside the get melody function, so the pitch wont increase.
  t *= ratio;   // v is used in many places to check how far we are in the song. It is incremented each 4096 samples, roughly.
  v = t >> 12;  // Song looping. When past 768, repeat, skipping the first 128.
  v = (v % 768) + (v > 767 ? 128 : 0);

  (v < 640 ?
    // Arpeggio
    M(6, 5, (t >> 12) % 32, m, 3) * 0.3 +
    M(6, 3, (t >> 12) % 32, m, 3) * 0.01 +
    (v < 64 ? 0 : M(6, 4, (t >> 12) % 32, m, 2) * 0.05) +
    // Bell
    (v < 128 ? 0 : (
      M(6, 3, (t >> 16) % 2, m2, 2) +
      M(9, 4, (t >> 16) % 2, m2, 2) +
      M(13, 4, (t >> 16) % 2, m2, 2)
    ) * (1 - (t % 65535) / 65535) * 0.05) +
    // First melody
    (v < 196 ? 0 : M(6, 4, (t >> 12) % 32, m3, (t >> 17) % 2 ? 0 : 1) * 0.05) +
    // This part only between 256 and 480?, then a pause until 512 and then play again
    (v > 255 && (v < 448 || v > 511) ?
      // Drums
      (v < 256 ? 0 : bd(t) + bt(t)) +
      // Second melody
      (v < 20 ? 0 : M(6, 3, (t >> 13) % 32, m4, 2, m4b, 0x8000) * 0.1 +
        M(6, 4, (t >> 13) % 32, m4, 1, m4b, 0x8000) * 0.05) +
      (v < 320 ? 0 : M(6, 3, (t >> 12) % 32, (t >> 17) % 2 ? m5 : ' ', 3) * 0.2) : 0) :
    // Outro
    // Intermezzo melody
    M(6, 4, (t >> 13) % 32, m6, 3) * 0.05 +
    // Intermezzo bass
    M(6, 5, (t >> 12) % 32, m7, 2) * (1 - (t % (2 << 11)) / (2 << 11)) * 0.05 +
    // Distorted drum effect
    ((t >> 15) % 4 ? 0 : ((((sqrt(t % 0x2000) << 6 & 255) / 127 - 1)) / ((t >> 13) % 4 + 1)) * 0.15)
  );
)

```


https://dollchan.net/bytebeat/index.html#v3b64fVNRS+QwEP4rQ0FMtnVNS9fz9E64F8E38blwZGvWDbaptCP2kP3vziTpumVPH0qZyXzfzHxf8p7U3aNJrhK0rYHfgHAOZZkrlVVu0+saKbd5dTXazolRwnvlKuwNvvYORjiB/LpyO6pt7XhYqTNYZ1DP64WGBYgczuhAQgpiTXEtIwP29pteBZXqwTrB30jwc7i/i0jX2cF8g2WIGKlhriTRcPjSvcVMBn5NxvgCOc3TmqZ7/IdmmEnAMkX2UPB3oMHdE9WcKqVK+i5Prz+PKa98uOl60RgE6zP0+wUr+qVpZNsDUjKhtyLkKvS+LID0FYVSrJql8KdSMptKKlx9eTIbcllvdf8HxabpaJrIXEiycV7WGPeEW9Y4v5CBS07WBbUitvRqVbg7UDtQRRG3dqtZv3C7bsBbFUVcALvwH86MfSDws62fD7CTb0eIghE/mDAPyw9O9+aoa9h63zxXl2SW/GKOFNRyxbyF3N+FA8bPyzFb5misC9+J/XCC14nVKfgRQ7RY5ivKeKmmjOJMaBJSbEZJoiZZMuj2pTEPGunZhqeatOEN3zadxrXRmOw+AA==

```fs
@ 'math#pi,asin,sin';

sampleRate = 44100;

fract(x) = x % 1;
mix(a, b, c) = (a * (1 - c)) + (b * c);
tri(x) = 2 * asin(sin(x)) / pi;
noise(x) = sin((x + 10) * sin((x + 10) ** (fract(x) + 10)));
melodytest(time) = (
	melodyString = "00040008";
	melody = 0;
	i = 0;
  i++ < 5 -< (
    melody += tri(
      time * mix(
        200 + (i * 900),
        500 + (i * 900),
        melodyString[floor(time * 2) % #melodyString] / 16
      )
    ) * (1 - fract(time * 4));
  )
	melody;
)
hihat(time) = noise(time) * (1 - fract(time * 4)) ** 10;
kick(time) = sin((1 - fract(time * 2)) ** 17 * 100);
snare(time) = noise(floor((time) * 108000)) * (1 - fract(time + 0.5)) ** 12;
melody(time) = melodytest(time) * fract(time * 2) ** 6 * 1;

song() = (
  *t=0; time = t++ / sampleRate;
  ((kick(time) + snare(time)*.15 + hihat(time)*.05 + melody(time)) / 4)
);
```


## Sampler

Plays samples when a signal from inputs come.

```fs
@ 'sonr#src';

// global signals if corresponding sample must start playing
t = ( t1,t2,t3,t4,t5,t6,t7,t8 ) = 0;

// how would we implement loading assets not compiling them into code?
// passing by memory from JS, sonr would require JS counterpart
s = (
  s1=src('./karatal.mp3'),
  s2=src('./low.mp3'),
  s3=src('./hi.mp3')
)

play() = (
  *i = 0;

  x = 0;

  // how would we organize statically compiling loops with dynamic access?
  // similar to GLSL, fully unrolling into linear instructions?
  c <- 0..#s -<
    sc = s[c], tc = t[c]

    tc > 0 ? (      // if trigger c-th is active

      i >= #sc ? (  // if end of c-th sound
        t[c] = 0    // reset trigger
      ) :
      x += sc[tc]   // add sample to output

    ) : tc = 0

  i++;
  [x].
)
```
