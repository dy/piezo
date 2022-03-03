# Language design / issues R&D

## [x] frames as vectors

  * like glsl (data views to underlying block buffer), with [standard channel ids](https://en.wikipedia.org/wiki/Surround_sound#Standard_speaker_channels); swizzles as `a.l, a.r = a.r, a.l; a.fl, a.fr = a.fl`

## [ ] `t`, `i` are global params? Or must be imported? Or per-sound?

  * ? cannot be imported since generally global-time t/i are unknown. Mb defined as `...t as time`?
    - try avoid typing
  * ? or `#t`
    - try avoid too magic
  * Sound can be called multiple times, so timer per instance makes sense.
  . Time doesn't make sense as external parameter, since user cannot modify it, it flows forward, like state:
  . it has init moment and increases over time, not necessarily steadily.
  ? add specifier to initializer as `...t=0 as time, i=0 as index, rate as sampleRate`

### [ ] Instantiation of sound

  * ? Instantiate sound externally via module instance?
  * ? Or take `t`,`i` param?
  * ? Or have `reset` method?
  * We may need to call same function with different time within same sound.
    ? Should it be implicit-default-function param, like `f(#t=gTime)` and to call `f(a,b,c,#t=localTime)`?
      + this can also be used for pipe input as `f(#input)`

## [x] `f(x, y) = x + y` standard classic way to define function in math
  + also as in F# or Elixir

## [x] Define params/vars range as `f(x=100 in 0..100, y=1 in 0..100, z in 1..100, p in 0.001..5) = ...`

  * ! Swift: non-inclusive range is 0..<100

## [x] Enums can be defined as `f(x in sin|tri|cos)`

  * ? for enums and ranges `{a,b,c}` seems to be the best:
    ref: https://en.wikipedia.org/wiki/Enumerated_type#Syntax_in_several_programming_languages
    + doesn't associate with arrays / props if brackets were `[]`
    + associate with regex ranges
    + classic math ranges
    + [set-buider notation](https://en.wikipedia.org/wiki/Set-builder_notation)
    + both ranges and enums
    + used in may languages
    - a bit redundant for range definition as `{0..10}`: `{}` has js intuition as creating/destructuring object.
    - holds "scope" or "object" meaning
    → sets can be listed as `(a,b,c)` ()
      ⇒ or even better, as functional languages do: `type in a|b|c`

## [x] !? erlang strings: "hello" === [104,101,108,108,111]

## [ ] !? erlang atoms: 'hello' (not string)
  * Atoms are useful for referencing:
    + function instances
    + ranges?
    + arrays
  * ? we can use i64 for them
  * ? or we can use f64 for all numbers by default and keep rest of types free

## [x] `import a,b,c from 'lib'`, `import sin from 'stdlib'`

  * ? How do we redefine eg. sin from stdlib?
    ? Just reassign to var or give another name? Every fn has unique name?
    → import only subset, like `import sin from 'stdlib'`

  * no import default, no export default - every fn got a name

## [ ] Pipes:

  * ? Should pipes allow placeholder as `x | #*0.6 + reverb() * 0.4`
    * `.` placeholder from R-lang solve `..l=..r` as `(.).l = (.).r`, but if `.` is used for terminator, then not this.
    * maybe we better off `#.l = #.r`, unless we need `#` for something else.
    ? possibly it should be both: passing input as `input` implicit param, `#` redirects to another param
      - nah, too complicated.
    → ok, seems like intuition for `|` is direct expression, sort of overload: `a | filter(f, q)` ← filter creates processor here
    → but for pipeline there's intuition as `a |> filter(#, f, q)` ← we don't necessarily need that
    → so `a | b | c` is _simply_ operator overloading for functions, same as `"a"+"b"` for strings.
    → for passing params use inline functions as `a1,a2,a3 | a -> b(a) | c`
    → that builds good functional intuition, but to make it feel better - functions should be macros, not lang constructs
  * Maybe to keep basic expressions clean we better use `|>` for pipe operator?
    + That would be just direct F#/elixir pipes.
    + We can even do `||>` and `|||>`.
    + We can even do `*>` or `+>` for piping _all_ inputs as arguments `a,b,c +> mix()`, `a,b,c *> mix()`, `a,b,c |>> mix()`
    → Maybe just use `||>` to send all arguments to inputs `a,b,c ||> mix()` === `mix(a,b,c)`
      * whereas `a,b,c |> mix()` === `mix(a),mix(b),mix(c)`
  * What if we keep overloading intuition, but introduce `a |> b(x)` operator as a shortcut for `a | a -> b(a, x)`?
    - `...a = a0,a1,a2,a3 |> stretch(rate) | Comb` becomes messy.
      * vs `...a = a0,a1,a2,a3 |> stretch(#, rate) |> Comb(#)`
      * vs `...a = a0,a1,a2,a3 | a -> stretch(a, rate) | Comb`
      * vs (ideal1) `...a = a0,a1,a2,a3 | stretch(rate) | Comb()`
      * vs (ideal2) `...a = a0,a1,a2,a3 |> stretch(rate) |> Comb()`
    - this partial application is implicit argument - non-js intuition.
      . Operator `|>` should not know about next call operator `a()` - what if there is `a |> b` - how's that applied?
      → Partial application can be thought on its own regardless of pipe as `a1 = a(#, rate)`
        , which is solved via lambda as `a1 = x->a(x,rate)`
      → therefore no partial application concept is needed, just use lambda functions + operator overloading
    → `source | lp(freq, Q)` is lame. I think we're fine using literal as reference to group variables as `source | lp($, frq, Q)`
      + that looks regexy - backreferences in both string/regexes
      + that enables access to group members as `a,b,c | d($1, $2)`
      - `source | lp($, freq, Q)` is lame & redundant.
        ~ creating lambda function  for `source | lp(freq, Q)` can be tricky; also complicates source.
      . this form of pipe `source|lp(freq,Q)` forces implicit input, which is a form of fluent intuition (wasm-y):
      . `source` puts value to stack, and pipe operator just processes that value from stack - same implict thing we mean by autoreturning last statement.
      . I think function should have internally something like stdin to read from.
      ? what if we introduce global variables $1,$2,...$n as constant references to last elements in stack?
        + then we can use them internally: `gain(amp)=$0*amp`
        + then we can use them in pipes as: `source, modulator | filter(freq:#2)`
        ? or maybe better #0, #1, #2?
          + works better as ordered number meaning
          + github (url) ref
          . #0 - all last args, #1 - first arg etc.
        ? or $0, $1, $2?
          + reminds string replace
          + reminds wasm text reference
          + wasm refers $ to variable name, to named entry in stack (variable or callstack)
        ? or maybe provide named references (unchangeable) #in, #in[0],..., #out, #t, #rate?
          + gives "private", "reserved" meaning, which is similar to private fields from js.
          - no need for #in - function just takes from last group
    * `source | filter(freq, Q)` → `filter(source, freq, Q)` is fine convention. Placeholder is a pain, we 99% of time don't need that.
      * ? Maybe worth renaming to `source |> filter(freq, Q)` to avoid confusion with `|`
        - nah, `source | gain(.45)` is oldschool coolness, prob just fn clause: takes prev argument.
    → The converging solution is: use implied argument as `gain(#input, amp) = gain(#input, amp)`
      * that utilizes multiple fn clauses organically and enables simple overloading as `source | gain(amp)`

## [ ] Lambda

  * should there be lambda? `value | x -> x*.6 + reverb(x) * .4`
    - lambda function has diverging notation from regular fn definition.
      ~ although `param -> result` is also classical math notation
    + lambda funcs also don't need brackets, just `a,b,c -> a*2 + b*3 + c*4`
    + lambda funcs have no state, they're just in-place routines (I guess level of macros, not table subroutines).
    → let's first find out how much these operational pipes are useful. Maybe not.
      + although lambda is useful for currying fns also
    - lambda is heavy to implement: it requires a table, which can be dynamically spawned and needs some gc headache
      ? what if we identify by callsite and in-places denormalize usage as just direct code insertion? Sort of macro?
        ~ then overloading becomes questionable `...a = a0,a1,a2,a3 | a -> stretch(a, rate) | Comb`

  ! -> operator must uniquely identify type and be macros

## [ ] Reduce operator:

  * ? Reduce operator? It can be eg. `:>` (2 become 1), or `=>`.
    * ? `a,b,c :> reducer`, like `signals :> #0 + #1`
      - `:>` looks like expecting some input or something.
    * ? Or maybe `a,b,c ||> a,b -> a + b |...`
    * ? `a,b,c => a,b ->a+b`
    * ? `a,b,c ..> a,b -> a+b`
    → `a,b,c >- a,b -> a+b` (crazy!)

  ! >- operator can be statically analyzable if group length is known (it should be known)

## [ ] Units

  * Units possibly intrudoced as `10k`, `1s`, `1hz`, `1khz`

  * ? 1pi, 2pi, 3pi, 3.4pi etc.
  * 1k, 1M, etc.
  * 1s, 1m, 1h
  * 0:12

## [ ] End operator

  * `.` operator can finish function body and save state. `delay(x,y) = ...d=[1s], z=0; d[z++]=x; d[z-y].`
  * ? is it optional?
    * eg. `noise(phase) = sin((phase % (PI*2))**3)` - what would be the point here?
  - it makes direct sense only in case of unnested body. When body is nested - not as much.
  - it creates confusion with block as `).` vs `.)`
  + maybe for unwrapping it is still useful.

## [ ] State management

  * load previous state as `...x1, y1, x2, y2`

## [ ] Named array items

  * named properties in arrays? `[1,2,3,a:4,b:5]`
    ~ reminds typescript named tuples
    ~ should find exactly where we'd need that
  ? Maybe can be done purely as aliases for position?


## [x] Elvis operator: `a ?: b` instead of jsy `a ?? b`
  * ~ equivalent to a ? #0 : b

## [x] short ternary operators as ` a > b ? a = 1;` → use elvis `?:`
  + it not only eliminates else, but also augments null-path operator `a.b?.c`, which is for no-prop just `a.b?c` case.
  - weirdly confusing, as if very important part is lost. Maybe just introduce elvis `a>b ? a=1` → `a<=b ?: a=1`

## [x] Loops: `i in 0..10 |: a,b,c`, `i in src |: a`, `[x*2 :| x in 1,2,3]`
  * `for i in 0..10 (a,b,c)`, `for i in src a;`
  * alternatively as elixir does: `item <- 0..10 a,b,c`
    + also erlang list comprehension is similar: `[x*2 || x <- [1,2,3]]`
  * see [list-comprehension](https://en.wikipedia.org/wiki/List_comprehension)
  * ? Is there a while loop character, mb based on ternary? `a ?.. b : c`
    * or loop by secondary `a ? b :: c`
      - what if we don't need else condition? `a ?.. b;`
  * ? What if we simply provide short version of for `for (condition) statements`, augmented to `for(;;)`?
    * ? `for(let i = 0; i++ < x.length)`, `for (a in b)`, `for (i=0 < x.length)`
  * ? what if we even simpler do `a in b : a+1`, `i++ < x.length : a[i]++`?
    + it's like label but evaluable and returning to itself;
    + it's like `for`/`while` loop in form of operator;
    - it's like tail of ternary `a ? b : c : d`
      ? what about loop inside of a loop? `x++ < w : y++ < h : (x,y)`
        + yes, nested loops can be comma-defined `x++<w, y++<h : ...;`
    * ? or make label at the end? `(x,y) : x++ < w, y++ < h`
      + this is more classic math notation
      - a bit unusual and forces first step
      ~ math notation for loop is either `∀A,∃B:A<B` or `∀{x∈N,0<x<10},yx=x**2`
    * : is basically infix loop notation, compared to prefix `for a b` or `while a b`, or postfix `do a until b`.
    * ? `a :: b` ? `a <b>` ? `< a > b` ?
  * ~ from ABC notation loop is defined as `|: common |1 part1 :|2 part2 |`.
    * ? So maybe `|: i++ | i%3==0 :|`
    * ? Or `i%3==0 |: i++ :|`
      + separates repeating scope visually
      - double-character groups are slower to parse
  * ~ from UML loop is defined as `< i%3===0 > i++ : 0`, that can be done also as `{i%3==0} i++`
    * ? Or `i%3==0 { i++ }`
      + separates repeating scope visually
      + single-character group
  * ? modified ternary as `x in 1,2,3 ? a[x]=1 :|`, `i%3===0 ? i++ :|`
    * `a ? b :|`, `x = [x in 1,2,3 ? x*2 :|]`
      - mess at the end
  * ? `[ x in 1,2,3 :| x*2 ]` or the vice-versa `[ x * 2 |: x in 1,2,3 ]`
    + vertical bar is used in math notations {x∈R∣x<0}, {x∈R:x<0}
    + `:|` is musical repeat indicator
    + `:` or `|` itself is not enough, it's too overloady or conflicting with ternary.
    * `i%3 == 0 :| i++`, `a :| b`, `i++ |: i%3 == 0`
    a.`x < 5 :| x++`,  `x++ |: x < 5`, `[ x in 1,2,3 :| x*2 ]`, `[ x * 2 |: x in 1,2,3 ]`
      + reminds label a: ...
      + keeps body visually clean after bar, as if returning result, condition clarifies body: `[x*2]` → `[x*2 |: x in 1..10]`
      ~ `|:` sounds like `|` such `:` that, swoooch th th
      - it weirdly conflicts with elvis operator `x in 1..10 ?: body`, but `x in 1..10 :| body`
    b. `x < 5 |: x++`,  `x++ :| x < 5`, `[ x in 1,2,3 |: x*2 ]`, `[ x * 2 :| x in 1,2,3 ]`
      + refer to looping body, not condition, which is better in musical sense
      + it matches elvis operator `x < 5 ?: x++`, `x < 5 |: x++`
        + muscle memory of ternary/elvis

### [x] loops can return a value: `(isActive(it): action(it))` - the last result of action is returned
  + useful for many loop cases where we need internal variable result.

## [x] ? Is there a way to multi-export without apparent `export` keyword for every function?

  * ? maybe it's good there's apparent `export` indicator - easy to scan and in-place, compared to accumulated export at the end.
  → C++ exports implicitly function clauses.

## [ ] Arrays: should have standard map, filter, reduce methods or not?
  * ? what if we don't deal with arbitrary-length arrays?
    + it guarantees memory limitation, "embeds" into syntax
    + it removes much need in syntax around arrays like map, filer: it can be as `(a,b,c) | map`
  → ok, for map use groups `(a,b,c)(fn)` or `a,b,c | i->i**.5`
    . for reduce use `a,b,c >- fn` or `a,b,c >- a,b -> a+b`
    ! that is in fact mixing operator! a,b,c >- mix
    !? we can reduce based on reducer's number of args

## [ ] Concat/flat groups
  * ?is done via range operator a, ..b, c..d, e (shortened spread)

  * ? destructuring is `a,b,c = ..d`
    ? Alternatively: do we need nested structures at all? Maybe just flat all the time?

## [ ] -< operator: splits list by some sorter: `a,b,c -< v -> v`

  * ? or in fact multiplexor? selects input by condition? like a,b,c -< x -> x > 2 ? 1 : 0

## [ ] comments: //, /* vs ;; and (; ;)
  + ;; make more sense, since ; is separator, and everything behind it doesnt matter
  + (; makes more sense as "group with comments", since we use only ( for groups.
  + ;; is less noisy than //
  + ;; is associated with assembler or lisp/clojure
  + even simpler - everything after ; can be considered a comment?
  - pretty unusually associates with autohotkey, which is the opposite of fast
  - too innovative
  - single-comment breaks inline structures like a(x)=b;c;d.
  - // associates besides C+/Java/JS with F#, which is pipy

## [x] ! Variables case should not matter.

  * https://twitter.com/bloomofthehours/status/1491797450595528713?s=20&t=1aJpwIDrbNhIjwIohsvxiw

## [x] Minimum if not 0 keywords: for(a,b,c) is valid fn; if(a,b) is valid fn;

## [x] Groups

  * `a,b = b,a`
  * `a,b,c + d,e,f → (a+d, b+e, c+f)`
  * `(a,b,c).x() → (a.x(), b.x(), c.x())`

  ~ likely we have to swipe precedence of , over =
  . a,b,c = d,e,f       → a=d,b=e,c=f
  . (a,b,c) = (d,e,f)   → a=d, b=e, c=f          // destructured-assembled
  . (a,b,c) = d         → a=d[0], b=d[1], c=d[2] // destructure
  . (a,b,c) = d,e,f     → a=f[0], b=f[1], c=f[2] // or destructure first?
  . a,b,c = (d,e,f)     → a=(d,e,f),b=(d,e,f),c=(d,e,f)              // assign last
  → so there are 2 meanings:
    . () makes group a single component
    . , makes group, but separate components

## [x] Notes as hi-level aliases for frequencies A4, B1 etc.

## [ ] ? Orchestra definition

  * We can use csound like initial definition:
  sr = 44100, 0dbfs = 1
  - that must be defined from outside

## [ ] ? Should it compile to wat or to wasm?

  - wasm is faster
  - wasm allows web compilation
  + wat allows wat2wasm compiler optimizations
  + wat allows debugging
  + wat can be done via wat-compiler

  * Can be both I suppose, but needs researching wat format - mb we can utilize fn tables in better way

## [x] Scope or not to scope? → make () a block if new variables are defined there

  + maybe we need `{}` as indicator of scope: outside of it variables are not visible.
  - (a,b)=>a+b also creates scope: a and b are unavailable outside of fn body - why not stretching that to language?
  - look at [erlang functions](https://www.erlang.org/doc/reference_manual/functions.html): they use only `;` and `.`

  * ? blocks: {} vs ()
    . {} feels somewhat movetone.
    . block basically needs limiting variable scope, it doesn't have sense on its own.
    → we can make () a block if that includes variables definition, otherwise not.
    + we may require block if new variables are defined, else args must be used.
    + () makes warmer inside, sort of nest in literal sense.

## [ ] Inlining / Mangling / compressing

  * language should not break inline composability, like it does python or livescript: you can tightly pack code into a single line.
  * language should be mangle-able, therefore names should not have prefixes
    ~ mangling can recognize that
  * Spacing material should not have any syntactic meaning. `;` should be a default separator.

## [x] Compiler: How do we map various clauses to wat/wasm? → `alloc` function, untyped (f64 by default), see audio-gain

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

## [x] Compiler: How do we organize output of function (array)?

  * Predefined memory statically indicated locations of input/output.
  * Dynamized memory loses output location, unless indicated by arguments...

  ? Can we avoid that by providing OUTPUT_PTR?
    - not really. We should pass output pointer and size to detect channels.
  →  + not necessarily. If we follow array method (see above), we can return pointer to first element of array, but 0 element indicates its length, so we can easily grab length from pointer.


## [x] Clauses: it seems to be useful to let fns to be redefinable.
  + (input, aParam, kParam) signarure handles any-channels input
  + (i1, i2, i3, a, k) handles multiple inputs
  + ((l, r), a, k) handles per-channel input
  + return a, b, c - returns multiple outputs
  + return (a, b, c) - single multichannel output
  → so group acts as single element

## [x] Autogenerate mono/stereo clauses fn code or define fn clauses manually

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

## [x] ? Should we provide param types or not? Yes - having prefixed params is very handy (see arguments)

  1. hide implementation detail of kRate/aRate and generate both clauses depending on input type.
    - see zzfx: myriad of params generate O^2 clauses. A mess.
  2. generate params via typescript system
    - colon is too ambiguous
    + very common: rtype, hegel, flow use same notation
    - needs separate type parsing/tracking subsystem, whereas name immediately reflects type
    + allows multitype definition as `frequency:aParam|kParam`
      + this solves redirection problem
  3. ★ use csound-like prefixing for identifying params: ifrequency, ainput, gi
    + melds in global params organically `gTime, gSampleRate` (which is glsl-familiar)
    + name reflects type constantly
    + shortness
    - problematic destructuring of multiple channels: gain((al,ar) in -1..1)
      ~ can be mitigated by default params falling back to a-type `gain((l,r) in -1..1, kGain)`
    + resolves conflict of fn name and param: gain vs kGain, delay vs kDelay
    + that also works good as indicator of non-argument variables
    ~ ? should non-prefixed params possibly generate two versions?
      + default params better be direct fn values (helps problematic defaults case), prefixed - for batch
    - unclear how to redirect a-param clause to k-param
      ? name multiprefixed as `akVolume`
        + csound's gi proves for this case
        - ? how do we make direct param, aParam and kParam altogether?

  4. `amp as kParam`
    + same as 2
    + no destructuring issue
    + more human-readable
    - longer lines, ~ although not much longer than colon
    - mb conflicting with `in` keyword

## [x] Processing function reads from memory; regular function takes arguments. → use prefixed params to indicate type

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

## [ ] Direct values clause is hindered by clause selector

  * ? How do we select direct values clause? `gain(inp, .75, outp)`
    ~ `gain(inp, .75, outp, 2)` is fine (null-arg means direct)

  * ? How do we export direct-values functions [ideally] without extra step of args detection?
    ~ the worst-case damage is extra fn call + extra nan comparison that sees - ok, there's no signature, fall back to direct call.
    ~ single runs are not expected to be very regular externally, since for batch runs there's clause cases.

  * ? Since we decided to use prefixed params, default params generates only direct function.
