# Compilation issues

## ? How do we map various clauses to wat/wasm?

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


## How do we organize output?

  * Predefined memory statically indicated locations of input/output.
  * Dynamized memory loses output location, unless indicated by arguments...

  ? Can we avoid that by providing OUTPUT_PTR?
