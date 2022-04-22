# Motivation

Inspired by [zzfx](https://github.com/KilledByAPixel/ZzFX), [bytebeat](https://github.com/greggman/html5bytebeat), [hxos](https://github.com/stagas/hxos), [web-audio-engine](https://ghub.io/web-audio-engine), [mono](https://github.com/stagas/mono) and others, it became clear that JS limitations are no-go for sound processing. It needs foundational layer with better low-level control, like WASM.
Besides, I had a list of language wishes ([eg.](https://twitter.com/DimaYv/status/1489066335980208141)) from Erlang times and just tired of JavaScript trends.

## Goals

* Familiar & intuitive syntax.
* Fluent & expressive.
* Radically minimal & performant.
* 0 runtime, types predictable in advance, static memory.
* Compiling to WASM.

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
