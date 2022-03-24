# Language

Having wat files is more useful than direct compilation to binary form:

+ wat files are human-readable, so it's possible to debug mistakes and do changes
+ wat files are standard interchangeable format with proven compiler: no need to reimplement compilation and deal with its bugs
- wat files are still a bit hard
- modifying wat files creates divergence from son files..
+ direct compilation is suboptimal; for binaries and wat there are optimizers.
→ maybe we should start first with fixing web-audio-api with regular js, then rewrite dsp in wasm (get experience), then redesign language from the examples according to principles

Some fruits from sonr discussion.

* sound-formulas
* function params can be signals themselves
* importable DSP libs: sound design, melody design, synth design, analysis, live, stdlib etc
* radically minimal & performant
* it must be 0 runtime: no arguments ambiguity, all types are predictable in advance.

**It should be language as a gift for Krsna: for him to compose beautiful melody once; and for all demigods to make songs praising Holy Name**

What qualities should it have? How should that be organized?

- elegantly reliable: parser should build syntax tree only.
- evaluator should be able to augment nodes with eval function to make fast evals.
- compiler should be able to augment nodes with wasm generation.


### Syntax feeling

* it should be more js-y / c-y and less python-y/elixir-y;
* it should be _very_ familiar and intuitive, but not basic;
* it should not be too smart, should be fluent like a breeze or spring water;
* it should be very familiar, but with cool new features and no old lame features;
* it should be direct and predictable: new operators like `|>` or `>-` can spoil the broth;
* it should be low-level: bytebeat should be available without radical changes;
* fluent: like js without `{}`
* spacing intuition is wasm/js-like: you can put operands inline or multiline (unlike python)
* drop `source | filter() | reverb() | fx()` and get controls with defaults; changing controls changes values;

## Performance

1. Minimize or avoid anything beyond arithmetic operations, other math functions, and reading and writing from buffers. (from [mozilla](https://hacks.mozilla.org/2020/05/high-performance-web-audio-with-audioworklet-in-firefox/))
2. Minimize the creation of objects that are garbage collectable.
3. You can use typed arrays, and reuse objects, but don’t use fancy features like promises.

Ok, one myth debunked.
Turns out WASM performance is not drastically better compared to JS turbofan for large numbers of runs.
So the main pain of JS for sound processing is GC. The rest is relatively ok.

## Refs

* Great reference for language design: [language_comparison](https://en.wikipedia.org/wiki/Comparison_of_programming_languages).
* One toy wasm language as a base: [WebBS](https://github.com/j-s-n/WebBS)
* [chasm](https://github.com/ColinEberhardt/chasm/blob/master/src/emitter.ts)
* [mono-lib](https://github.com/stagas/mono/blob/main/src/lib.wat.ts), [monolib](https://github.com/stagas/monolib/blob/main/src/index.ts)
* [webassembly examples](https://openhome.cc/eGossip/WebAssembly/index.html)
* Example wasm calculator https://crypto.stanford.edu/~blynn/asm/wasm.html

## Test cases

* sonr expressions
* FM, AM signals sin(f + sin(m) * 100), sin(f) * (cos(m) + 1)
* weighted mixing signals sin(a) * .75 + cos(b) * .25
* periodic wave eg. wave(1204) - seed indicates overtone weights
* ZZFX sound board
* web-audio-api for node
* mixing: `+`, `-`, `*` and `mix(a,b,c)`
* amplifying: `a*x` and `| gain(amt)`
* shifting: `a | delay(±1s)`
* stretching (pitch): `a | rate(1.05)`
* inverting: `-a`
* reversing direction: `a | reverse(x)`?
* join/concat: `a|trim(..2s) + b|delay(2s) + c|delay(4s))`?
* static shift: `a+c`
* multiplexing: `a > 2 ? x : a > 1 ? y : z` and `mux(select, a, b, c, ...)`?
* input: recording, file etc: `mic()`, `file()`
* loop: `%`? `a | repeat(2)`? `a.repeat(2)`? `a(t % 2)`?
* trim: `a / dur`? `dur&&a`? `a(min(t, dur))`?
* cap/limit/compress max/min/clamp?
* pan, channels: `a & b`?
* math stdlib: common function names exposed from `Math`?
* adsr: `a * adsr(params)`? `a | adsr(params)`?
* convolve: `a ^ b`?
* filters `a | lp(f, q)`? `a | filter(type, f, q)`?
* effects: crush, curve, unisson, flanger etc.  `a | crush(param)`?
* map `a | abs(it)`? `a | abs($)`?
* get sample:  `a[x]`? `a.at(x)`? or sample-less fns?
* get channel: `a[0]`?
* get value at a time `a(t)`?
* integrate: `∫(a, dt)`? `acc(a, dt)`?

## Alternatives

* [soul](https://github.com/soul-lang/SOUL/blob/master/docs/SOUL_Language.md)
* [elementary/audio](https://www.elementary.audio/docs/guides/Making_Sound)
