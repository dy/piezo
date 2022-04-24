# Motivation

Inspired by [zzfx](https://github.com/KilledByAPixel/ZzFX), [bytebeat](https://github.com/greggman/html5bytebeat), [hxos](https://github.com/stagas/hxos), [web-audio-engine](https://ghub.io/web-audio-engine), [mono](https://github.com/stagas/mono) and others, it became clear that JS limitations are no-go for sound processing. It needs foundational layer with better low-level control, like WASM.
Besides, I had a list of language wishes ([eg.](https://twitter.com/DimaYv/status/1489066335980208141)) from Erlang times and just tired of JavaScript trends.

## Goals

* Familiar & intuitive syntax.
* Fluent & expressive.
* Radically minimal & performant.
* 0 runtime: no arguments ambiguity, types are predictable in advance, static memory.
* Compiling to WASM.
* sound-formulas
* function params can be signals themselves
* importable DSP libs: sound design, melody design, synth design, analysis, live, stdlib etc.
* Compiles to different targets

## Principles

* No-keywords.
* No implicit globals.
* Function overloading.
* Implicit type inference.
* Case-agnostic variable names.
* State variables instead of OOP.
* Built-in types operator overloading.
* Groups as first-class citizen: multiple returns, multiple operands.

<!-- See [react-hoooks prior art](https://reactjs.org/docs/hooks-faq.html#what-is-the-prior-art-for-hooks) -->

## Use cases

- Descre sounds with tiny footprint (copy-pasteable string);
- Reproducing synthesizers;
- Alternative to heavy soundfonts ([like this](https://magenta.github.io/magenta-js/music/index.html#soundfonts));
- Variable sounds (by analogy with [variable fonts](https://en.wikipedia.org/wiki/Variable_font)) − in reality sounds _are_ variable;
- drop `source | filter() | reverb() | fx()` and get controls with defaults; changing controls changes values;


## Wat?

Having wat files is more useful than direct compilation to binary form:

+ wat files are human-readable, so it's possible to debug mistakes and do changes
+ wat files are standard interchangeable format with proven compiler: no need to reimplement compilation and deal with its bugs
+ optimization out of the box
- wat files are still a bit hard
- modifying wat files creates divergence from son files..

### Feeling

**It should be language as a gift for Krsna: for him to compose beautiful melody once; and for all demigods to make songs praising Holy Name**.

What qualities should it have? How should that be organized?

- elegantly reliable: parser should build syntax tree only.
- evaluator should be able to augment nodes with eval function to make fast evals.
- compiler should be able to augment nodes with wasm generation.

* it should be more js-y / c-y and less python-y/elixir-y;
* it should be _very_ familiar and intuitive, but not basic;
* it should not be too smart, should be fluent like a breeze or spring water;
* it should be very familiar, but with cool new features and no old lame features;
* it should be direct and predictable: new operators like `|>` or `>-` can spoil the broth;
* it should be low-level: bytebeat should be available without radical changes;
* fluent: like js without `{}`
* spacing intuition is wasm/js-like: you can put operands inline or multiline (unlike python)

## Performance

1. Minimize or avoid anything beyond arithmetic operations, other math functions, and reading and writing from buffers. (from [mozilla](https://hacks.mozilla.org/2020/05/high-performance-web-audio-with-audioworklet-in-firefox/))
2. Minimize the creation of objects that are garbage collectable.
3. You can use typed arrays, and reuse objects, but don’t use fancy features like promises.
