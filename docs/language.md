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
  ! >- operator can be statically analyzable if group length is known (it should be known)
  ! -> operator must uniquely identify type and be macros

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
* ~~Walt − more serious layer language, very JSy: [Walt](https://github.com/ballercat/walt)~~ compiles to wrong wat
* [chasm](https://github.com/ColinEberhardt/chasm/blob/master/src/emitter.ts)
* [mono-lib](https://github.com/stagas/mono/blob/main/src/lib.wat.ts), [monolib](https://github.com/stagas/monolib/blob/main/src/index.ts)
* [webassemblo examples](https://openhome.cc/eGossip/WebAssembly/index.html)

## Points

* drop `source | filter() | reverb() | fx()` and get controls with defaults; changing controls changes values;

* frames as vectors like glsl (data views to underlying block buffer), with [standard channel ids](https://en.wikipedia.org/wiki/Surround_sound#Standard_speaker_channels); swizzles as `a.l, a.r = a.r, a.l; a.fl, a.fr = a.fl`

* `input` is main input frame, `inputs` - list of all inputs, eg. `input === inputs[0]`
  → Alternatively: just enforce it as first argument.
    + same way elixir, F# pipes work
    + makes no reserved keywords
    + indicates apparently expected behaviour
    + reduces infinite-input array case
  → For multiple inputs just list them as `mix(a, b, c)=a+b+c`
    . Maybe we just need to indicate that as input: `filter(x as input)` (aRate + default entry)
    ! we can explicitly refer to reserved keywords via `#var`, which looks cool both as github/url ref and provides unchangeable meaning `#in`, `#in[0]`, `#in.l`

* ? `t`, `i` are global params? Or must be imported?
  ? cannot be imported since generally global-time t/i are unknown. Must be defined as `...t as time`.
  → even better: `#t`

* `f(x, y) = x + y` standard classic way to define function in math
  + also as in F# or Elixir

* Define params/vars range as `f(x=100 in 0..100, y=1 in 0..100, z in 1..100, p in 0.001..5) = ...`

* Swift: non-inclusive range is 0..<100

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

* !? erlang strings: "hello" === [104,101,108,108,111]
* !? erlang atoms: 'hello' (not string)

* `import a,b,c from 'lib'`, `import sin from 'stdlib'`
  * ? How do we redefine eg. sin from stdlib?
    ? Just reassign to var or give another name? Every fn has unique name?
    → import only subset, like `import sin from 'stdlib'`

* no import default, no export default - every fn got a name

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
    * vs (ideal) `...a = a0,a1,a2,a3 | stretch(rate) | Comb()`
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

* should there be lambda? `value | x -> x*.6 + reverb(x) * .4`
  - lambda function has diverging notation from regular fn definition.
  ~ although `param -> result` is also classical math notation
  + lambda funcs also don't need brackets, just `a,b,c -> a*2 + b*3 + c*4`
  + lambda funcs have no state, they're just in-place routines (I guess level of macros, not table subroutines).
  → let's first find out how much these operational pipes are useful. Maybe not.
    + although lambda is useful for currying fns also

* ? Reduce operator? It can be eg. `:>` (2 become 1), or `=>`.
  * ? `a,b,c :> reducer`, like `signals :> #0 + #1`
    - `:>` looks like expecting some input or something.
  * Or maybe `a,b,c | a,b => a + b |...`
    - nope: we cannot reuse reducer defined elsewhere. It must be different `|` character
  * ? `a,b,c => a,b ->a+b` * ? `a,b,c ..> a,b -> a+b`
  → `a,b,c >- a,b -> a+b` (crazy!)

* Use comma-operator groups as
  . `a,b = b,a`
  . `a,b,c + d,e,f → (a+d, b+e, c+f)`
  . `(a,b,c).x() → (a.x(), b.x(), c.x())`

* Units possibly intrudoced as `10k`, `1s`, `1hz`, `1khz`

* `.` operator can finish function body and save state. `delay(x,y) = d=[..1s],z=0,d[z++]=x,d[z-y].`
  . it's still optional

* load previous state as `...x1, y1, x2, y2`

* named properties in arrays? `[1,2,3,a:4,b:5]`
  ~ reminds typescript named tuples
  ~ should find exactly where we'd need that

* short ternary operators as ` a > b ? a = 1;`
  + it not only eliminates else, but also augments null-path operator `a.b?.c`, which is for no-prop just `a.b?c` case.

* loops: `for i in 0..10 (a,b,c)`, `for i in src a;`
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
    + it's like tail of ternary `a ? b : c : d`
      ? what about loop inside of a loop? `x++ < w : y++ < h : (x,y)`
        + yes, nested loops can be comma-defined `x++<w, y++<h : ...;`
    * ? or make label at the end? `(x,y) : x++ < w, y++ < h`
      + this is more classic math notation
      - a bit unusual and forces first step
      ~ math notation for loop is either `∀A,∃B:A<B` or `∀{x∈N,0<x<10},yx=x**2`

* ? Is there a way to multi-export without apparent `export` keyword for every function?
  → maybe it's good there's apparent `export` indicator - easy to scan and in-place, compared to accumulated export at the end.

* ? t param: local per-sound, or global?
  . Sound can be called multiple times, so timer per instance makes sense.
  . Time doesn't make sense as external parameter, since user cannot modify it, it flows forward, like state:
  . it has init moment and increases over time, not necessarily steadily.
  → add specifier to initializer as `...t=0 as time, i=0 as index, rate as sampleRate`

* ? Arrays: should have standard map, filter, reduce methods or not?
  * ? what if we don't deal with arbitrary-length arrays?
    + it guarantees memory limitation, "embeds" into syntax
    + it removes much need in syntax around arrays like map, filer: it can be as `(a,b,c) | map`
  → ok, for map use groups `(a,b,c)(fn)` or `a,b,c | i->i**.5`
    . for reduce use `a,b,c >- fn` or `a,b,c >- a,b -> a+b`
    ! that is in fact mixing operator! a,b,c >- mix
    !? we can reduce based on reducer's number of args

* Concat/flat groups is done via range operator a, ..b, c..d, e (shortened spread)
  * destructuring is `a,b,c = ..d`
  ? Alternatively: do we need nested structures at all? Maybe just flat all the time?

* `,` in functions doesn't act as end of function, instead - expects continuation:
  `a() = b,c,d;`
  * `;`, `\n` or `.` act as end of function.

* language should not break inline composability, like it does python or livescript: you can tightly pack code into a single line.

* Scope or not to scope?
  + maybe we need `{}` as indicator of scope: outside of it variables are not visible.
  - (a,b)=>a+b also creates scope: a and b are unavailable outside of fn body - why not stretching that to language?
  - look at [erlang functions](https://www.erlang.org/doc/reference_manual/functions.html): they use only `;` and `.`

* Elvis operator: `a ?: b` instead of jsy `a ?? b`
  ~ equivalent to a ? #0 : b

* Spacing material should not have any syntactic meaning. `;` should be default separator.

* -< operator: splits list by some sorter: `a,b,c -< v -> v`
  ? or in fact multiplexor? selects input by condition? like a,b,c -< x -> x > 2 ? 1 : 0

* comments: //, /* vs ;; and (; ;)
  + ;; make more sense, since ; is separator, and everything behind it doesnt matter
  + (; makes more sense as "group with comments", since we use only ( for groups.
  + ;; is less noisy than //
  + ;; is associated with assembler or lisp/clojure
  - pretty unusually associates with autohotkey, which is the opposite of fast
  - too innovative.

* It can compile 3 processing cases for number of channels: mono, stereo, generic.
  . Maybe decide based on what channel access was used
  . ? what does it mean mltichannel processing for 1-channel node? Only left channel available?
  * Args to send to process function: `sourceChannels, destinationChannels, numberOfChannels, framesToProcess, ...aParams, kParams, blockSize`

* Clauses: it seems to be useful to let fns to be redefinable.
  + (input, aParam, kParam) signarure handles any-channels input
  + (i1, i2, i3, a, k) handles multiple inputs
  + ((l, r), a, k) handles per-channel input
  + return a, b, c - returns multiple outputs
  + return (a, b, c) - single multichannel output
  → so group acts as single element

* ? Possibly we can hide implementation detail of kRate/aRate and just generate both clauses depending on input type.

* Grouping notes:
  ~ likely we have to swipe precedence of , over =
  . a,b,c = d,e,f       → a=d,b=e,c=f
  . (a,b,c) = (d,e,f)   → a=d, b=e, c=f          // destructured-assembled
  . (a,b,c) = d         → a=d[0], b=d[1], c=d[2] // destructure
  . (a,b,c) = d,e,f     → a=f[0], b=f[1], c=f[2] // or destructure first?
  . a,b,c = (d,e,f)     → a=(d,e,f),b=(d,e,f),c=(d,e,f)              // assign last
  → so there are 2 meanings:
    . () makes group a single component
    . , makes group, but separate components

* Units
  * 1pi, 2pi, 3pi, 3.4pi etc.
  * 1k, 1M, etc.
  * 1s, 1m, 1h
  * 0:12

* Notes as hi-level aliases for frequencies A4, B1 etc.

* ? Orchestra definition
  * We can use csound like initial definition:
  sr = 44100, 0dbfs = 1

* ? Should it compile to wat or to wasm?
  - wasm is faster
  - wasm allows web compilation
  + wat allows wat2wasm compiler optimizations
  + wat allows debugging
  + wat can be done via wat-compiler

## Lang likes/dislikes

### JS

### Wasm

+ no ; needed here and there
+ ;; as comment is nice, even just ; but it's not supported

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
* integrate: `∫(a, dt)`? `int(a, dt)`?


