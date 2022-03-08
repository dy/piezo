# Language design / issues R&D

## [x] frames as vectors

  * like glsl (data views to underlying block buffer), with [standard channel ids](https://en.wikipedia.org/wiki/Surround_sound#Standard_speaker_channels); swizzles as `a.l, a.r = a.r, a.l; a.fl, a.fr = a.fl`

## [x] `import a,b,c from 'lib'`, `import sin from 'stdlib'`

  * ? How do we redefine eg. sin from stdlib?
    ? Just reassign to var or give another name? Every fn has unique name?
    → import only subset, like `import sin from 'stdlib'`

  → default is going to need a name to be importable directly

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
      ~ we have funcref type, not necessary
    + ranges?
    + arrays
  * ? we can use i64 for them
  * ? or we can use f64 for all numbers by default and keep rest of types free

## [ ] Numbers: float64 by default, unless it's statically inferrable as int64, like ++, +-1 etc ops only

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
          + plays well with implicit arguments #t, #i etc.
    * `source | filter(freq, Q)` → `filter(source, freq, Q)` is fine convention. Placeholder is a pain, we 99% of time don't need that.
      * ? Maybe worth renaming to `source |> filter(freq, Q)` to avoid confusion with `|`
        - nah, `source | gain(.45)` is oldschool coolness, prob just fn clause: takes prev argument.
  → The converging solution is: use implied argument as `gain(#input, amp) = gain(#input, amp)`
    * that utilizes multiple fn clauses organically and enables simple overloading as `source | gain(amp)`
  * ? what if we do OO as  `pipe gain()` or even `source | gain(amp in 0..1) = gain(source, amp)`?
    + direct meaning
    - generalized operator overloading

## [x] Lambda → generalized fn by callsite, spawning creates bound call

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
      * can be done as single funtion with many args identified by callsite, but in-place we call it with some predefined args
        → by spawning a function somewhere, we spawn generic reference with predefined arguments, eg.
        → `Comb(a) = x -> x + a` → `CombArr(a,x) = x+a;  Comb(a) = CombArr.bind(a)`
  ! → operator must uniquely identify type and be macros

## [x] Reduce operator: converts into single expression (fixed length) OR applies reduce

  * ? Reduce operator? It can be eg. `:>` (2 become 1), or `=>`.
    * ? `a,b,c :> reducer`, like `signals :> #0 + #1`
      - `:>` looks like expecting some input or something.
    * ? Or maybe `a,b,c ||> a,b -> a + b |...`
    * ? `a,b,c => a,b ->a+b`
    * ? `a,b,c ..> a,b -> a+b`
    → `(a,b,c) >- a,b -> a+b` (crazy!)
  ! >- operator can be statically analyzable if group length is known (it should be known)

## [x] Units → makes formulas too noisy.

  * Units possibly intrudoced as `10k`, `1s`, `1hz`, `1khz`

  * ? 1pi, 2pi, 3pi, 3.4pi etc.
  * 1k, 1M, etc.
  * 1s, 1m, 1h
  * 0:12

  - .5pi/2 etc - complicates parsing, makes formulas unusual occupies 0xa, 12n, 0b2 namespaces.
    → very simple to instead do 1/2*pi, 60*h + 10*m
  - we can't include all units anyways, it's pointless

## [ ] End operator

  * `.` operator can finish function body and save state. `delay(x,y) = ...d=[1s], z=0; d[z++]=x; d[z-y].`
  * ? is it optional?
    * eg. `noise(phase) = sin((phase % (PI*2))**3)` - what would be the point here?
  - it makes direct sense only in case of unnested body. When body is nested - not as much.
  - it creates confusion with block as `).` vs `.)`
  + maybe for unwrapping it is still useful.
  - conflict with global variables init. x=1+2;y()=x+1. - like, why? better make as simple assignment.

## [x] State management → function state identified by callsite

  * load previous state as `...x1, y1, x2, y2`
    + yes, that acts as hooks from react
    + that solves problem of instancing
    + identified by callsite

## [ ] Named array items

  * named properties in arrays? `[1,2,3,a:4,b:5]`
    ~ reminds typescript named tuples
    ~ should find exactly where we'd need that
  ? Maybe can be done purely as aliases for position?

## [x] Elvis operator: `a ?: b` instead of jsy `a ?? b`
  * ~ equivalent to a ? #0 : b

## [x] Init operator: `a ?:= b`
  - pointless: `a = a && b` is a bit meaningless construct, isn't it, we need `a = a ? a : b`, `a = a ?: b`, or `a ?:= b`

## [x] short ternary operators as ` a > b ? a = 1;` → use elvis `?:`
  + it not only eliminates else, but also augments null-path operator `a.b?.c`, which is for no-prop just `a.b?c` case.
  - weirdly confusing, as if very important part is lost. Maybe just introduce elvis `a>b ? a=1` → `a<=b ?: a=1`

## [x] Loops: `i in 0..10 :| a,b,c`, `i in src :| a`, `[x*2 |: x in 1,2,3]`
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
      - it subtly conflicts with elvis operator `x in 1..10 ?: body`, but `x in 1..10 :| body`
        ~ not necessarily - elvis has inversed intuition
      + `x * 2 |` is close intuition to standard list comprehension syntax
    b. `x < 5 |: x++`,  `x++ :| x < 5`, `[ x in 1,2,3 |: x*2 ]`, `[ x * 2 :| x in 1,2,3 ]`
      + refer to looping body, not condition, which is better by musical intuition
      + it matches elvis operator `x < 5 ?: x++`, `x < 5 |: x++`
        + muscle memory of ternary/elvis
        - it's not elvis by meaning: elvis does "else" branch, when condition is not true, whereas loop does "true" condition.
      + has pipe operator intuition: by some condition produce the following `whileTrue |: produceItem`, `item :| whileTrue`
        + colon gives hint as "multiple" instances created on the right, following `|>` operator intuition
    - something's off...
  * ? We can take almost purely math convention instead of objects `{ x < 5: x++ }` - procedural call
    ~- with same success can be used without {} - these brackets don't make much sense here only visually
  * ? We can take even simpler convention: { x < 5; x++ } - loops over until last condition is true.
    - do..until version, not much useful on its own. Can be used as combo with above.

### [x] loops can return a value: `(isActive(it): action(it))` - the last result of action is returned
  + useful for many loop cases where we need internal variable result.

## [x] ? Is there a way to multi-export without apparent `export` keyword for every function?

  * ? maybe it's good there's apparent `export` indicator - easy to scan and in-place, compared to accumulated export at the end.
  → C++ exports implicitly function clauses.
  * ? Should we export at all? Maybe we can just export all by default and assign main function, as it is done in C?
    - not having export keyword is asymmetric with import
      ? should we rename it to include?
    - import signature isn't infix. Prefix?
  * Exporting overloaded function that imposes tax of implementing clause selector for JS; in wasm that's not necessary.
    * We could export for JS exactly the indicated clause?
      ? how would we export multiple clauses?
        → easiest would be to provide JS wrapper. The variety of WASM export forms is huge.

## [ ] Arrays: should have standard map, filter, reduce methods or not?
  * ? what if we don't deal with arbitrary-length arrays?
    + it guarantees memory limitation, "embeds" into syntax
    + it removes much need in syntax around arrays like map, filer: it can be as `(a,b,c) | map`
  → ok, for map use groups `(a,b,c)(fn)` or `a,b,c | i->i**.5`
    . for reduce use `a,b,c >- fn` or `a,b,c >- a,b -> a+b`
    ! that is in fact mixing operator! a,b,c >- mix
    !? we can reduce based on reducer's number of args

## [x] Concat/flat groups → no need to flattening/deep nesting
  * ?is done via range operator a, ..b, c..d, e (shortened spread)

  * ? destructuring is `a,b,c = ..d`
    - nah, just do `(a,b,c) = d`
    ? Alternatively: do we need nested structures at all? Maybe just flat all the time?

## [ ] -< operator: splits list by some sorter: `a,b,c -< v -> v`

  * ? or in fact multiplexor? selects input by condition? like a,b,c -< x -> x > 2 ? 1 : 0

## [x] comments: //, /* vs ;; and (; ;) → use // without /*
  + ;; make more sense, since ; is separator, and everything behind it doesnt matter
  + (; makes more sense as "group with comments", since we use only ( for groups.
  + ;; is less noisy than //
  + ;; is associated with assembler or lisp/clojure
  + even simpler - everything after ; can be considered a comment?
  - pretty unusually associates with autohotkey, which is the opposite of fast
  - too innovative
  - single-comment breaks inline structures like a(x)=b;c;d.
  - // associates besides C+/Java/JS with F#, which is pipy
  - // is noisy conflict with / and occupies operator space, eg.:
  ```
    tri(freq in 10..10000) = (
      ...phase = 0  // phase state
      phase += freq * pi2 / sampleRate
      (1 - 4 * abs( round(phase/pi2) - phase/pi2 ))
    )
  ```
    ~ just reformat

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
  . (a,b,c) = d,e,f     → a=f[0], b=f[1], c=f[2] // or destructure first? last seems to be convention everywhere
  . a,b,c = (d,e,f)     → a=(d,e,f),b=(d,e,f),c=(d,e,f)              // assign last
    - contradicts to js intuition where only c = (d,e,f)
  → so there are 2 meanings:
    . () makes group a single component
    . , makes group, but separate components

  ~ group destructuring
  . (a,b,..cd) = (a,b,c,d) → a=a,b=b,cd=(c,d)
  . (a,b,c,d) = (a,b,..cd)
  . (a,..bcd) = e → a=e[0], bdc=e[1..]

## [x] Array slice takes ranges a[1..3], unlike python

## [x] Notes as hi-level aliases for frequencies A4, B1 etc.
  * import 'musi' - imports all these constants
  + allows building chords as (C3, E3, G3) = Cmaj
    ~ would require # to be valid part of identifier

## [ ] ? Parts of identifier: $, #, @, _
  + allows private-ish variables
  + allows notes constants
  ~ mb non-standardish

## [x] ? Should it compile to wat or to wasm? → wat for now

  - wasm is faster
  - wasm allows web compilation
  + wat allows wat2wasm compiler optimizations
  + wat allows debugging, bytecode can be hardstone
  + wat can be done via wat-compiler and other better fit for that mappers

  * ? Can be both I suppose, but needs researching wat format - mb we can utilize fn tables in better way

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
  * Spacing material should not have any syntactic meaning, like JS does for newlines. `;` should be a default separator.
    * what if we detect next expression as next unrelated operand, regardless of separator?

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

  10. Ok, proper way is alloc or array (see @audio/gain.wasm)
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
    * memory can store last available item in global variable
      + allows manual memory management
      - doesn't allow sharing memory easily

## [x] Compiler: How do we organize output of function (array)?

  * Predefined memory statically indicated locations of input/output.
  * Dynamized memory loses output location, unless indicated by arguments...

  ? Can we avoid that by providing OUTPUT_PTR?
    - not really. We should pass output pointer and size to detect channels.
  →  + not necessarily. If we follow array method (see above), we can return pointer to first element of array, but 0 element indicates its length, so we can easily grab length from pointer.


## [x] Clauses/function overload: → optional, but can select by argument type (pointer vs value)
  + (input, aParam, kParam) signarure handles any-channels input
  + (i1, i2, i3, a, k) handles multiple inputs
  + ((l, r), a, k) handles per-channel input
  + return a, b, c - returns multiple outputs
  + return (a, b, c) - single multichannel output
  → so group acts as single element
  - clauses impose clause selector. That selector can be implemented manually or in JS side.
    + not necessarily. Static-time clause can be preselected within wasm.
    + providing different clause increases efficiency: eg. 2-channel processor can be faster than n-channel.
  - no-selector simplifies API: no need to pass number of channels.
  ? what if we provide generic clause selector?
    ~ preselecting clause is similar to creating fn instance.
  - direct case allows 1:1 arguments matching in fn signatures.
    - it is faster, unambiguous, unconflicting
  * This is optional extension, can be avoided.
  * Case can be identified by passing pointers to "audio buffers" - channeled arg slots.

### [x] Direct values clause is hindered by clause selector →

  * ? How do we select direct values clause? `gain(inp, .75, outp)`
    ~ `gain(inp, .75, outp, 2)` is fine (null-arg means direct)

  * ? How do we export direct-values functions [ideally] without extra step of args detection?
    ~ the worst-case damage is extra fn call + extra nan comparison that sees - ok, there's no signature, fall back to direct call.
    ~ single runs are not expected to be very regular externally, since for batch runs there's clause cases.
    ? we detect from apparent channels idicator: gain(v, amp) is direct clause, gain((..ch), amp) is all-channels clause

## [x] Autogenerate mono/stereo clauses fn code or define fn clauses manually in syntax

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

## [x] ? Should we provide param types or not?
  * kParam type clause can save 1024 memory reads per block.

  1. hide implementation detail of kRate/aRate and generate both clauses depending on input type.
    - see zzfx: myriad of params generate O^2 clauses. A mess.
      → we need some indicator of param type
  2. generate params via typescript system
    - colon is too ambiguous
    + very common: rtype, hegel, flow use same notation
    - needs separate type parsing/tracking subsystem, whereas name immediately reflects type
    + allows multitype definition as `frequency:aParam|kParam`
      + this solves redirection problem
  3. ✱ use csound-like prefixing for identifying params: ifrequency, ainput, gi
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
          ~ we don't necessarily need that for the case of dsp instance: direct params are for direct functions.
      + not sure if we necessarily need that. WAA doesn't have that, it's web-audio-engine invention.
        + it also complicates detection: disables kParam to have multiple channels also makes constructor require param type.
          * just use a-param if you need accurate/per-channel values.
      ~ in this case we can assign a-prefix to audio params, and k-prefix for all else
        + accurate params supposedly come first
        + k-rate params may not need channels or could even be direct...
  3.1 We can assign a- prefix for a-params, discard k-params as direct values
    + allows getting rid of `dsp` prefix
    + solves historical problem of k-param naming (no need for k prefix)
    - `ax` instead of `x`, `aInput` instead of `input`
      ~ not necessarily bad - `a` prefix is good indicator of channel-read.
    - some functions are dsp with 0 params: like songs, fully uncustomizable

  3.2 Instead of prefixes, we can demand channeled inputs be explicitly indicated as
    `gain((l,r), amp)`, `gain((l), amp)`, `gain((...ch), amp)`
    + very explicit difference and logic
    - `...ch` is non-conventional operator, it's used for state recovery, not args destructuring
      * ? what if we use range instead `gain((0..16), amp)`
        - numbers are meaningless, not clear how to iterate non-numbers
        - fixes to some particular number of channels, we need unbound
    * see 7

  4. `amp as kParam`
    + same as 2
    + no destructuring issue
    + more human-readable
    - longer lines, ~ although not much longer than colon
    - mb conflicting with `in` keyword

  5. GLSL, C-style `gain(kParam amp in 0..1)`
    + nicer style than comma operator
    - doesn't allow multiple types

  6. Since we need main function to be exported, we can build clauses only for it, automatically.
    + no param type headache and even notion
      + no question of redirecting a-clause to k-clause
    + easy internal functions interchange
    + automatic management of global time and index
    - still myriad of clauses for only zzfx

  7. ✱ what if we use unclosed range `gain((..ch), amp)`
    + matches array allocation `[..16]`
    + similar to args collecting `fn(...args)`: intuition is `[..args]` - spread args or create from range, `(..args)` - collect args...
      ? + then matches destructuring as `(a,b,..cd) = (a,b,c,d)`
    ? how do we redirect channeled input to non-channeled (k-rate)?
      → direct clause gain(v, amp) or channel clause gain((..v), amp) is detected statically
      → internally they're used as direct case, not batch.
        - that would require direct case compilation or sort of special internal batch call
    ?~- is that just clause indicating layout?
      ? is there an exported API case when this is used directly, not as batch?
        + for multi-channels we'd need some memory layout anyways, batch is just natural extension.
        ~→ we can pass blockSize as last argument - compatible with other DSP frameworks.
          + which allows avoiding blockSize global.
            ~- we'd going to need to take sampleRate argument as well then.
              ~+ not necessarily: global sampleRate can be useful itself


## [x] `t`, `i` are global params? Or must be imported? Or per-sound? -> manual time management

  * ? cannot be imported since generally global-time t/i are unknown. Mb defined as `...t as time`?
    - try avoid typing
  * ? or `#t`
    - try avoid too magic
  * Sound can be called multiple times, so timer per instance makes sense.
  . Time doesn't make sense as external parameter, since user cannot modify it, it flows forward, like state:
  . it has init moment and increases over time, not necessarily steadily.
  ? add specifier to initializer as `...t=0 as time, i=0 as index, rate as sampleRate`
  * ? may we need access to current time / index params of a particular instance?

  * floatbeat & co pass only `index` param called `t` - meaning depending on sample rate can be modified any way.

  * ? adsr may be called multiple times within same song, and it has internal t param.
  * that is also useful to any sound function basically, so we need per-fn time param. How?
    a. `t` as local param. adsr(t, a,d,s,r)
      + standard notation
      - redundant code
      - conflicting with batch runner: first argument doesn't necessarily have meaning
    b. `t` as implicit fn param, taken as `gt` by default. adsr(a,d,s,r), adsr(a,d,s,r, #t=0)
      + like context, but may pass multiple implicit variables
      ? mb acts as css
      + "gates" reserved keywords, allowing prefixed reserved names
      + plays well with #in as input from pipe operator
      + prefix allows implicit arg come in any order
      + allows passing "reset" param
      - still redundant code: passing param here and there is mess
    c. `t` as part of function state, which is defined as `...t`, eg. `...t as time`
      + more explicit definition
      + naturally reflects number of times this fn was called
      ? how do we expose that? do we need to expose that?
      + plays closer with stateful definition
      + time is usually relative, so it's rather internal for a function...
      ~ we then need means of resetting it
        1. new fn()
          - looks like class
          - resets too much
        2. [process, reset] = Gain() (~hooks)
        3. reset manually by condition eg. if (x>100) x=0.
    d. `sync` keyword? meaning time is synced with time of caller.

  * time management is easy part. It can trivially be done within function itself: `...t=0, t++`
    + avoids complexities of implicit params, function context, special timely batch etc.
    + floatbeat is just t === index.
    + unleashes batches to any function


## [?] Instantiation of sound → no instantiation, use function state for manual tracking time/params.

  1. ? Instantiate sound externally via module instance?
    + resets and tracks globals per-environment
    + naturally very simple API, no constructing complications
    + t,i,sampleRate etc. params are accessible globally
    - any exported function iterates i, t params === makes single processor per instance
      - we need multiple processors exported, eg. latr library - should be useful itself.
        ~ not necessarily. Sonr can be relatively isolated thing and provide single export on build of a single processor.
          + that reduces number of generated codebases.
          + that complies with AudioWorkletProcessor - one instance per audio node.
      → there must be context per processor
        → context can be done as module instance
    * 290ms for 30k instances - comparable with subscript parser.
      - slowish for just instancing
    - still needs some convention for "main" method
      ~ can simply be "last function is result of module", like last expression in function
        + that builds nice structuring convention for all son programs - user knows where to look up for main processor.
        -? what if last item in module is not a function, but eg. global?
          - it returns global then and not processing function...
    + doesn't have problems with collecting old instances (gc covers that)
      + doesn't grow memory within processor
    - channel case selector is part of processing function
      + makes JS API simpler: only provide channels for a-params
    ~- exporting single method makes module unusable by other modules, eg. we can't redist songs and stick to main function convention.
      - main export function is no different from any other t-dependent sound producing function.
      ~ ok, hooks-like state allows thespassing this limitation

  2. ? Or take `t`,`i` as param?
    * We may need to call same function with different time within same sound.
    ? Should it be implicit-default-function param, like `f(#t=gTime)` and to call `f(a,b,c,#t=localTime)`?
      + ? this can also be used for pipe input as `f(#input)` or...
    - it would require manual time management...
  3. ? Or have `main` method?
    + reset t, i, similar to subscript.
      ? does it imply some main method iterating `idx, t` values?
      ? or that implies some init/config method, sort of csound orchestra definition below?
        - doesn't provide automatic iteration.
    + allows orchestra definition
    + `main` name: C, GLSL, C#, D, Go, Haskell, Java, Python(ish), Rust
      - mathematical name `f` is shorter and nicer, less descriptive though
      - in JS default has more meaning.
  3.1 JS has `default` export convention available.
    + invites to rename to any fn name: `main`, `gain`, `process` etc.
    + if not occupied leaves `default` hanging
      - not necessary, since importing wasm is not yet part of ES

  4. default function acts as config, returning main processing function
    * ~ webassembly allows returning funcref result, meaning - functions can return functions
    * `let gain = createGain(sampleRate: 44100, 0dbfs: 1)`
      + it can even return array as `let [gain, reset] = createContext(sampleRate, 0bfs)`
      - not necessary to have default
      - redundant structuring: sampleRate can be global
      - there really can be various "processing" entries

  5. we can have a special keyword indicating processing nature of a function.
    * ? make all exports processors?
      - no, we may need to reuse other non-processing functions
    * ~ `process gain() = `
    * `channels gain()=`, `block gain()=`, `audio gain()=`, `bulk gain()`
    * `batch gain()=`
      + literally meaning of `https://en.wikipedia.org/wiki/Batch_production`
    * `produce gain()=`, `producer gain()=`
      - not necessarily producer, can be filter or processor
    * `prod gain()=`
      ~+ production.
    * `gain...() = `?  `gain()... = `?  `...gain()=`,  `*gain()=`,  `gain*() = `
      - too mysterious and not clear
    * `[gain]() = `? `gain[] =` ? `gain[..blockSize]()`
      + Square brackets indicate block, as for "array" processing
    * `signal gain()`?  `sig gain()`?
    * <3 `dsp gain()`?
      + signal, processor on their own is not enough, dsp is stable known acronym
      + short, known, standard-ish, has meaning "digital signal processor"
    * `through gain()`? `gen gain()`? `dest gain()`? `pipe gain()`?
    - it's still not enough for instantiation: what if we export multiple processors? they all would share same time therefore could not be reused.
      - creating module instance per processor is overkill-ish.

  6. Capfirst function = DSP?
    + resolves processor/param naming conflict `Gain(gain in 0..1)`
    - makes fuctions in syntax more complicated than needed. `dsp gain` is direct minimum.
    ~ maybe we better keep dsp keyword as indicator of not simple function

  7. Create instances as `[process, reset] = gain(...channels)`
    + provides config
      - not convinced it's needed
    + config can potentially take number of channels and type of params `[process, config] = gain(2, 1)`
      ~ `sampleRate` can indeed be global
    + allows pre-select clause to use for mass-processing, depending on number of channels and type of param.
      ~- doesn't let dynamic switch of channels, need to have multiple instances for simple action
    + less problem with fn args number detection
      ~- isnan is not a big deal
      - number of args can indicate k-params more precisely
    - grows memory, ostensibly slow but irrevokably
      ~+ can rotate instances by calling `reset`
      ~- reset can also be implemented as module-wise method and module can be reused too.
      ~ still need memory delegation per function for allocating state
    + makes use of `alloc`
    - complicates JS API by initiation step
      + doesn't need to export alloc for JS API, if that also creates refs to memory locations
    ~~hides current value of global time, global index~~ → no need for global state
    + could allocate memory / callsite id at the same time.
    + even simple functions may have state = therefore we need to instantiate callsites.
    - instances cannot reuse same memory
      ~+ instance fn can still take all created pointers (or any other pointers)
        - clauses if reuse memory cause shallow alloc
    - makes direct functions impossible, as well as functions with kParams
      ~ can be alleviated by `[fun] = fun()`
      ~+ if instance fn takes pointers, can take kParams then
  7.1 instead of instance constructor, we can call fn directly, and that creates instance the first call
    + allows direct fn calls
    - tricky js API

  8. `@batch()` decorator
    + decorator is right meaning
    + able to initialize batching params (channels? rate?)
      -~ doesn't seem we have params to pass
    - extra concept

  9. Hooks-like callsite-identifined state.
    - we're going to need to identify not by the last callsite, but by the full stack.
      * imagine a→coin()→adsr(), b→coin()→adsr(). adsr is called from the same callsite, but by different external method.
      → all exported fns must obtain instance id somehow (mem offset?) and pass it through;
      → all internal fns must pass parent callsite id + internal callsite id to internal calls;
      → since we don't provide instancing mechanism, JS instancing is done either via stack/ctx id (mem offset), or regular wasm instancing.
        ? Can we maybe expose methods allocating memory for all fn reqs? There's too plenty of them: `args per channels, output, context/callsite`
          * context also may require special amount of memory, it's not clear how to allocate it from user side
          ~ that is similar to instancing from 7.
          ~ fn can reserve memory for itself, context/callsite args may not be necessary
            * eg. on instancing of WASM module
    → we could provide global `instance` variable, switching current context, but that duplicates native switching.
      → better export global `reset` to enable instance rotation.
      → generally functions allocate own memory on first call, with assigned unique callsites within current instance.

## [ ] Batch function reads from memory; regular function takes arguments. How to differentiate them? → detect batchable function from channeled inputs/outputs.

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
      - nah, prefixes are too limiting & that's anachronism
    - can be problematic destructuring: `gain((al,ar) in -1..1)`

  4. Imply batch from channel inputs gain((..ch))?

## [x] Output number of channels can be detected from the last operator in fn body.
  * gain((..in), amp) = (..in)*amp

## [ ] Batching

  * Batch runs a fn against some context like `#t, #i, #sampleRate, #blockSize`, incrementing #t/#i
  * Batch must compile fn clause, not take some fn
    → we don't batch compiled clause/function by external means, batch is special defined-in-advance clause with loop inside
  * batch can take last argument as number of items to process (count)
    - that implies for multichannel input to pass pointers to each individual channel, or else that count gets meaning of "blockSize"

## [ ] Tree shaking
  * must shake off unused fns in compilation

## [ ] Latr: alloc, array etc.
  * latr can provide alloc and other common helpers

## [ ] Array/string length
  * Ref https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(array)
  * Ref https://en.wikipedia.org/wiki/Cardinality
  * Lua, J langs propose # operator for length
  * Icon, Unicon propose * operator for length
  * Math notation is |a|
  * ? `melody_string[]`
    ~+ sort of math association
    ~+ sort of #, but not as generic
    + empty array is unused anyways
  * ? We can do |a| operator for abs(a) or a.length
  * ? We can do a[0] for array length, and start items from 1: a[1], ...
    + last element coincides with length, a[a.0] === last
  * ~ we still may want to have .last, .length aliases
