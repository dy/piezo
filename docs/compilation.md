# Compilation issues

## [x] ? How do we map various clauses to wat/wasm?

  1. fixed pointers and `fn(aCh, bCh, ..., x, y, z)`
    - harder to manage variable number of inputs
    - needs mem layout convention
    - no way to differentiate i32 from f32

  2. `fn(aPtr, aCh, bPtr, bCh, ..., x, y, z)` - pairs reflect a-Param, single value reflects k-Param
    - may have conflict number of args, eg. `gain(xPtr, xCh, amp)` and `gain(x, ampPtr, ampCh)`

  3. Combining flags for a-rate params? (or k-rate params)?
    ```
      enum {
          A0 = 1 << 0,
          A1 = 1 << 1,
          A2 = 1 << 2
      };
      fn(A0|A1|A2, aCh, bCh, cCh, x)
    ```
    + Can act as single binary simply as `fn(0b1110, aCh, bCh, cCh, x)`
    + Most compact form (simple enum)
    - there's no binary literals in C/C++
  3.1 Integer? Hex literal? For types?
    + `fn(0xaaacc)` indicates 3 a-params, 2 c-params (controlling)
    - limited to max 16 inputs 0xFFFFFFFFFFFFFFFF
    + extensible, allows 16 types of input arguments
      * ? clamped (-min/-max)
      * ? step
      * ? a-rate, k-rate, ...
      * ? i32, i64, f32, f64
      * ? interleaved / planar
      * ? L128, L256, ... L8192
  3.2 Hex for number of channels?
    ~ to destructure input `gain(0x20,inPtr,b)` → `gain((l,r), .5)`?
      - redundant-ish pointer
    * ? maybe reflect memory layout, instead of pointers?
      + 0 = no block, 1 = 1 block, 5 = 5 blocks etc: `gain(0x20, #, gain)` means 2 blocks for 1st arg, 0 blocks for gain.
        ? what is placeholder then? pointer? number of channels to destructure? clause indicator?
  3.3 Hex for clause indicator? `gain(0x1)`
    * same as just 3. The point is enriching indicator with meaning.

  3.4 Hex indicates type of args, args indicate memory layout or values.
    * `gain(A0_F32_PLANAR | K1, 2, .5)`
      - too many combinators A0, A1, K1 etc.

  4. Per-channel modifiers `gain(2|A|F32|PLANAR, .5)`
    + less modifiers
    + reflects memory layout
    + readable
    + unlimited number of channels
    - same as in 1.: hard to make difference of f32/64 vs i32/64.
      ~ unless we make mandatory marker, eg. A_RATE or CHANNELS or INPUT or any actually, which sets hi-bit indicator of aParam case.
    ~ we can even pass mem pointer with modifiers, i64 allows to fit everything.
      ? `gain(2-ch, .5)`, `mix(1-ch, 2-ch, 2-ch, 2-ch, gain)`

  → God would like it something very very simple, with sane default.
  → These modes need to be exposed by wasm to not depend on wrapper
    - wasm doesn't directly expose constants. Seems that we have to make a userland convention. `MEM = 0xf000` etc.
      ~ they actually give number by `valueOf` call, ie. operations with them are workable
    + that convention allows naming that factor the way user prefers - CH, CHAN, CHANNEL etc.

  4.1 Mult operator is more conventional `gain(2*ch, .5)`, `mix(4*block, 2*block, 2*block, 2*block)`
    -~ ideally channel variable has numeric meaning on its own
    ? - `gain(MONO, STEREO)`... nah

  5. We reserve integers for channel pointers, floats for params.
    ~+ is there ever cases when we need int values for params and not floats?
    + ints are better at addressing memory etc.
    ~ we're again at 1, but not with pointers but memory allocations.
    - ok, null-indicator is confusing in frontent also.
    - besides, we can't indicate F64/F32, which can be useful as well.
    → so better we do 4 or mix of 4 and 5 `process(2 * blockSize | MEMORY, .5)`

  → Memory also must be declared by WASM, not imported.

  6. Reftypes.
    + allows thinking not about mem allocation and just pass values as is, but
    - has very little info on what to do with these reftypes
    - to bring any meaning, requires strapping - nah
    - binds to JS

  7. `gain(2|IN, gain, 2|OUT)`, `gain(2|IN, 1|PARAM, 2|OUT)`
    - float params cannot have flags: we have to write values to memory then.
      ~+ maybe that's better since it detaches memory from code. For example, shared memory can be independent.
    - we cannot indicate clamping limits
      ~ not necessary we're going to need them - we can compile them into source, which is better

  7.1 `gain(input(2), gain, output(2))`, `gain(input(2), param(gain), output(2))`
    + nice look
    - combining config is not aesthetical
    ~ output can be skipped
  7.2 `gain(aParam(2), kParam(1))`
    + allows defining limitations: `gain(aParam(2, -1, 1), kParam(1, 0, 1))`

  8. Configurable static layout: `setBlockSize(N), setMaxChannels(16)`
    * that recalculates `INPUT_PTR`, `OUTPUT_PTR`, `INPUT_LEN`, `OUTPUT_LEN`, `BLOCK_SIZE`

  → It should be simple and soft, like a breeze.

  9. `[ptr, size] = param(channels)`, `blockSize` is configurable global
    + this is simple
    + this is like 7.2 with pointers
    + this allows space for extra args to param constructors, like clamping etc.
    * ? maybe we better off `[ptr, size] = aParam(2)`, `ptr` = kParam(2)
    ~ identifying slot params by ptr would require internal state. Ideally we keep it simply as calculation:
      * gain(a,b,c) whould know nothing about params, it should really be isomorphic and calculate based on args, that's it.

  → block size may change over time, so better reserve place in-advance.
  → just follow [audioWorklet.process](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor/process)

  → 10. Ok, proper way is alloc or array (see @audio/gain.wasm)
    * [Simplest malloc](https://github.com/rain-1/awesome-allocators)
    * [Array](https://openhome.cc/eGossip/WebAssembly/Array.html)

    ?.
      10.a `malloc2d(blockSize, 2); gain(inptr, gainptr, outptr)`
        - allocated memory cannot be reused by another number of channels
      10.b `malloc(2*blockSize); gain(inptr, 2, gainptr, 1, outptr, 2 )`
        + allocated memory can be reused for various channel numbers cases
          * eg. `gain(x)`, `gain((l))`, `gain((l,r))`, instead of `gain(leftPtr, rightPtr)`
        - k-param turns into `gain(inp, 2, gainp, 0, outp, 2)`
      10.c `malloc(2*blockSize); gain(inptr, 2*blockSize, gainptr, blockSize, outptr, 2*blockSize )`
        - number of channels calculated runtime, which is not apparent
          * ie. mapping of arbitrary sizes to arbitrary other sizes is not clear
        + can indicate exact number of samples, which is sort of convention [ptr, len]
          - length is stored by allocator
            ~ implicit remembered state isn't nice
        + conventional (ptr, length) pairs
        + allows reusing same memory for any number of channels
        - signature calc is complicated-ish
        - keeps redundant out size, which is apparent from the source
          + in fact can be used to check available size
        - inconsistency of pointer and blockSize units: pointer measures bytes, blockSize measures items
          → either alloc should return units pointer, or require allocating bytes and not items
          . if we allocate items, it really better be array, or slot, or something more hi-level
          . or else use direct trivial malloc, but then the signature and implicit channels problem remains
            - the original task doesn't correlate much with malloc purpose: memory can be managed memory.grow easily.
            . maybe indeed we should better stick to param kinds convention instead of generic forms
              - we still need to pass channels info somehow: slot size can fit more channels if blockSize lowers
      10.d `malloc(2*blockSize); gain(202, inptr, gainptr, outptr )`
        + saves time calculating signature client-side
        + less arguments
        - signature can be limiting to max 10/16 channels
        - signature is too lengthy
      10.e ✱ `malloc(2*blockSize); gain(inptr, gainptr, outptr, 2, 0, 2)`
        + keep args order similar to descriptor
        + breaks ptr-size convention
        + allows optional last arguments (output is internal, gain is 0)
          `gain(inp, gainp, outp, 2, 0)`
        + easier to calc signature
        + (possibly) less internal calculation - no need to detect number of channels from mem layout (implicitly as in 10.c)
        + no need to deal with 1-value krate inputs calculation, as it's directly indicated
        + direct values fn clause can be detected by 0 arguments
        - there's no clear understanding how k-param or 1-channel a-param maps to multiple channels
          * seems that notion of channels and k/a-rate are different
          - detecting a-/k- rate implicitly from memory size of pointer is not necessarily good
          ~ can be facilitated by [channels interpretation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Basic_concepts_behind_Web_Audio_API#up-mixing_and_down-mixing)
            * neither speaker nor discrete: only copies mono value to all channels, else - discrete.
            ~ maybe we don't need absolute flexibility: if you need precise per-channel values, just provide full a-rates.
      10.f `gain(inptr, gainptr, outptr, 2|A_RATE, 1|A_RATE)`
        - requires const imports
        - too magical
      10.g `inp = aParam(2), gainp = kParam(1), outp = aParam(1), gain(inp, gainp, outp)`
        - if we bind param to memory slots, we cannot reuse it for more channels
          . therefore channels must be detected from gain input params
          . therefore holding structure must be linear array, or slot

## [x] How do we organize output?

  * Predefined memory statically indicated locations of input/output.
  * Dynamized memory loses output location, unless indicated by arguments...

  ? Can we avoid that by providing OUTPUT_PTR?
    - not really. We should pass output pointer and size to detect channels.
  →   + not necessarily. If we follow array method (see above), we can return pointer to first element of array, but 0 element indicates its length, so we can easily grab length from pointer.

## [x] Autogeneration mono/stereo clauses vs manual clauses

  * See [gain node](https://github.com/mohayonao/web-audio-engine/blob/master/src/impl/dsp/GainNode.js) for clause examples.

  1. autogeneration
    + makes son code shorter
    - generates n^2 codebase, very redundant and prone to uncontrolled growth

  2. manual clauses
    + reflect "hint" to how much code is generated in son source
    + more precise
    - can be tedious for long processors
      ~ maybe long processors should fallback to core routine, for example
    + clauses allow defining pipe-input case
    + that's nice that clauses are turned on only if defined, not otherwise

  → prob there's no sense to generate internal fn clauses, unless overload takes place

  → there's no much sense generating looping functions for internals.
    * for exports we create clauses = that depends on the way fn is called.
    * so that's just generalized way to "batch" functions against values in memory.

## [ ] Processing function reads from memory; regular function takes arguments.

  * ? How do we differentiate them?

  1. `export` === processing
    - `import pow from 'math'` is not processing function
      ~ it's not necessarily external, if imported by wasm.
        → Sonr can resolve imports to become internal.
    - makes simple things slower than needed (reading from/to memory)
      ~ not true for internals
    - disallows direct params
      ~ not sure if exports need direct params

  2. Indicate parameter type: `gain(x:aRate in -1..1, gain:kRate in 0..1)`
    + better distinguishes clauses
    + allows direct params as `gain(x:aRate in -1..1, gain in 0..1)`
    + allows implicit input type as eg. `gain(x:input in -1..1, gain)`
    - doesn't propagate type info down the source
    - colon can be used for loops, x:action means do action until x is true

  3. Imply param type from name `gain(ax in -1..1, aGain in 0..1)`
    + csound-like
    * ? mb worth taking csound conventions:
      a=audio rate calculation—calculated once per sample
      k=control rate calculation—calculated once per control period
      i=init rate calculation—calculated once at the start of the instrument
      g=global
    + reminds in source code about nature of variable, without implicit type
      ? is that helpful anyhow?
    + g can be used for `gTime`, `gSampleRate`, `gBlockSize`
      + OpenGL uses `gl`, `glu`, `glut`, `glew` prefixes https://www3.ntu.edu.sg/home/ehchua/programming/opengl/HowTo_OpenGL_C.html
      ~ can be competed with `#t`, `#sampleRate`, `#blockSize`, `#input`: `gain(#x, aGain in 0..1)` can mean implicitly passed #x.
        + a |> b(1), b=(#a,b)->#a+b
        ~ # is also a sort of prefix
    - can be problematic destructuring: `gain((al,ar) in -1..1)`

## [ ] Clauses selection

  * ? How do we select direct values clause? `gain(inp, .75, outp)`
    ~ `gain(inp, .75, outp, 2)` is fine (null-arg means direct)

  * ? How do we export direct-values functions [ideally] without extra step of args detection?
    ~ the worst-case damage is extra fn call + extra nan comparison that sees - ok, there's no signature, fall back to direct call.
    ~ single runs are not expected to be very regular externally, since for batch runs there's clause cases.

  *
