## [x] name -> lino

  * soufn, sofn, sofun, so-fun, funzo, zfun
  * sound-fu, zound-fu, zo-fu
  * sonfu
  * zzfu, sone-fu
  * sone, sones, sonx, sounx, sonez, sonz, sounz
    + sone-script (sonscript)
  * sonnes, sonn, sounes
    + is sonnes (sounds in french), sones, sonne in German
  * sonra?
    + feminine
    + ra sound (Radha)
    + mystical aspect, like spect
  * sondr, sounder? sounr? soonr?
  * sonl? sonal?
    + sona language
    + soun
  * sond?
  * sonescript?
    + like sanskrit
    + sound script
  * sonscript?
    + son is common root for sound
    + (sonata, song, sone, )
    + .son extension is ok: reverb.son
    + sanskrit (lamish but ok teaches humbleness)
    + le son
    + sonr naturally grows as IDE
    - son is confusing with a person
    - weak association with sound
    ~ script has association with javascript, or roots from that (assemblyscript etc) - to mind that point.
    → if we root from assembly, it has more sense to call sont
  * soneslang?
  * solr? solo? soloscript? solos?
  * sound-fun
    + like "sounds fun" phrase.

  * sonf?
    + sound-functions
    + sound-fun
    + sound-fu
    + sound-formulas

  * sonr?
    . maybe we should just keep name: it is short, clear, keeps .son files, playground

  * soun?
    + short from sound
    +~ soul
    +~ sone
    +~ sour

  * line noise (lino)
    + sonlang can be more generic than just sound: any linear signals
    + looks like line noise
    + produces line noise
    + matches `mono`
    + lino is beginning of "linotype"
    - .son extension is missing
        + .lin extension is pretty cool too, like flax

  * lisa
    ~+ like lino
    + mono -> lisa
    + reminds Julia lang
    + file can be named literally mono.lisa
    - already exists: https://github.com/Somainer/lisa-lang

## [ ] Free (nice) operators

  * `<>`, `><`
  * `::`
  * `-<`, `=<`, `~<`
  * `-/`, `=/`, `~/`
  * `-|`, `=|`, `~|`
  * `-\`, `=\`, `~\`
  * `=>`, `~>`
  * `''`, `""`
  * `?=`, `~=`

## [x] WAT, WASM? All targets

Having wat files is more useful than direct compilation to binary form:

+ wat files are human-readable, so it's possible to debug mistakes and do changes
+ wat files are standard interchangeable format with proven compiler: no need to reimplement compilation and deal with its bugs
+ optimization out of the box
- wat files are still a bit hard
- modifying wat files creates divergence from son files..

### [x] ? Should it compile to wat or to wasm? → wat for now

  - wasm is faster
  - wasm allows web compilation: doesn't require heavy wabt dependency
  - wasm is "true" direct way
  - wasm is something new to learn
  + wat allows wat2wasm compiler optimizations
    ~ can be done via wasm too
  + wat allows debugging, bytecode can be hardstone
    ~- wasm2wat also allows debugging
      ~+ still reverse compilation can lose variable/function names
  + wat can be done via wat-compiler and other better fit for that mappers
    - wat-compiler is stale and unlikely to improve

  * ? Can be both I suppose, but needs researching wasm format - mb we can utilize fn tables in better way

### [x] Compile targets: → WAT

  * WASM
  * WAT
    + replaceable with wabt, wat-compiler
    + generates wat file as alternative to wasm
    + easier debugging
    + natural and easier code than array structs
  * JS
    + can be useful in debugging
    + can useful in direct (simple) JS processing
    + can be useful for benchmarking
  * Native bytecode
  * others?

## [x] frames as vectors

  * like glsl (data views to underlying block buffer), with [standard channel ids](https://en.wikipedia.org/wiki/Surround_sound#Standard_speaker_channels); swizzles as `a.l, a.r = a.r, a.l; a.fl, a.fr = a.fl`

## [x] `f(x, y) = x + y` -> yes
  + standard classic way to define function in math
  + also as in F# or Elixir
  - conflicts with anonymous fn notation

### ~~[x] `f(x,y) -> x + y`~~
  + looks very similar
  + also classic-ish function notation
  + natural extension of lambda functions
  + unifies lambda functions look
  + organically permits lambda functions
  - conflicts with mapper/transform
  - lambdas require dynamic fn context allocation, which is not worth it

### ~~[x] Alt: `f = (x,y) -> x + y`~~
  + all pros of prev
  + JS-familiar notation
  + less fancy syntax extensions
  + better indicator of fn primitive
  ? batch output: `~() -> 1` vs `() -> ~1` vs `() ~> 1`

## [x] Ranges: f(x <= 0..100=100, y <= 0..100, p <= 0.001..5, shape<=(tri,sin,tan)=sin)

  * ~~`f(x=100 in 0..100, y=1 in 0..100, z in 1..100, p in 0.001..5) = ...`~~
    - conflicts with no-keywords policy

  * ~~! Swift: non-inclusive range is 0..<100~~
    - see exclusive ranges research, confusable with `0.. < 100`

  * ~~`f(x{0..100} = 100, y{0..100} = 1, z{1..100}, p{0.001..5}, shape{sin,tri,tan}=sin )`~~
    + matches set definition
    - missing operator
    + allows defining limited variables `a{0..100} = b`

  * `f(x = 100 ~ 0..100, y ~ 0..100 = 1, z ~ 1..100, p ~ 0.001..5, shape ~ (tri, sin, tan) = sin)`
    + swift has ~= operator checking if value is within range
    - needs special construct for enums
    ? shape ~ tri+sin+tan
    ? shape ~ tri || sin || tan
    ? shape ~ [tri, sin, tan]
      - nope: array is not a group and raises question why not `[1..100]` then.
    ? shape ~ (tri, sin, tan)
      + matches direct groups
      + parens are just means to group items
    + ~ punctuationally refers to range, but direct ~ is too little info
    - `i ~ 0..x :|` not the most apparent indicator of assigning to i, intuition wants assignment to be here
      ~+ can be
    + less characters than ~=

  * `f(x = 100: 0..100, y: 0..100 = 1, z: 1..100, p: 0.001..5, shape: (tri, sin, tan) = sin)`
    + `:` is standard type definition
    - doesn't play well after value `x=100:0..100`
      ~ feature of variable/argument
    - interferes with named arguments
    - calculation-wise can be too heavy, compared to one-time clamp
    - has different precedence with `=`
    - has possible conflict with ternary

  * ~~`f(x = 100 ~= 0..100, y ~= 0..100 = 1, z ~= 1..100, p ~= 0.001..5, shape ~= (tri, sin, tan) = sin)`~~
    + matches Ruby's regex-search operator, inversed
    + matches "equals" as "clamp"
    - isn't interchangable with `=`, has different meaning
    → too much `=` noise - not clear associativity; `~` shows better contrast.
    - `~=` means `a = ~a`

  * ~~`f(x = 100 ~ {0..100}, y ~ {0..100} = 1, z ~ {1..100}, p ~ {0.001..5}, shape ~ {tri, sin, tan} = sin)`~~
    + less digit-y as above
    - a bit redundant
    + allows sets
    - confuses of 0..10 and {0..10}
    + allows joining ranges {0..10, 20..30}
      ~ can be solved as 0..10 + 20..30
    - too curvy

  * `f(x = 100 -< 0..100, y -< 0..100 = 1, z -< 1..100, p -< 0.001..5, shape -< (tri, sin, tan) = sin)`
    + visually precise indication of what's going on
    - false match with reduce/loop operator
      ~ not anymore a problem if we make loop/reducer `<|` and `|>`
    + by rearranging loop/reducer it's not more at conflict
    - a bit too far meaning, indirect. `-<` is more like fork, mb switch or etc

  * ~~`f(x = 100 <- 0..100, y <- 0..100 = 1, z <- 1..100, p <- 0.001..5, shape <- (tri, sin, tan) = sin)`~~
    + literally elixir/haskel/erlang/R/Scala's list comprehension assigner
    + stands in-place for "in" operator
    + similar to -<
    - `100 < -0..100`

  * `f(x = 100 =< 0..100, y =< 0..100 = 1, z =< 1..100)`
    - interferes with `=`, see below reasoning

  * `f(x = 100 >< 0..100, y >< 0..100 = 1, z >< 1..100, p >< 0.001..5, shape >< (tri, sin, tan) = sin)`
  * `f(x = 100 <> 0..100, y <> 0..100 = 1, z <> 1..100, p <> 0.001..5, shape <> (tri, sin, tan) = sin)`
  * `f(x = 100 <0..100>, y <0..100> = 1, z <1..100>, p <0.001..5>, shape <(tri, sin, tan)> = sin)`

  * `f(x = 100 <= 0..100, y <= 0..100 = 1, z <= 1..100, p <= 0.001..5, shape <= (tri, sin, tan) = sin)`
    + very natural & known operator `<=`
    + matches `element of` notation `<-`
    + no ordering problem with `<=` and `=`
    + frees `:` for technical needs, like import or named args

  * ~~`f(x = 100 -| 0..100, y -| 0..100 = 1, z -| 1..100, p -| 0.001..5, shape -| (tri, sin, tan) = sin)`~~
    - looks too much like table separators

## [x] Enums → try avoiding explicit notation

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
      ~ nope: we decided to free `{}` from scope meaning. And object === set, so.
    → sets can be listed as `(a,b,c)` ()
      ⇒ or even better, as functional languages do: `type in a|b|c`

## [ ] Strings:

  * Erlang-like "hello" === [104,101,108,108,111]
    + Standard
    - Case-sensitivize code
  * Base32
  * hex only
    + standard form
    + easy to convert memory
    - not as useful, no way to preview content

## [ ] !? atoms: 'hello' (not string)
  * Atoms are useful for referencing:
    + function instances
      ~ we have funcref type, not necessary
    + ranges?
    + arrays
    + file paths
  * ? we can use i64 for them
  * ? or we can use f64 for all numbers by default and keep rest of types free
  + ok, can be useful for special syntax with non-string meaning, like paths, dates and other atoms.
  + also can be used for special name variables maybe? like `'x-1' = 2; x0; x1;`
    ? or use `x\-1 = 2` instead?
    - nah, very confusing
  ! We can reserve atoms for import directives.
  + can be useful for throwing expressions

## [x] Numbers: float64 by default, unless it's statically inferrable as int32, like ++, +-1 etc ops only
  * Boolean operators turn float64 into int64

## [x] ~~Pipes: → | with anon functions~~ ~~transform ternary `list | x -> a(x) | x -> b(x)`~~ no pipes for now - chain of loops instead `x <| # * 0.6 + reverb(#) * 0.4 <| `

  1. Placeholder as `x | #*0.6 + reverb() * 0.4`, `source | lp($, frq, Q)`?
    ? can there be multiple args to pipe operator? `a,b |` runs 2 pipes, not multiarg.
    ? possibly it should be both: passing input as `input` implicit param, `#` redirects to another param
      - nah, too complicated.
    - function plays natural role of args inserter, why duplicating with topic placeholder?
      ~+ function creates a (semantic) scope, whereas pipe acts on the same level
    → ok, seems like intuition for `|` is direct expression, sort of overload: `a | filter(f, q)` ← filter creates fn here
    → but for pipeline there's intuition as `a |> filter(#, f, q)` ← we don't necessarily need that
    + $ looks regexy - backreferences in both string/regexes
    - implicit/reserved references we could avoid
    + it's overall shorter than other options, as easy syntax sugar, because
      * `a | a -> a+1` introduces fn overload overuse and curried fns constructor problem
      * `A()=a->a+1; a | A()` requires heavy constructor code and passing lambdas
      * `a |> a -> a+1` is redundancy and aint nice looking
    ? enable access to group members as `a,b,c | d($1, $2)`
    - sending group items would require referencing by number
      ~ unless we prohibit sending groups, not sure we need it.

  1.1 What if we get rid of pipe operator and just use "last expression" placeholder?
    * `a; ^ + 1;`
    + clean, compact
    + caret character literally defines as "insertion point"
    + wikipedia uses ^ for referencing
    + comes well with "last expression result" logic.
    - doesn't allow easy use in initializer
      ~+ unless we do ...a=(x;^+y)
    + applies to group naturally
      ~+ ...a=(x1,x2,x3;^+y) - does it apply to sequence?
        ~ yes, to get n-th member do ^[0] or ^.0
        ~ semic is noisy here.
    -~ doesn't make much difference with just ...a=(tmp=x;tmp=tmp+y), only shorter
    ~ can possibly do `^2`, `^3` in wasm-style access to stack variables
    - enforces redundant parens, `...a=(x;^+y)` compared to `...a=x|>add(y)`
      + as mitigation see 3.1
    - can't go as single fn argument a(b; c(^, d)) vs a(b | c(d))

  2. ~~Pass first argument[s] to pipe operator (elixir/R-like): `source |> lp(frq, Q)`?~~
    + That would be just direct R/elixir pipes.
    * a,b,c |> fn() - maps multiple, (a,b,c) |> fn() - maps single
    + `||>` to send all arguments to inputs `a,b,c ||> mix()` === `mix(a,b,c)`
      * whereas `a,b,c |> mix()` === `mix(a),mix(b),mix(c)`
        ? can't we just `mix(a,b,c)` or `mix(..abc)`?
      ? what if we send pairwise, depending on mixer target args length? `a,b,c ||> sum()` === `sum(sum(a,b), c)`
        + this way we can implement any sort of reducers
    + |> can have other than | precedence
    + available instantly to all functions, not only overloaded ones
    + puts chunks into separate functions = good [musical] practice
      + makes code easier to read
    + plays well with >- operator in fn signature a,b,c|>fn()>-sum()
    + compact
    + replaces lambda in a way (see reverb case)
    - Operator `|>` makes assumption about next call operator `a()` - what if there is `a |> b` - how's that applied?
      - this and >- make it confusing if that's supposed to pass funcref `a |> b` or call to a function `a |> b()`
      - this makes lino less strict, more toyful script, because it doesn't stand exhaustive review
    - missing an easy way to insert placeholder value, forcing 1-time fn defs or lambdas.
      ? topical pipe `source .> sign(.) * abs(.) ** shapeCurve`? - nah, indecisiveness.
    - aesthetically |> doesn't match -< and ->

  3. Lambda functions: `a | a -> b(a, x)`
    * `a | b | c` is _simply_ operator overloading for functions, same as `"a"+"b"` for strings.
    * for passing params use inline functions as `a1,a2,a3 | a -> b(a) | c`
    + that uses good(existing) functional intuition, but to make it performant - functions should be macros or transform to direct code, not use lang constructs
    - introduces overload
      ~ it is natural for fnref, as + for strings or & for booleans
    * `a | a -> a + delay(a, time)` is equiv. to `a |> delay(#, time)`
      ~ it's only 1 symbol more + topic placeholder
      + functions are natural arg call placeholders, inventing new scheme to insert args is not DRY
      + fn overloading can be specially defined as `a | gain(amp) = gain(a, amp)`
    * F# style of pipes
    - no easy way to pass to curried function as `source | filter(f, Q)`
      ~ can define overload case as
        * `filter(f, Q) = src -> filter(src, f, Q)` or
        * `src | filter(f, Q) = filter(src, f, Q)` or
          - introduces possibility of definition ops
          - function body here is unnecessary: we ought to mark function as pipeable
        * `filter(src?, f, Q)` = ...`
          + indicates optional argument as existing convention
          + allows indicating which argument is taken "in"
          + no redundant pipe-clause body that introduces ambiguity
          + can expect more than one argument from input, which can be useful for eg fold operator
          - creates curried fn, which is implicit conflicting clause
          - conflicts with just pipe function `x | x -> x+a+b`, vs `sum(x?) = x+a+b; x | sum()`
          ~ the issue is that `?` operator acts as if argument is something very natural and same-level
        * implicitly create a curried function if less than needed arguments is present?
          - too much confusion - not clear which is which. Same-name-fn must not spawn different results.
      ~ can do arrow fn `source | s -> filter(s, f, Q)`
    * makes same syntax assumption as 2. by invoking rhs function with lhs as first argument.
    + doesn't have generic operator overloading meaning as in 4: only applies as first argument.
    - we may not need lambda functions

  3.1 Use topic token 1.1 only as part of pipe expressions but as curried fn constructor as rhs? `a | a->a+1` === `a | ^+1`
    + syntax looks fresh, compact, flowy
    + combines JS's F#/Hack pipes
    + no redundant function calls from 2. (unless we do 4. with constructor/currying meaning)
    + `|` + `^` = `|>`, makes sense
    + reducer operator is as promised, without redundant call: `..combs_a | comb(^, input, room, damp) >- sum`
    ~ Likely there's benefit of limiting topic to pipe only. Generic ^ may have unexpected side-effects.
      + eg. initializer `...a=(x;^+y)` can be `...a=x|^+y` now, since no conflict with semi.

  3.1.1 Likely topic must be `&`, as reminiscence of binary operator pair `|&`.
    + also matches "self" by meaning

  3.2 ~~`filter(-> src, f, Q)`~~
    + benefits of `filter(src?, f, Q)`
    + more explicit indicator of curried clause and piped in argument
    + can be combined with `filter(~>src)`
    - `x,y,z | stretch` vs `x,y,z | stretch(amt)` - both valid and similar, but syntactically nastily different

  4. ~~Function overload `a | b(x) = b(a,x);  a | b(x)`~~
    ~+ Partial application can be thought on its own regardless of pipe as `a1 = a(#, rate)`
      , which is solved via lambda as `a1 = x->a(x,rate)`.
    + `source | gain(.45)` is oldschool coolness.
    + direct meaning definition
    + semantically clear
    - generalized operator overloading
    - too much definition noise, compared to just |> available for every fn
    - comma has precedence below |.
    - `a | b(x)` being replaced by `b(a, x)` is meta-programming, it's not operator overloading
    - there's no difference in `a | b(x)` between OR of result and overloaded function (expression)
      ~ b(x) signature can return b(a,x), not boolean.
    - definition is alternative to `b(a) = x -> b(x,a)`, duplication
    - the definition breaks convention of calling rhs `|` function with first argument applied, eg `x|b(a)=b(a,x)` swaps args.

  5. ~~lambda + `a |> b(x)` as a shortcut for `a | a -> b(a, x)`?~~
    - `...a = a0,a1,a2,a3 |> stretch(rate) | Comb` is too entropic
      - mixing function scope with direct scope
      * vs `...a = a0,a1,a2,a3 |> stretch(#, rate) |> Comb(#)`
      * vs `...a = a0,a1,a2,a3 | a -> stretch(a, rate) | Comb`
      * vs (ideal1) `...a = a0,a1,a2,a3 | stretch(rate) | Comb()`
      * vs (ideal2) `...a = a0,a1,a2,a3 |> stretch(rate) |> Comb()`
    -~ this partial application is implicit argument - non-js intuition.
    - ideally not have additional (shortcut) operator

  6. ~~Internal/implicit variable like `#in` to read from.~~
    - let's try avoiding any implicit values for now, most of them can be done via internal state (+ explicit init args)

  7. ~~Global variables $1,$2,...$n as constant references to last elements in stack?~~
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
    - same as 5 - let's avoid implicit stuff

## [x] ~~Lambda -> we can use only lambdas everywhere~~ wasm doesn't have dynamic func references, creating memory for calls is costly

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
  ?! Try x(..args) -> operation for regular functions?

## [x] ~~Reduce/fold operator: let's use |> with lambdas~~ easier to use just loops `sum=0; list | i-> sum+=i`

  * ? Reduce operator? It can be eg. `:>` (2 become 1), or `=>`.
    * ? `a,b,c :> reducer`, like `signals :> #0 + #1`
      - `:>` looks like expecting some input or something.
    * ? Or maybe `a,b,c ||> a,b -> a + b |...`
    * ? `a,b,c => a,b ->a+b`
    * ? `a,b,c ..> a,b -> a+b`
    → `(a,b,c) >- a,b -> a+b` (crazy!)
  ! >- operator can be statically analyzable if group length is known (it should be known)
  ? unrols into single expression for groups OR applies reduce/fold for arrays. Acts as convolver also.
  ? or just avoid that since direct loop is available?
  * -> What if use `|>` for reduce
    + compatible with `map` as `x | x -> x*2 |> (x,y) -> x + y`
    + better visual separation, less linear noise vs `x -> x*x >- (x,y) -> `
    + better mnemonic for `|` as "take these items" (and fold) - like list comprehension or set descriptor
    + It might free syntax space of `-<` for more "inline", "immediate" things

## [x] Units: time primitive and short orders is natural: 1h2s, 20k -> see below

  * Units possibly intrudoced as `10k`, `1s`, `1hz`, `1khz`

  * ? 1pi, 2pi, 3pi, 3.4pi etc.
    + theoretically fractional type would introduce max precision
    ~ more natural convention would be pi2, pi3 etc. which can be simply precalculated.
    - .5pi/2 etc - complicates parsing, makes formulas unusual, occupies 0xa, 12n, 0b2 namespaces.
      → very simple to instead do .5*pi, 60*h + 10*m
      ~ occupying that namespace is fine: it still serves similar purpose
      ~ 0.5pi is nice notation too. Same as would be 0.5i.
  * ✓ 1k, 1M, 1G, 1T
  * ✓ 1s, 1m, 1h
    * ? 1h12m1s - is it a separate type?
  * ✗ 0:12

  - we can't include all units anyways, it's pointless
    ~ we don't need all, whereas 2k..20k is very elegant, instead of legacy 2e3..20e3

## [x] Time units: convert to sample rate samples (or to floats)? -> try generic units `1k=1000,1s=48000,1pi=pi`

  + saves many conversions
  - has implicit sr variable...
  ?! ~~`@pi=3.14; 2pi;`, `@s = 44800; 1s;`~~
    - `1s === 44800`, not `@s`
    - reserves `@`
    - `1pi1ms1s` mixed units fail
  ?! `1s=48000; 1ms=.001s; 1pi=pi; 3pi5s2ms`
    + solves mono discrepancy
    + laconic, obvious and truthy
    ~+ customizable from outside as `1s=sampleRate`

## [ ] Units: what does customization give vs take

  + Gives i18l code: 1м3с
  + Gives customization of sample rate: `1s=44800`
    - For external customization `1s=@param.sampleRate` we need dynamic units
  +? Custom math expressions / param values eg. `1step=20`
    -> units must be localized to scope and be dynamic then, if we allow redefining them
  + `1s=44100` solves problem of time vs offset variables
  + `1pi=@math.pi`
  - Duplicated code `1k=1000` in all programs
    ~+ Soft introduction into program
  - Non-compatible definitions, eg. `1pi=3.1415` vs `1pi=3.1415926`
    ~ not a big deal
    ~+ allows some experimentation
  - Non-compatible program code if units are undefined or (worse) conflictly defined
    - `1M=1000000` vs `1m=0.001` vs `1M=1024000`
      ~+ local definition/redefinition can help

## [x] Number types: fractions, complex numbers -> when needed

  + improves precision

## [x] End operator → indicator of return statement. Try using ^a as return.

  * `.` operator can finish function body and save state. `delay(x,y) = (*d=[1s], z=0; d[z++]=x; d[z-y].)`
  * ? is it optional?
    * eg. `noise(phase) = sin((phase % (PI*2))**3)` - what would be the point here?
  - it makes direct sense only in case of unnested body. When body is nested - not as much.
  - it creates confusion with block as `).` vs `.)`
  + maybe for unwrapping it is still useful.
  - conflict with global variables init. x=1+2;y()=x+1. - like, why? better make as simple assignment.
  * ? make it an alternative to semic? semic is too noisy as separator, eg. (a,b,c; ^+1) → (a,b,c. ^+1)
    + keeps natural aesthethics.
  * ? make it indicator of "return" statement?
  * ? make it indicator of "end pipeline"?
  * ? make it null literal?
    + works as "end function without result" a -> b().
    + works as fn args as `a(b,.,c,.,e)`
      - sheer redundance
  * ? it can act both as "return" and "save state" indicator for scoped blocks.
    + enforces semicolons and adds clarity.
    - both are unnecessary; it's natural to return last item without indicator
    - makes confusion
  * ? + can be used as export marker in a module.
  * + we may need early return as a() = (a?b. c+d.)
  → (a,b,c) returns group; (a;b;c) returns last; (a;b.c;) returns b but requires ; as `(a;b.;c;)`; (a?b.:c;d) returns b or d.
    * the logic is: group figures out result based on end indicator, else takes full internal value.
  ? we can force end operator to stand after a separate id, not expression.
    + bans `pi2 = pi*2.; rate = 44100.;` → `pi2=pi*2;rate=44100; pi,rate.`
      - doesn't help much if expr comes after, eg. `pi,rate. a=3;`
    -> so seems uncovered period can stand only at the end of scope. Else there must be a semi.

## [x] Early return? → yes, via return indicator a ? ^b;

  * can often see `if (a) return;` - useful construct. How's that in sonl?
  1. `a ? value.`
    * There doesn't seem to be other options.
    → `a ? b.;` expects `;` at the end.
      * skipping ; means node is the last element: `(a;b;c.)`
  2. not supporting early return.
    + simpler flow/logic
    + no (b.c;d) syntax case
    + gl code doesn't support preliminary returns as well as optimal branching, so maybe meaningful

## [x] Return operator: alternatives → try using `^` for returning value from block.

  1. `.`
    + erlang-y
    + very natural
    - early return is weak `a ? b.;`
      - can't suppress semicolon: `a ? b. c + d;`
    - exported global is confusing `sampleRate = 44100.;`
    ~ `c()=1.`, `c()=1.0.` - weirdish constructs, although clear
    - semi after the result.
  * `a ? b...;`, `sampleRate = 44100...;`
  * `a ? b!;`, `sampleRate = 44100!;`
  * `a ? b :| c + d`, `sampleRate = 44100:|;`
  * `a ? ^b;`
    + less confusion with `.`
    - doesn't look natural when at the end there's `a() = (...; ^out);`
      + it doesn't necessarily required: last element is returned by default.
    + allows `.` for short float notation.
      -~ `1...2.` can be messy
    + allows return none / break notation.

## [x] Always return result, or allow no-result functions? → implicit return, same as (a;b) in scopes

  + always return is more natural practice
  - no-result case is more generic and closer no wasm, by forcing result we limit capabilities
  + less choice is better: when no-result is needed?
  + solves issue of `a(x,y) = x*y.` - meaning export function a, not result. vs `a(x,y) = x*y..`
  ~ makes `.` optional at the end
    ~ makes `.` less common for fn result - mostly limiting to early return as `a(x)=(x?1.;x)` ← this is fine though
    - we still allow `.` as last token:
      * `a(x,y)=(x*y.)` is valid "result of function", therefore `a(x,y)=x*y.` is too
      * or else `.` depends on `()`: `(a.)` is result, `a.` is export.
  + Since `(a;b;c)` naturally returns last element, so must function body.

## [x] Break, continue, return? -> try `^` for continue, `^^` for break/return etc.

  1. `^` for continue, `^^` for break;
    + nice pattern to skip callstack;
    + brings point to prohibiting `^` as reference to last expression: simpler pipes;
    + combinable with return statement which is kind-of natural `(a?^b; c)`.
    - wrapping in parens can change the meaning or scope of `^^`.
      ~+ not really: it's visible that it breaks recent scope.
  2. `>>` for continue, `^` for break.
  3. `.` for break or return, acting within the block; `^` for continue.
    - break can be used without stack argument, `.` by itself doesn't do much sense although possible
    - `tsd(i) = (i < 10 ? (log('lower'); 10.); i)` may expect returning from the function, not breaking the block.
      -> can be used as `tsd(i) = (i < 10 ? (log('lower'); 10).; i)`
    + the most laconic version
  4. webassembly doesn't use continue, just `^` for break.

### [x] ? Can we use something else but . for export? → ~~let's try `a.` as global export operator~~ -> last members are exported by default, `.` indicates end of program.

  - that seems to create confusion for `a(x,y) = x*y.` case
  - that doesn't seem to belong to natural languages - marking . with export.
  - it seems export is better marked before declaration, than after.

  1. ~~`::a(x,y) = x*y.`~~
  2. ~~`!a(x,y) = x*y.`~~
  3. ~~`#a(x,y) = x*y.`~~
    - conflicts with cardinality
  4. ~~Can we export all by default?~~
    - that bloats default module size
      ~ can be mitigated on imports: main compilable file exports everything, the rest is treeshaked
        ? how do we `export x from './x#x'`?
          `@ `./x#x`; x;`
    + exporting each member is tedious and too much code noise.
      + that's sometimes js trouble that exports is not exported etc.
  5. Export everything by default, except for methods marked "private", eg. _abc (convention).
    - _abc forces unnecessary noise across the file. It's easier to mark variable private just once.
    + Cobra lang uses __abc for private and _abc for protected...
    - bringing meaning to variable name symbols can be unintuitive.
  6. ~~We can use @ for export as well as import.~~
    + Ruby has @ for protected methods, which is alternative to _abc
    - mixes up imports/exports: it's hard to see what's what in the file
  7. We can export last function/group, as regular groups do.
    - not very explicit
    - can be mixed with declarations
    - not very apparent
  9. Use `a,b,c.` as (last) operator in the file
    + reverence to erlang and natural languages
    + explicit
    - relative conflict with preliminary return in functions `a -> (^x; y)`
    + file starts with import operator, and ends with export operator.
  9.1 `.` means end of program, last members are exported.
    + `a,b,c.` exports
    + but also just `fn().` indicates end of program
    + `.` is self-sufficient
    + `.` is replacement for `;`
    ?! missing `.` means program is unfinished? like, a library to include?

## [x] State management → function state identified by callsite

  * `...x1, y1, x2, y2`
    + yes, that acts as hooks from react
    + that solves problem of instancing
    + identified by callstack

## [x] Stateful variable syntax → `*` seems to match "save value" pointers intuition

  * There's disagreement on `...` is best candidate for loading prev state. Let's consider alternatives.
  1. `...x1,y1,x2,y2`
    + clear
    + matches punctuation meaning
    - ostensibly conflicts with ranges .. (imo no)
    - goes against spread convention
    - possibly doesn't indicate well enough if ... is applied to group or first item
      + to a group. It is super-useful to have list of stateful variables.
    + doesn't pollute variables with any prefixes
    ```
    lp([x0], freq = 100 in 1..10000, Q = 1.0 in 0.001..3.0) = (
      ...x1, x2, y1, y2 = 0;    // internal state

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
    )
    ```
    - `song()=(...t=0;)`
  2. ~~`^x1, ^y1, ^x2, ^y2`~~
    + topical reference enjoining with the last value
    - too many meanings to topical operator
  → 3. `*x1, *x2, *y1, *y2`
    + existing convention of `*` as save
    . C / Rust / Go pointers are the same.
      > It (* - dereference operator) can be used to access or manipulate the data stored at the memory location, which is pointed by the pointer.
      > Any operation applied to the dereferenced pointer will directly affect the value of the variable that it points to.
      . `int x=9, y; int *ptr; ptr = &x; y=*ptr; *ptr = 8`
        - * implies variable is pointer, & implies variable is value.
        + * is more ambiguous than &: & gets address of a value, * indicates pointer declaration, as well as assigns (saves) value: it acts almost as part of variable name.
      + C intuition for "save" value by pointer is `*value = 123`
    + Go pointers don't have pointers arithmetic, so we're not going to need pointer assignment
    - no group
      ~+ group can be defined as `*(a=0,b=1)`
    ~ `song()=(*t=0;)`
    + used in JS for generators and other "additional" stuff
    - a bit hard to "find all" since * is not part of id
    ```
    lp([x0], freq = 100 in 1..10000, Q = 1.0 in 0.001..3.0) = (
      *(x1, x2, y1, y2) = 0;    // internal state

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
    )
    ```
    ~ `song()=(*t=0;)`
  3.1 ~~`x1*, x2*, y1*, y2*`~~
    + typographic meaning as footnote
    - `x1*=2`
  4. ~~`#x1, #x2, #y1, #y2`~~
    + internal, private state, act as instance private properties
    + indicator of special meaning
    ~ conflict with note names
    - pollutes the code with #x1 etc.
    - often means compiler directive or comment
    - may conflict with cardinal number (count) operator
  5. ~~`[x1, x2, y1, y2] = #`~~
    + involves destructuring syntax
    - introduces unnecessary token
    - `#` is hardly works on its own not in conjunction
    - `#` is reserved for too many things: count, import, comment.
  6. ~~`#(x1, x2, y1, y2)`~~
  7. `<x1, x2, y1, y2>`
  8. ~~Introduce keywords? Not having if (a) b can be too cryptic.~~

  9. `$x1, $x2, $y1, $y2`
    + $ means "save"
    + $ means "state"
    + $ means "self"
    ± $ means money
    - speaks little about persistency
    - perceived as var name, not an operator
  9.1 `$(x1, x2, y1, y2)`
    - perceived as fn call, not operator

  10. `&x1, &x2, &y1, &y2`
    + means "arguments and x1, x2, y1, y2"
    - from C logic means "get address of value"
    + doesn't indicate & as part of name, more operator-y
    - conceptually different from binary / boolean operator, looks same
    ```
    lp([x0], freq = 100 in 1..10000, Q = 1.0 in 0.001..3.0) = (
      &(x1, x2, y1, y2) = 0;    // internal state

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
    )
    ```
    ~ `song()=(&t=0;)`
    + complementary with `*` as defer operator

  11. ~~`@x1, @x2, @y1, @y2`~~
    + 'at' means current scope, 'at this'
    + more wordy - less operator-y, as if part of id
    + matches import directive by meaning
    ```
    lp([x0], freq = 100 in 1..10000, Q = 1.0 in 0.001..3.0) = (
      @x1, @x2, @y1, @y2 = 0;    // internal state

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
    )
    ```
    - feels a bit heavy for internals
  12. `:> x1, x2, y1, y2`
    ~ `song()=(:>t=0;)`
  13. `:: x1, x2, y1, y2`
    ~ `song()=(::t=0;)`
  14. `<< x1, x2, y1, y2`
    + Matches ^
      +~ ASCII in 1962 had <- character for _, which was alternative to ^
    - `song()=(<<t=0;)`
    - opens tag

## [x] Binding/referencing variables via pointers? → no

  * Purpose of pointers in go is to pass value by address, rather than copying.
  * Also it can create references to a variable in memory.
  * We use arrays for that purpose, therefore we don't need pointers syntax replica.

## [x] Named array items → ~~yes, useful and organic replacement for object structs~~ -> not possible to make arbitrary-argument aliases

  * named properties in arrays? `[1,2,3,a:4,b:5]`
    ~ reminds typescript named tuples
    ~ should find exactly where we'd need that
  ? Maybe can be done purely as aliases for position? Let's see for use-case
  + in JS that's frequent good-to-have
  + that would organically introduce pattern of named fn arguments either `gain(volume: 1)`
  + named group items are also useful: `oscillators = (a: x->y, b: x-y)`
    - we don't have groups as primitives
  - conflicting convention: we don't really use labels anywhere (we use variables instead)
  - it kind-of enforces lambdas, which we want to avoid also.
  - require strings to implement dynamic access `x['first']`
  - some arrays have aliases, others don't: we're not going to make aliases dynamic

## [x] If `a ? b`, elvis: `a ?: b`? -> yes, for now it's the best option
  * ~ equivalent to a ? #0 : b
  + organic extension of ternary `a ? b`, `a ?: b`.
  - weirdly confusing, as if very important part is lost. Maybe just introduce elvis `a>b ? a=1` → `a<=b ?: a=1`
  - it has no definite returning type. What's the result of `(a ? b)`?
    ~+ `b` or `0`?
    ~+ likely returning type is never going to be needed
    ~+ it's 0, ie. kind-of step function `a ? b`
  * return type is `0` or `typeof b`
  - burdens `?` with semantic load, impeding other proposals like `try..catch`
    ~ there's a chance try..catch is not going to be needed
  !? What if `a ?! b`, which is essentially `!a ?: b`
    + no conflict with ternary `?:`
    - nah, wrong ordering, we inverse `a`, not `b`
  !? What if `a ?? b`?
    - means `a || b` from JS, which is just `a ?: b`

## [ ] mix, smoothstep operators

  * `x -< a..b` defines clamping
  * `a..b -> x` looks like function, but is possible
  * can be done via external lib

## [x] Loops: ~~`i <- 0..10 <| a + i`, `i <- list <| a`, `[x <- 1,2,3 <| x*2]`~~ `0..10 | i -> a + i`

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
    + vertical bar is used in math notations: set builder, list comprehension {x∈R∣x<0}, {x∈R:x<0}
    + list comprehension uses | or : in many langs
    + `:|` is musical repeat indicator
    + `:` or `|` itself is not enough, it's too overloady or conflicting with ternary.
    + syntax space has no associations in languages.
    * `i%3 == 0 :| i++`, `a :| b`, `i++ |: i%3 == 0`
    a.`x < 5 :| x++`,  `x++ |: x < 5`, `[ x <- 1,2,3 :| x*2 ]`, `[ x * 2 |: x in 1,2,3 ]`
      + reminds label a: ...
      + keeps body visually clean after bar, as if returning result, condition clarifies body: `[x*2]` → `[x*2 |: x in 1..10]`
      + `|:` sounds like `|` such `:` that, swoooch th th
        + matches set builder `x++ |: x < 5` as `x++ such that x < 5`
      - it subtly conflicts with elvis operator `x in 1..10 ?: body`, but `x in 1..10 :| body`
        ~ not necessarily - elvis has inversed intuition
      + `x * 2 |` is close intuition to standard list comprehension syntax
      + since condition is usually smaller than the body, `i ~= 1..100 :|` better indicates repeating part than empty line after condition
      + musically loop may have multiple ends and end mark `:|` place is uncertain, but `|:` is unambiguously at the beginning of loop.
    b. `x < 5 |: x++`,  `x++ :| x < 5`, `[ x ~ 1,2,3 |: x*2 ]`, `[ x * 2 :| x ~ 1,2,3 ]`
      + refer to looping body, not condition, which is better by musical intuition
        - it disjoints condition from repeating part. In music |: denotes the beginning of loop, whereas here it stands in the middle.
      + it matches elvis operator `x < 5 ?: x++`, `x < 5 |: x++`
        + muscle memory of ternary/elvis
        - it's not elvis by meaning: elvis does "else" branch, when condition is not true, whereas loop runs "true" condition.
      + has pipe operator intuition: by some condition produce the following `whileTrue |: produceItem`, `item :| whileTrue`
        + colon gives hint as "multiple" instances created on the right, following `|>` operator intuition
        ~ same can be said about `i ~= 0..100 :| x+=i` - multiple left parts are piped to right
      - often |: stands at the end of loop line, and looks like
      ```
      i ~= 0..100 |:(
        a++;
        b+=2
      )
      // vs
      i ~= 0..100 :|
      (
        a++;
        b+=2
      )
      ```
    - overall both of these seem a bit confusing and unclear, and do not stand nice with parens.
  * ? We can take almost purely math convention instead of objects `{ x < 5: x++ }` - procedural call
    ~- with same success can be used without {} - these brackets don't make much sense here only visually
  * ? We can take even simpler convention: { x < 5; x++ } - loops over until last condition is true.
    - do..until version, not much useful on its own. Can be used as combo with above.
  * ! `x < 5 -< x++`, `[ x <- 1,2,3 -< x*2 ]`
    + ridiculously hilarious and flowy from design perspective
    + `in` operator is literally in many languages just `i <- list` from list comprehension
    + `-<` operator is literally opposite of fold: for list comprehension formula it generates many items
      + and loop is no-array generalization
    + `-<` somehow reminds loop block from UML diagrams
    - it acts on "immediate level syntax space", whereas produces a bunch. There must be `|` for multiple items.
  * ! `x < 5 <| x++`, `[ x <- 1,2,3 <| x * 2]`
    + if we take `|>` as reducer, it becomes meaningful reverse operator: take one and produce many
    + visually it matches the meaning
    + it acts on "iteration" scope, which is nice
    - a bit false-match with reducer since reducer takes fn argument, but here neither left/right are arguments
      + reverse-function kind-of closes that gap `a |> b -> c`, `c <- b <| a`
  * → ? `x < 5 :> x++`,  `x++ <: x < 5`, `[ x ~ 1,2,3 :> x*2 ]`, `[ x * 2 <: x ~ 1,2,3 ]`
    + result direction indicator
    + aligns with math, label reference
    + indicates "many" (by colon?)
    + less conflict with boolean in condition, (compared to |:?)
    + adds sense of flow
    + association with <> condition block
    - conflicts with F#'s :> operator
      ~ we don't deal with explicit types and don't use : in meaning of types
    - conflicts visually with leq, geq conditions: `a >= b :> a+b` - unnecessary direction vs `a >= b |: a+b`
  * ? `x < 5 <: x++`,  `x++ :> x < 5`, `[ x ~ 1,2,3 <: x*2 ]`, `[ x * 2 :> x ~ 1,2,3 ]`
    + meaning of <> block
    + musical reference |:
    + 1:M relation
    ~- conflicting with condition, but less than others
    - result direction is wrong
  * ? `x < 5 |: x++`,  `x++ :| x < 5`, `[ x in 1,2,3 |: x*2 ]`, `[ x * 2 :| x in 1,2,3 ]`
  * ? `x < 5 |> x++`,  `x++ <| x < 5`, `[ x in 1,2,3 |> x*2 ]`, `[ x * 2 <| x in 1,2,3 ]`
  * ? `x < 5 :> x++`,  `x++ <: x < 5`, `[ x in 1,2,3 :> x*2 ]`, `[ x * 2 <: x in 1,2,3 ]`
  * ? `x < 5 ..: x++`,  `x++ :.. x < 5`, `[ x in 1,2,3 ..: x*2 ]`, `[ x * 2 :.. x in 1,2,3 ]`
    + .. as intuition for "spread"
    + : as intuition for "comprehension/label"
  * ? `x < 5 ..| x++`,  `x++ |.. x < 5`, `[ x in 1,2,3 ..| x*2 ]`, `[ x * 2 |.. x in 1,2,3 ]`
  * ? `x < 5 ..> x++`,  `x++ <.. x < 5`, `[ x in 1,2,3 ..> x*2 ]`, `[ x * 2 <.. x in 1,2,3 ]`
    - similar to ..<, which means range definition
    + no visual conflict with ternary `a? b : c :> e`, `a ? b :> c: d`
  * ? `x < 5 --> x++`,  `x++ <-- x < 5`, `[ x in 1,2,3 --> x*2 ]`, `[ x * 2 <-- x in 1,2,3 ]`
  * ? `x < 5 => x++`,  `x++ <= x < 5`, `[ x in 1,2,3 => x*2 ]`, `[ x * 2 <= x in 1,2,3 ]`
  * ? `x < 5 -> x++`,  `x++ <- x < 5`, `[ x in 1,2,3 -> x*2 ]`, `[ x * 2 <- x in 1,2,3 ]`
    ~+ scala, ~+ elixir, ~+ erlang (~- not exactly them)
  * ? `x < 5 ::> x++`,  `x++ <:: x < 5`, `[ x in 1,2,3 ::> x*2 ]`, `[ x * 2 <:: x in 1,2,3 ]`
    + gives taste of .., : and direction.
    - too powerful blast
  * ? `x < 5 *> x++`,  `x++ <* x < 5`, `[ x in 1,2,3 *> x*2 ]`, `[ x * 2 <* x in 1,2,3 ]`
  * ? `x < 5 ~> x++`,  `x++ <~ x < 5`, `[ x in 1,2,3 ~> x*2 ]`, `[ x * 2 <~ x in 1,2,3 ]`
  * ? `x < 5 |:> x++`,  `x++ <:| x < 5`, `[ x in 1,2,3 |:> x*2 ]`, `[ x * 2 <:| x in 1,2,3 ]`
  * ? `x < 5 :>: x++`,  `x++ :<: x < 5`, `[ x in 1,2,3 :>: x*2 ]`, `[ x * 2 :<: x in 1,2,3 ]`
  * ? `x < 5 >:> x++`,  `x++ <:< x < 5`, `[ x in 1,2,3 >:> x*2 ]`, `[ x * 2 <:< x in 1,2,3 ]`
  * ? `x < 5 :>> x++`,  `x++ <<: x < 5`, `[ x in 1,2,3 :>> x*2 ]`, `[ x * 2 <<: x in 1,2,3 ]`
  * ? `x < 5 ?.. x++`,  `[ x in 1,2,3 ?.. x*2 ]`
    + intuition for condition and spread
    + reminds [..len] array creation, but [x in arr ?.. x*2]
    - doesn't play as nice with ~ instead of in: [x ~= arr ?.. x*2]
    - clashes/conflicts with `?.` - has nothing similar in intuition
  * ? `x < 5 ..? x++`, `[ x in 1,2,3 ..? x*2 ]`
    + semantic is close to punctuation combo
    + intuition for condition and spread
  * ? `x < 5 ?.. x++`, `[ x in 1,2,3 ?.. x*2 ]`
  * ? `x < 5 :? x++`, `[ x in 1,2,3 :? x*2 ]`
  * ? `x < 5 <?> x++`, `[ x in 1,2,3 <?> x*2 ]`
    + reminds UML <> block with condition inside
  * ? `x < 5 <:> x++`, `[ x in 1,2,3 <:> x*2 ]`
  * ? `x < 5 :.. x++`,  `x++ ..: x < 5`, `[ x in 1,2,3 ..: x*2 ]`, `[ x * 2 :.. x in 1,2,3 ]`
  * ? `x < 5 :: x++`,  `x++ :: x < 5`, `[ x ~ 1,2,3 :: x*2 ]`, `[ x * 2 :: x ~ 1,2,3 ]`
    + "array" intuition (many dots)
    + reminds : as in label
    + reminds math notation for list comprehension or set builder
    + reminds a bit musical meaning for loops
    - conflict with Java/C's scope resolution operator https://en.wikipedia.org/wiki/Scope_resolution_operator
  * ? `x < 5 <> x++`,  `x++ <> x < 5`, `[ x in 1,2,3 <> x*2 ]`, `[ x * 2 <> x in 1,2,3 ]`
  * ? Do we need reverse direction? - Until is very rarely used, - until style is incompatible for list comprehension

### [x] loops can return a value: `(isActive(it): action(it))` - the last result of action is returned
  + useful for many loop cases where we need internal variable result.

## [x] ? Is there a way to multi-export without apparent `export` keyword for every function? -> `x,y,z.`

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
  * Export area solves the issue: `gain()=...; export gain`
  -> Same as `(a;b,c)` returns b and c - return last items as `gain=()->{}; gain, gain1, gain2`.

## [x] Arrays: to be or not to be? → persistent fixed-size flat structures
  * ? what if we don't deal with arbitrary-length arrays?
    + it guarantees memory limitation, "embeds" into syntax
    + it removes much need in syntax around arrays like map, filer: it can be as `(a,b,c) | map`
    - that can be covered by groups
  → ok, for map use groups `(a,b,c)(fn)` or `a,b,c | i->i**.5`
    . for reduce use `a,b,c |> fn` or `a,b,c |> a,b -> a+b`
    ! that is in fact mixing operator! a,b,c |> mix
    !? we can reduce based on reducer's number of args
  * I think we should overload these operators |, |>
  → ?! Groups are flat, small and fixed-size; Arrays are nested and any-length.

## [x] Concat/flat groups → no need to flattening/deep nesting
  * ?is done via range operator a, ..b, c..d, e (shortened spread)

  * ? destructuring is `a,b,c = ..d`
    - nah, just do `(a,b,c) = d`
    ? Alternatively: do we need nested structures at all? Maybe just flat all the time?

## [x] -< operator purpose? `-<` for range

  * ? splits list by some sorter: `a,b,c -< v -> v`
  * ? or in fact multiplexor? selects input by condition? like a,b,c -< x -> x > 2 ? 1 : 0
  * ? switch operator?
  * ? what if we use it as loop? [ x <- 1,2,3 -< x * 2]
    + matches that arrow madness
  * ? maybe that's just inverse reduce operator. a = sum -< a,b,c
    * inverse reduce is loop
  * -<, >- look more from condition block-diagram scope. Maybe can be used for switches somehow?
  * -> ! what if that's iterator operator, an extension of `in`/`from`/`of`: `[x <- 1,2,3 <| x * 2]`
    ~- more familiar to just `[1,2,3 | x -> x * 2]`
    + can be used in pipes also as `x <- list | x + 2`
    + can iterate over ranges as `x <- 0..10 <| x*2`
    + can iterate groups `x <- 1,2,3 <|`
    + can iterate simple number `x <- 10`
    + it's mainly `for (x of list)` operator

## [x] ~~what's the meaning of `>-`?~~ confusable with `a > -x`

  * must be the opposite-ish to `for of`.
  * for of takes each element from the list. this operator must take one element. Switch?
  * `1,2,3 >- x ? a : b : c` ?
    + switch operator
    + meaningful as `-<` counterpart
    + enables if-else as `1,0 >- x ? true : false;`
      . `1 >- x ? true`;

## [x] What if we swap `-<` with `<-`, as `x in y` and `x of y`? -> no, `x<-y` is `x< -y`
  + `a |> b -> c` becomes symmetrical with `c <- b <| a`
  + `c <- b` is more conventional for `a of b`
  + `x -< 0..10` is nicer for range indication limit and for clamp
  + `x -<= 0..10` is just a nice construct
  -  `x <- y` vs `x < -y`

## [ ] Comments: `//`, `/*` vs `;;` and `(; ;)` → `;;`

  1. `;;`
  + ;; make more sense, since ; is separator, and everything behind it doesn't matter
  + (; makes more sense as "group with comments", since we use only ( for groups.
  + ;; is less noisy than //
  + ;; is associated with assembler or lisp/clojure
    + wasm
  + even simpler - everything after ; can be considered a comment?
  + doesn't introduce any new syntax space
  + it has "safe" or "light" semantic expectation, like, noone would guess it does something heavy
    + unlike `a \ b` or `a \\ b`
  - associates with autohotkey, which is the opposite of fast
  - single-comment breaks inline structures like a(x)=b;c;d.
  - not as "cool" as `\\`
  - `a + b;  ;; some comment` - not nice noise
  + more lightweight than `\\`
  + not confusable with `//`
  + reminds `:` which is kind of cool for comments in typographics
  + more conventional than `\\`
  + Sercy sneezed
  + gives indication that the code is compiled down to wasm, wasm can even keep exact same comments
  + lisp, scheme, clojure, racket, asm style
  + clean & minimalistic, easier to read
  - `;; xxx` or `(;....;)` is valid actual syntax
    - eg. `sin(x)(; explainer ;)` is confusable with `sin(x)()`
      ~+ kind-of equivalent to "nothing", eg. `x(a, (; some description;))` === `x(a,)`
    ~ `0..10<|(x,i)->sin(x);;i;;+sin(x*2)`
  + `;;` is safer & softer, not as spiky / scratchy, more familiar

  2. `//`
  + // associates besides C+/Java/JS with F#, which is pipy
  - // is noisy conflict with / and occupies operator space, eg.:
  ```
    tri(freq in 10..10000) = (
      ...phase = 0  // phase state
      phase += freq * pi2 / sampleRate
      (1 - 4 * abs( round(phase/pi2) - phase/pi2 ))
    )
  ```
  + // is super-familiar and js/c-y
  - // is used in python for floor division, very handy: (a / b | 0) -> a//b
    - that is especially not just floor division but autoconverting to int, which is super handy!!
      ? can that be resolved somehow?
  + allows defer to be `\x++`.
  + makes f#-compatible syntax highlight

  3. `\` or `\\`
    + mono-compatible
    + \ is almost never used in langs & that's unique
    + reminds `//`
    - sort-of constant footgun to confuse with `//`
    + it's short
    + association with "escape" sequence in strings
    + cooler than `;;`
    + looks fresh directionally, shadow effect `\\\\\\\\\\\\\\\\\\\\\\\\\`
    - possible conflict with string escapes
      + can be resolved with `\\`
        + creates clear separation of "comments" area
      + `;;` can as well have conflict with strings, that's not a feature of this comment
    - syntax highlighters don't know that
      ~ neither `;;`
    - takes primary semantic meaning, rather than "safe" secondary meaning
    ?- what's inline pairing? `\* *\`?
      + `\ inline comment \`

  4. `/* */`
    + most popular
    + most conventional
    + allows removing newlines safely
    + supported by highlighters
    - too decorative
    - unwanted association with mult/div
    - pair-operators are heavy
    + space-agnostic
    - not nice without `//` pair
    - visual noise with state vars `*x;/*x is pos*/;`

  5. `(; ;)`
    - wrongly associates with block
    + compat with wasm
    + everything is block-y anyways
    + smiles ;)

## [x] Groups: basic operations -> syntax sugar

  * `a,b = b,a`
  * `a,b,c + d,e,f → (a+d, b+e, c+f)`
  * `(a,b,c).x() → (a.x(), b.x(), c.x())`

  ~ likely we have to swipe precedence of , over =
  . a,b,c = d,e,f       → a=d,b=e,c=f
  . (a,b,c) = (d,e,f)   → a=d, b=e, c=f          // destructured-assembled
  . (a,b,c) = d         → a=d[0], b=d[1], c=d[2] // destructure
  . (a,b,c) = d,e,f     → a=f[0], b=f[1], c=f[2] // destructure group on the right
  . a = b,c,d           → a=(b,c,d)
  . a,b,c = (d,e,f)     → a=(d,e,f),b=(d,e,f),c=(d,e,f)
    - contradicts to js intuition where only c = (d,e,f)
    + follows local meaning where members on the left get value from the right
  → so there are 2 meanings:
    . () makes group a single component
    . , makes group, but separate components

  ~ group destructuring
  . (a,b,..cd) = (a,b,c,d) → a=a,b=b,cd=(c,d)
  . (a,b,c,d) = (a,b,..cd)
  . (a,..bcd) = e → a=e[0], bdc=e[1..]

## [x] Groups: always-flat? yes, but pipe function accounts for number of args in mapper

  * It seems nested grouping creates more syntax confusion than resolves, like `..combs | a -> comb(a,b,c) |> a,b -> a+b`.
    - not clear if that's supposed to pass a group or a single value.
    . Nested structures better be solved via arrays.
  * Instead, groups can always do flattening, eg. `(a, (b, c), d)` === `(a,b,c,d)` === `a,b,c,d`
    + that would prove them to be just syntax sugar
    + that would make them lightweight like a cloud, without rigid type checking
      * sort of "fluent" type, existing on the time of syntax analyser
    + that would simplify fold / pipe logic, meaning they always get applied to each member `combs | a -> comb(a,b)`
    ? how to pass all group arguments to piping function? (a,b) | (a,b) -> a + b
      ? maybe extending fold operator to account for processor arguments? eg.
        * a,b,c |> a -> a * 2  →  a*2, b*2, c*2
          - nah, following fold logic must return only c*2
        * a,b,c |> a,b -> a+b  →  (a+b) + c
        * a,b,c |> a,b,c -> a+b+c → a+b+c
          - unclear how to shift these args.
          - index comes as third argument usually
        ? it generalizes then as "convolve", where window is defined by number of arguments
          - not really: convolver doesn't fold signal
      ? or - loop operator with function may act as map
        * a,b,c <| a -> a*2
      !? or - we can pass all args depending on args count in pipe transform:
        * `a,b,c | a,b -> a+b` means  `((a,b) | a,b->a+b, (b,c) | a,b->a+b)`
        + yep. seems like a way to go,
        + establishes operator-overloading pattern
        + may act as convolver
      ? do we need index argument for pipe transformer
        - no, pipe is not mapper...
        ? how do we map arrays then
          * list comprehension: i <- arr <| i * 10

## [x] Convolver operator? -> let's try to hold on until use-case comes

  * Fold operator gives thought to convolver operator which slides window depending on number of arguments,
    samples ^ (a,b,c,d,e) -> a*0.1 + b*0.2 + c*0.4 + d*0.2 + e*0.1 returns all same samples weighted with a formula
    - can be too hard for big kernels
    - debases point of arguments spread: `samples ^ (...kernel) ->` - what's supposed kernel size?
      ~ we not necessarily support args spread
  * Pipe can be used as simple convolver (see above):
    * `a,b,c | a,b -> a+b` means  `((a,b) | a,b->a+b, (b,c) | a,b->a+b)`

## [x] Array slice takes ranges a[1..3], unlike python

## [x] Notes as hi-level aliases for frequencies A4, B1 etc. -> available
  * import 'musi' - imports all these constants
  + allows building chords as (C3, E3, G3) = Cmaj
    ~ would require # to be valid part of identifier

## [x] ? Parts of identifier: $, #, @, _ → @ is reserved for import
  + allows private-ish variables
  + allows notes constants
  ~ mb non-standardish

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

## [x] Inlining / Mangling / compressing

  * language should not break inline composability, like it does python or livescript: you can tightly pack code into a single line.
  * language should be mangle-able, therefore names should not have prefixes
    ~ mangling can recognize that
  * Spacing material should not have any syntactic meaning, like JS does for newlines. `;` should be a default separator.
    * what if we detect next expression as next unrelated operand, regardless of separator?
    - nah, too much noise.

## [x] Compiler: How do we map various clauses to wat/wasm? → ~~`allocBlock` function, untyped (f64 by default), see audio-gain~~ we don't use clauses

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

    10.a ✱ `inptr = allocBlock(2); outptr = gain(inptr, gain)`
      - allocated memory cannot be reused by another number of channels
        ~ that region can be read though
        ~ that can be undesirable practice to reuse same memory for different arg types
      + can store information about number of channels in this slot
        * memory at pointer should have a flag for clause selector to quickly check if that area is block
      + signature matches directly function arguments
      - not passing blockSize as last argument makes direct non-batch call return single value.
        ~+ direct calls have nothing to do with block size - we don't pass blocks as args to them.
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
    10.e `malloc(2*blockSize); gain(inptr, gainptr, outptr, 2, 0, 2)`
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
      - redundant arguments; we can store them in pointer itself.
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
  + (input, aParam, kParam) signature handles any-channels input
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

## [x] Autogenerate mono/stereo clauses fn code or define fn clauses manually in syntax -> ~~autogenerate~~ manual

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

  3. Rethinking. Since we don't allow overloading and external batch argument is explicitly defined via `~`, we can autogenerate function code for simple mono & stereo cases automatically.
    + doesn't enforce array destructuring
    + saves lots of manual code
    + saves namespace

## [x] ? Should we provide param types or not? -> ~~try explicit dims notation `[1024]in`~~ -> nah, can pass ptr directly
  * kParam type clause can save 1024 memory reads per block.

  1. hide implementation detail of kRate/aRate and generate both clauses depending on input type.
    - see zzfx: myriad of params generate O^2 clauses. A mess.
      → we need some indicator of param type
  2. generate params via typescript-like syntax `param: kType`
    - colon is too ambiguous
    + very common: rtype, hegel, flow use same notation
    - needs separate type parsing/tracking subsystem, whereas name immediately reflects type
    + allows multitype definition as `frequency:aParam|kParam`
      + this solves redirection problem
    - types are reserved words, we have policy of 0 reserved words
    - conflicts with other cases of colon, like condition or named args
  3. use csound-like prefixing for identifying params: ifrequency, ainput, gi
    + melds in global params organically `gTime, gSampleRate` (which is glsl-familiar)
    + name reflects type constantly
    + shortness
    - problematic destructuring of multiple channels: gain((al,ar) in -1..1)
      ~ can be mitigated by default params falling back to a-type `gain((l,r) in -1..1, kGain)`
      ~ destructuring could be prohibited
        ~ but we need that for indicating simple layout cases `l,r` vs generic-channel case `..ch`
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

  7. what if we use unclosed range `gain((..ch), amp)`
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
    - mixes up either with groups definition or

    8. * use `~` as indicator of input or output?
      * `gain(~input, amp)`, `gain(~[left, right], amp)`, `fn() = ~[l, r]`, `fn() = ~channels`
      + looks cool as indicator of expected waveform `~` as input or output
      + can better indicate `~in` as list of channels, rather than exceptional `[..in]`
      - `~` can be unnecessary if returning input variable: `gain(~in, amp) = in * amp`, `gain(~in, amp) = ~in * amp`
        ~ (can be fine, it's just an indicator of batch)
      - preliminary return mess: `gen() = (cond ? ^~[l,r]; ~[l,r])`
        ~ doesn't have much meaning by itself, out is supposed to be batch-variable.
        ~ can be rather an exception, expecting variable to be defined a bit in advance
      * `gen() = (~out; ...fill up out...; out)`
        - can mess with state `(~*out)`, `(*~out)`
          ~ stateful by default, stores result of last processing anyways, so that's just `(~out)`
        - not clear at first what to initialize this variable to - list of channels or a single channel
          ~ can do `(~[l,r];...)` or `(~chx;...)` same as input
            - unclear the total number of channels in `chx`. Max?
              ~ Maximum limits processing capabilities (can be configured)
        + maybe that's better to explicitly initialize output here indeed, since that's returned from function via API as block
        - conflict with binary inverse (NOT) `~a` vs declaring a batch variable.
          ~ NOT is used in expressions after _number_ declaration, wheres channels is only in declaration and not in expressions;
        - dissonanc-ish with `a ~> b` and `a <~ b`
          ~ these two are not stabilized yet
      + matches `.`, `*` paradigm
      * `~gen() = (out)`
        + simplifies output type indicator as block.

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


## [x] Instantiation of sound → no instantiation, use function state for manual tracking time/params.

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

## [x] Batch function reads from memory; regular function takes arguments. How to differentiate them? → we don't have batch functions, loops are trivial

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
  5. Indicate batch by `~` symbol.

## [x] Batching

  * Batch runs a fn against some context like `#t, #i, #sampleRate, #blockSize`, incrementing #t/#i
  * Batch must compile fn clause, not take some fn
    → we don't batch compiled clause/function by external means, batch is special defined-in-advance clause with loop inside
  * batch can take last argument as number of items to process (count)
    - that implies for multichannel input to pass pointers to each individual channel, or else that count gets meaning of "blockSize" (not generic number of samples to process)
  → just have global blockSize, allocBlock and make functions match signature in son 1:1, by passing blocks for batching

## [x] Tree shaking
  * must shake off unused fns in compilation

## [x] Latr: alloc, array etc.
  * latr can provide alloc and other common helpers
  - not latr but std. Latr is generic synthesis/science
  * Lino Audio Testing Routines
  * Lino Audio Toolkit ... R?
  * Laboratory Transformator

## [x] Array/string length → `arr[]` for length is the most natural
  * Ref https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(array)
  * Ref https://en.wikipedia.org/wiki/Cardinality
  * Lua, J langs propose # operator for length
    + Math #S indicates cardinality. (number of something)
    + `#` is `number of` (in Russian №)
    - `#str` in module space means "load module", `#str` in function scope means `length of function`
    - `#str` doesn't work well as "length of string"
    -~ `abs()` allows group inside, making # a unary operator would create `#(a,b,c)` stuff, which has strong intuition as records-ish
      - `#(a,b,c)` doesn't make clear if that's number of items or abs values of all internals (likely the second?)
    - `#` borrows from `a4#`, which would be nice ids for notes.
  * `\` for length:
    + Similar to ᴓ === radius/diameter of something
    + Escapes === "literal" meaning of variable
    + Less noisy compared to #
    + Leaves # available for identifier names & notes
    - looks yucky, like escapes/regexps
    - TeX guys and score notations like Guido use `\` for command
  * Icon, Unicon propose * operator for length
  * ? `melody_string[]`
    ~+ sort of math association
    ~+ sort of #, but not as generic
    ~+ empty array is unused anyways
    - `(a,b,c)[]` is a mess, `#(a,b,c)` is fine.
      ~ not really an argument.
    + natural-ish, puts in the same row as members access
    + points to modulo operator, like, accessing not single member but length
  * ? We can do |a| operator for abs(a) or a.length
    + Math notation is |a|
    - fn syntax is waaay more familiar
    - higher entropy compared to other ops
    - symmetricity causes special parsing requirements as prefix/postfix: `|a + |b * c| / d|`
    + rust uses that for closure syntax
    ~ not a big deal tbh, arr[-1] is good for last el
  * ? We can do a[0] for array length, and start items from 1: a[1], ...
    + last element coincides with length, a[a.0] === last
  * ? we still may want to have .last, .length aliases
    - .length can shadow named array properties.
      ~ not a big deal: that's just an alias
    - .length isn't nice for groups
      ~ that's fine too
    + we use aliases in fn arguments, in arrays anyways
    + that's strongest convention
    - that violates no-keywords principle somewhat, forcing generic structures into latin range
  * channels | len
    - precedence isn't nice

## [x] Binary operators → let's stick to common syntax and not break it

  1. JS convention: a|b, a&b, a^b
    - occupies significant operators with secondary operations
    - conflicts with a^b as math exponentiation
    - conflicts with topic operator ^ + b
  2. Overloaded a+b, a*b for booleans
    - doesn't apply for integers
  3. Reverse convention: a&&b, a||b, a^^b for binaries
    + shorter conditioning a & b | c
    - unconventional
  4. Get rid of them
    + they occupy very useful syntax space
    + it's not very clear which numbers we're dealing with: float or int?
    + bytebeat is very narrow subset of sounds and is unlikely to reproduce anything super useful
    - makes bytebeats harder to implement
    - makes useless 0x00 and 0b00 notations
    + less questions of converting one numbers to another

## [x] ASI: semicolons or not? → enforce semicolons. But last one is optional.

  1. Don't enforce `;` everywhere. Recognize newline intelligently.
    - C/Java-family has them mandatory; Also many JS folk tend to make it mandatory also.
    - It's just simpler and more explicit to have them everywhere
    - It's also a bit low-level-y feeling, which is rather good
    - easier to parse via ;
      ~ prohibits empty statements
    - no ASI JS problems
    - there's no that blankline intuition in natural languages nor math:
      newline continues prev line, explicit convention
    + "bullshit" noise
      ~ well it's line noise

## [x] Flowy operators -> ~~<-~~ ~~>-~~ -<

  Draft is ready, needs polishing corners and reaching the planned feeling.
  Taking r&d issues and aligning them.

  * There are 4 types available: numbers, functions, booleans, strings. Build around that and reinforce that.

  * <-, ->, >-, -< is group of similar operators, they should build intuition around. "Would be cool if JS had them"
    * |: → :>, <: loop → nah, `-<` is nicer for loop?
    * `<-` is in operator
    * `>-` is reducer? or something else? switch?
    * `->` is lambda

  * Don't extend conditionals, elvis `?:` is enough, the rest is &&, ||

## [x] Make channeled input an array: `gain([left, right], amp)` instead of group destructuring `gain((left, right), amp)`? -> nah, avoid unnecessary meaning for destruction

  + array better refers to memory send to input, not some internal grouping - so it's a "frame"
  + it allows more clearly indicate output signal, opposed to just grouped value:
   * `phase -> (sin(phase))` === `phase -> sin(phase)` - because group of 1 element is that element;
   * `phase -> [sin(phase)]` - that's output signal.
  - returning [..ch] vs [..size] − conflict with array creation
    - [a] means frame with 1 channel, [a] also means array with 1 item.
    - [..a] means frame with `a` channels, [..a] also means array with `a` items.
    ? prohibit array signature in favor of groups: `(..size)` can define a group as well...
      - nah, groups are just syntax sugar, they don't have serialization or own taste, whereas arrays do.
    ~ if blockSize === 1, block frame becomes identical to array
    - when we return [a,b,c] it implies frame, but we may want regular non-batch array result, do we?
      ~ worst case it creates redundant block, but the way value is read from it is still array-like frame.
      → ok, let's keep same for now: it seems array===frame is not a crime
        -? how do we adjust block-size then? We don't need 1024 items spawned instead of just 1.
        - frame output creates internal unnecessary loop
  - also, `fn([..ch])` is not nice notation for just getting all channels. Marking argument as "input" would be easier.
  -> Nah, avoid unnecessary meaning for destruction.

## [x] No-keywords? Let's try. i18n is a good call.

  * for(a,b,c) is valid fn; if(a,b) is valid fn;
  + It allows compressing code to no-spaces, which can be nice for serialization to/from string;
  + Natural languages or math equations don't have keywords in punctuation. Imagine if we had to write sentences where some of words were syntactic. It's fine - everyone got used to punctuational conventions and even don't mix up ...a and a..b
  + From ancient times scientists separated meta-meaning (take music staff notation) from actual content by different kind of notation.
  + No-keywords removes English language bias, allowing real i18 code.
  + It frees user from caring about variable name conflict. `in`, `from`, `if`, `for`, `at` can be useful variable bits.
  + JS keywords are ridiculous: they block many good names pushing user use marginal names.
  + keywords play role of comments anyways. It's better to put freeword explanation into comments rather than pollute language.

## [x] Import no-keyword? -> @ 'math#floor' or like that

  * No need to define scope: imports full contents
  * #[math]; (Rusti)
  * `# 'math', './my-mod.son', 'musi'`
    + like md title
    + shortcut from #include, #import in C, C++, Obj C
    + `# 'math': sin, cos;`
    + shebang starts as `#!`
    + music sheets start with # and b
    + similar to Rust
    - conflicts with cardinality (number) operator: #str literally means number of items in string.
  * shebang `#!'math'`
  * ... 'math', 'latr', 'musi';
  * << 'math', 'latr', 'musi';
    + (mathematica, wolfram)
    + C-streams like
  * ! 'math', 'latr', 'musi'
    + matches doctype delcaration
    + reversed i
  * <'math', 'latr', 'musi'>
  * :: 'math', 'latr', 'musi'
  * > 'math', 'latr', 'musi'
    + quote in md
  * {{math}} {{latr}} {{musi}}
    + like django templates
  * {'math', 'latr', 'musi'}
    - occupies sets convention
  * `& 'math', 'latr', './my.son'`
    + semantically makes point as "with math"
    + et ≈ include
    - no easy way to scope imports
    - might be occupied by state
  * @ 'math', 'latr', './my.son'
    + at - better reflects
  * +'math', +'latr', +'musi', +'my-module':
    * overloaded + for atoms includes them
  * wildcard? 'math.*', 'latr.*', './my.son/*'
  * `* :: 'math', sin, cos :: 'math'`
  * `@math: sin, cos; @latr; @./my-lib.son`
    + at math: sin, cos
    + @ has address intuition, which better fits for paths.
  * `sin, cos @ 'math', * @ 'latr'`
    + a,b at source
    +~ reminds npm namespace convention
    + CSS @import, Objective C @import.
    + relatively exceptional character, compared to #, :, &
    - conflicts with npm namespaces `osc1, osc2 @ '@audio-lab/synt'`
      ~ we may not necessarily want to resolve node_modules path, it's going to be either just `synth` or full path.
    + no case-sensitivity problem, `math#PI` and `math#pi` are different
    + it's more obvious that variables become part of scope, rather than figuring out vars from atom `'#a,b,c'`
  *! what if npm module namespace convention? `'@math/sin,cos'`, `'./my-sound.son/*'`
    ~ similar to just @
  * `'math' / sin, cos;`
    ? 'math' / *; ?
  * `'math': sin,cos, 'latr': *`
    - too pale, usual and conflicting
  * `sin,cos =< 'math'`
  * `sin,cos -< math`
    - conflict with reducer >-
  * `'math'!sin,cos, '@audio-lab/synth'!, './my-sound.son'!`
    - prefix is easier identifiable
  * `osc1, osc2 =: '@audio-lab/synt'`
  * `<math>, <./path/to/my/son>, <@audio-lab/synth>`
  * sin, cos <- 'math', <- '@audio-lab/synth'
    + reminds list comprehension with assignment
    - conflict with arrow function ->

  ? is there a change we're going to need to include generic binary fragments?

  * importing all is not nice pattern: that causes implicit conflict.
    * it's better to always assign to a variable to make importable parts explicit.
    - conflicts with notes. We need to import all of them.

## [x] Import subparts → try `@ 'math#floor,cos,sin'`

  1. `@ 'math': sin, cos`
    + defines global functions
    + less problem scoping imports

  2. `@ 'math#sin,cos'`
    + [qwik](https://www.builder.io/blog/hydration-is-pure-overhead)-like
    + URL notation
    + SVG `<use href="#ref-to-part">`
    + no `:` overloading.
    - global functions come as part of atom
      ~ they're not really global
    + easier to type
    - list `#a,b,c` is non-standard-ish.
    - disallows spaces: `@ 'math#pi,sin,abs';` looks messy, if imports many items
      ~ maybe that's nice, since it's not full-fledged syntax anyways
      ~ besides URLs are like that yep, have a look at font imports.
      + smaller
    + looks cleaner as a single "addressing" token.
    + easier to indicate "import all" as just `@ 'math'`

  2.1 `@math#sin,cos`, `@./path/to/file.son#a,b,c`
    - messes up with native syntax - paths are not part of it.

  3. `sin,cos @ math`
    + sounds nicely
    + obvious definition of global module variables, not some part of atom
    + similar to assignment by order
    - scoping problem, same as JS.

  3.1 `math @ sin, cos`

## [x] Do we need to have `@` for imports? Can't we just indicate atom directly? -> we can import without atoms

  ? Can we do directly `'math#sin,cos'`?
  + saves from `@'@brain/pkg'` case
  + frees `@`
    - maybe we don't need too much diversity in var names, `#` for arrays, `_` for privates and `$` for specials is enough
  + less cognitive load, very simple
  + less characters
  - reserves atoms for single-purpose use, better keep them for generic escaping non-codes?
    + case-insensitive code doesn't make point for quoted values
      * so qotes only act as separators from regular syntax, not literal strings
  - some imports can be without quotes, like `@math#pi;`
    + less separation from code

## [x] Wasmtree instead of IR would be simpler -> nope, it's less flexible and less supported

  * ['module', ['func', '$name', ['param', 'a', 'b'], ...statements], ['global'], ['exports']]
  + it would allow to just apply a bunch of transforms to inputs, keeping the format
  + it takes less space and less computation
  + it is easier serializable

## [x] How to differentiate a-param from k-param argument -> no fn overloading

  * There's no way to differentiate gain(channels, aParam) and gain(channels, kParam).

  1. `offset = block(n)` offset can be float, which works for `typedarray.set(data,offset)`, as well as indicates kParam type.
    * ? Only takes finding out "impossible-ish" fraction values.
      * we can export that "key fraction" turning argument into offset as global
      * ? What if fraction reflects actual offset? Eg. 1234.0000004321
        - nah, that increases possible fractions
      * Consider also main part must be one of limited set of addresses.
      * Suppose different orders encoding reduces chance. Eg. `1234.1112340000000114321000000111234`
        * Similar to passwords encoding: more concepts engaged the better.
          + order gaps
          + static part of a key (11)
          + replica of a key (1234)
          + reflection of a key (4321)
          + ? sum of a key
          + https://en.wikipedia.org/wiki/Luhn_algorithm ?
        * Each this check reduces chance of matching offset with random input argument.
    - That's too shaky
  2. Export under different names: gain_a_k, gain_a2_k, gain_a1_a1
    + no conflicts
    + no perf tax
    + scalability (say, another input argument type)
    - Exporting all these names pointlessly increase module size
      ~ insignificantly though
    - `k` isn't real k-param, it's simple argument.
      ~ can be done as real k-param
  3. `[inputId, inputOffset] = aparam(n); process(inputId, ...args)`
    - decouples inputId from inputOffset: can be not obvious what passing id means.
  → 4. Prohibit overloading functions?
    + removes ambiguity
    + simple solution
    + all pros from 2.
    + solves this issue completely
    + doesn't enforce artificial naming convention
    + argument doesn't drive function clause
    - it complicates `curve(input, param)` and `input | curve(param)` case.
      ~ either we introduce pipe operator `input |> curve(param)`
        + less code (no need to define pipe fns), + less need in arrow functions, + less overloaded operators

## [x] Do we need arrow functions? → Lets wait for use-case for now, but worst case make them macro/operator-helpers

  ? Are they unnecessary?

  - two types of fn declaration - direct and "situational"
  - we have just single use-case for now, which seems to be "fancy js" rather than sound code
  - classic sounds indeed don't use situational functions, maybe that's even against nature of sound mechanics
  - in line noise paradigm <-, -< / ->, >- they create a bit of abstract level confusion:
    * <-, -< act on "flat" level, whereas
    * ->, >- () -> act on "functional" level
  - introduce questions how to use pipes a | x -> x+1: without arrow fns there would be less options
  -! reduce/flat can be organized as `i < #arr <| sum += arr[i++]`
  -! map can be organized as `(item <- arr <| item * 2)`
  -- (+) it frees `->` operator space, making it asymmetrical
    + can be filled! like map?
  -- (+) `|>` still kind-of requires function on the right-side and is similar to `|` operator
    !+? can take attributes as `(cur, next) <- arr -< a + b`
      - nah, likely need to be `(cur, i) <- arr`
    ?! what if unlike `-<`, `>-` "reduces" attributes as `(sum, item) <- arr >- sum + item`
    ?! what if use `->, >-` pair for map/fold/converge? like `arr >- (a,b,c) -> a + b + c`
      + looks similar to old patterns
      + has nothing to do with arrow functions
      + arrow functions are macro-helpers, not runtime constructs

## [ ] Live env requirements

  1) compilable in a worker thread
  2) hot swapping code in the worklet as it is playing and reusing memory state from the previous compile. If there's a delay/note/reverb tail playing from the previous compilation, and i compile a change, the new instance should inherit all the memory/buffers from the previous one, not start from zero. I have to be able to make changes without affecting the sound that is playing (too much). It won't be possible for 100% of the cases, but if the compiler can match the previous buffers with the new one then it should reuse them.
  3) parser/compiler errors with line/col/symbol/token information so they can be displayed inline in the editor while the user is typing, so they see what they're doing wrong. They don't need to be extremely descriptive, but at least showing the right symbol position i.e what to draw red.
  4) a way to export certain parameters into UI elements arbitrarily and with minimal effort. Right now in mono i've introduced a . prefix operator in the arguments so f(a, b, c) if i do f(a, .b, c) then i immediately get a knob for 'b' with that simple addition of the . prefix. That helps me a lot as a producer to not have to go elsewhere to define these and to try new things. The '.b' also becomes hoverable and can change with the wheel, but there's also a UI knob and they're associated, when you hover one, both light up. The idea is that once you export the controls like that, you can hide the editor and that can be a standalone effect/instrument with those controls it pulls from the code. You want another thing to tweak? Simply jump into the code and add a . next to the parameter and save. When there will be dozens of instruments and effects in the screen playing you need to be able to quickly do these things so you don't kill the flow. The flow must never be killed. That's the most important feature. You should be dancing all your way through from start to end while making a track without any gap of having to stop and take closer look at code or something isn't playing right or there are audible glitches etc. So first and foremost it is a party tool. You need to be able to party with it or it's worth nothing.

## [x] Tape machines -> try using array with shift, no need for explicit tape machines

  * They're like buffers/arrays, but every batch call they shift index.
  * In a way similar to state variables, but in fact state arrays (variables with memory of prev values)
  * In mono done as `v()=(#:1; y=#(0); #=y+1;y);` (create, read, write)

  1. `v = (in[2,1024]) -> (*state[1]; y=state.0; state.0=y+1; arr[100]=[1,2,3]; y)`
    + familiar conventions: init as type, stateful, access as array.
  ? have dim extension to any variable?
    - confusable for array
  ```
  fn = () -> (
    *a[1s * 48]; \ init stateful variable with 1s of memory
    *a[1s * 48] |= i -> abs(i); create stateful variable with past values
    a.0 = 2; \ write 2 at index 0
    a[0] = 2; \ same

    a.0 \ read current value
    a[0] \ same
    a.-1 \ read prev value
    a[-1000] \ read 1000th prev value (no rotation)
    a[-10..0] \ get array of last 10 values

    array = [..a] \ create array from all prev values
  )
  ```
  - init is conflicting with array property access.
    - we may need to expand that notation to defining arrays for any variables, eg. `a = [0..10]` vs `a[10]`,
      but obviously the latter is just array access.
    ~ that's special modifier for stateful initializer.
  - there's never positive index btw
    ? flipping to positive?
      - reversed logic for sound
  - 3 variations of structures/access: array, input, memory.
  ? what if we make regular arrays init as `a[3] = [a,b,c]`
    - confusing with setting 3rd member
  ? maybe that's fine not to have arrays defined like that?

  1.1 Init all variables via `~i, ~x, ~s` etc.
    + brings arrays to the same level as `~arr[10]`, `*state[10]`, `(in[2,1024])`
    + literally means "variable"
    + indicates all used variables explicitly
      - forces redundant notation: can easily init directly
    + introduces "variable type": can be `.param=10 <- 0..100` for external param via UI (unlike argument).

  1.2 ~~Alternative notation for saved state: `v = (in) -> (*a[10]; a'0=a'-1+a'-2)`~~
    - Mess up with strings/quotes, nah

  2. ~~`v = (in:(3,1024) <- -1..1, amp) -> (*a:(1s*48); b:1024 = [1,2,3]; a.0 + b.0)`~~
  - same drawbacks
  - less apparent
  + non-conflicting notation
  + reminiscent of types
  + colon is free-ish
  - args messup via comma
  - not elegant parens

  2.1 ~~`v = (in:3:1024 <- -1..1, amp) -> (*a:1s*48; b:ch:1024 = [ch1,ch2]; a.0 + b.0)`~~
    - doesn't match neither with `[]` nor `.`
    - confusable with naming/alias - `[x:10, y:20]` - is that array with aliases, or array with 2 arrays?
  2.2 ~~`v = (in#3#1024 <- -1..1, amp) -> (*a#1s*48; b#ch#1024 = [ch1,ch2]; a.0 + b.0)`~~
    + reminds length by meaning
    - crammed noise
  2.3 ~~`v = (in.3.1024 <- -1..1, amp) -> (*a.1s*48; b.ch.1024 = [ch1,ch2]; a.0 + b.0)`~~
    - same drawbacks as `[]`

  3. ~~`v = (in{3,1024} <- -1..1, amp) -> (*a{1s*48}; b{1024} = [1,2,3,...]; a.0+b.0)`~~
  - bad association with heavy stuff: sets, objects, structs, block etc.

  4. Don't use any special notation for arrays.
    + we know array sizing in advance on init, always-ish?
    ~ we can allow a[] = [1,2,3] for autoinit
    + mem state and input arg state are indeed a bit special cases
    + `*x[100]` or `(in[100])` can be more thought as "index space" rather than special object kind definition.

  5. Can't we just define infinite memory / past values?
    * mem layout seems to be helpful & useful elsewhere
      ? like where? we don't really use it: arrays can be figured out from memory itself...

  6. Don't use any arrays syntax extension: `v = (in <- -1..1, amp) -> (*a = [..1s]; b = [1,2,3,...]; a.0+b.0)`
    + Solves problem of syntax.
    - Doesn't solve problem of tapes / inputs:

  7. Use unindexed `v = (in[] <- -1..1, amp) -> (*a[] = [..1s]; b[] = [1,2,3,...]; a.0+b.0)`
    + Unified notation
    - Not really useful if we assign arrays after anyways
    + We may not ever need initializing arrays to some length, like `b[100]=[1,2,3];`
      * It can always get length from values.
        - we may want to have sub-array though instead of slicing original array, ie. `b = a[0..10]` and `b[10] = a` are different.
        ? do we ever need slicing arrays? Can't we just always return subarrays?
        ? to actually slice array we'd need create new one as `b = [a[0..10]]`
          + more explicit reflection of what's going on
          - we can't easily subarray as `a[1,3,5..7,-1]`
      * Whereas input arg makes sense as both `in[]` (iterate all available) and `in[100]` (iterate until 100).
      * Same as memory `x[]` - save all values ever and `x[1s]` - store 1s of data.

  8. Indicate dims in advance? `v = ([2,1024]in <- -1..1, amp) -> (*[1s]a; [1024]b = [1,2,3,...]; a.0+b.0)`
    + matches prefix type indicator pattern
    - swaps order: `[10]in; in.7=1` vs `in[10]; in[7]=1`.

  9. Make first (init), then read. `in[10] = [1,2,3]; in[9] = 1;`
    - very confusing same notation different meaning;
  9.1 `in[10] = list` means create sublist; `in[9] = number;` means write number;
    + There's a chance we cannot export array with various-type values from WASM, like array must be unitype and not nested.

  10. Length operator: `v = (in\1024 <- -1..1, amp) -> (*a\1s; b\5 = [1,2,3,...]; a.0+b.0)`
    + matches length notation
  10.1 Old length operator: `v = (in#1024 <- -1..1, amp) -> (*a#(1s*sr); b#5 = [1,2,3,...]; a.0+b.0)`
    + matches length as `#in === 1024`
    + matches meaning of # as length
    + reminds # from mono
    ? how to define unknown-length?
      ? maybe enforce length and enforce passing memory pointer?
    - looks noisy, # wants to be part of id, not full operator
    - calculated values like `a#(1s*sr)` require more characters
    - not clear how to indicate any-length
    - occupies # char

  10 + 8. Alt length operator `v = ([]in <- -1..1, amp) -> (*[1s]a; []b = [1,2,3,...]; a.0+b.0)`
    + both kinds of sizes possible
    - lame as length/abs operator: []123 is lame.
    + `*[]x` has more meaning than `*x[]` - this way we indicate size of memory, not size of `x` in memory.
    + `[]x` is golang array notation

### [x] Should we instead of batch variable indicate arg layout? -> ~~yes, meaningful for all input var, array var and state var.~~ no, just array pointer

  Before:
  ```
  gain(~in, amp) = ~in*amp;     // input/output channeled data (for batch call)
  generate() = (
    ~chans=[left,right,..rest]; // define channels (batch) variable
    chans.l, chans.r            // channel name aliases
    chans.0, chans.1            // channel index aliases
    chans
  );
  ```

  After:
  ```
  blockSize
  gain = (in[2,blockSize], amp) -> [ch <- in <| [x <- ch <| x * amp]];
  generate = () -> (chans[2,blockSize]; chans);
  ```

  + allows customizing block size / channels layout more explicitly
    + no implicit layout conventions = less configurations
  + matches memory var signature
  + output is just an array
  + compatible with array, just different processing meaning, so `arr = [..tape]` can be just copy
  - [x] it doesn't iterate over values automatically and needs some extra wrapper
    + allows more explicit iteration pattern
    + allows direct mono/stereo clause as `gain0 = (in, amp) -> in*amp; gain1 = (in[1024], amp) -> x <- in <| gain0(x, in)`
    + in fact, arrays can expose ops automatically to all elements, so that `gain(in[len], amp) -> in * amp` just multiplies all.
  - no channel name auto-aliases
    ~? can be made global swizzle aliases?
      + can be overridden by named indexes
    ~? can be provided explicitly as named indexes
  - no clear intuition does that behave like array or saved-state array?
  + very natural notation, as if groups are created for expressing strides
  !+ arrays can be always flat, but layout defines how they should be read

### [x] Tape machine: layout/access logic? -> ~~let's do a.0, a.1 for past values~~ let's not do past logic due to access tax

  1. a[0] current, a[-1] prev
    + very natural
    - long syntax
    + better mem implementation: compiles to a[(iteration+shift) % len]
  2. a[0] current, a[1] prev
    + allows a.0, a.1, a.2
    + better memory layout (in order)
    + matches array layout
    + it already indexes like that in biquad filter code `x1,x2 = x0,x1`

## [x] Should we make mandatory var initializing area `~i=0;`? -> nah

  (indicated above in 1.1):
  + brings arrays to the same level as `~arr[10]`, `*state[10]`, `(in[2,1024])`
  + literally means "variable"
  + indicates all used variables explicitly
    - forces redundant notation: can easily init directly
      ~ isn't that heavy burden: can be as useful as direct init, but easier to parse
  + introduces "variable type": can be `.param=10 <- 0..100` for external param via UI (unlike argument).
  - conflicts with global "no-prefix" inits.
    ~ we can make it an indicator of actual variable, opposed to const `-arr[10]`
      - still, pollutes global...
        ~ can be quite useful, as indicator that we don't change globals. So only globals can be defined directly.
  - a concept user doesn't have to know necessarily

## [x] UI variables -> move to latr

  1. Special syntax?
  ```
  gain = in -> (
    .amp=1 <- 0.1..100;       // create UI knob for amp
    in*amp
  );
  ```

  2. Can be just external fn
  ```
  'latr#knob'
  gain = in -> (
    amp=knob(1, 0.1..100);       // create UI knob for amp
    in*amp
  );
  ```
  + better customizable: log axis, linear, type, step
  + comes with other tools: logging, profiling

## [x] Remove loops? -> let's try removing `<-` as `in` operator

  * We can replace `x <- list <| x + 5` with `list | x -> x + 5`
  * We can replace `x < len <| body` with `..len | i -> body`
  * We can replace `condition <| xxx` with `0.. | i -> xxx`
    ?~ break can be done as `0.. | i -> (!cond ? ^^; xxx)`
  + makes `<-` actual clamp operator, rather than `in`
  + keeps only standard connections

  * ALT: we can remove only `<-` from iteration, replacing it with `set | x -> x`
  + removes ambiguity of `<-`: for clamp only
  + simplifies cases
  + removes left-direction case like `x <- list <| xxx`
  + makes loops less frequent and more meaningful
  + `<-` as clamp replaces min, max as well

## [x] Channel aliases / ordering note -> can be defined manually or via musi

  from https://learn.microsoft.com/en-us/previous-versions/windows/hardware/design/dn653308(v=vs.85):
  Front Left - FL
  Front Right - FR
  Front Center - FC
  Low Frequency - LF
  Back Left - BL
  Back Right - BR
  Front Left of Center - FLC
  Front Right of Center - FRC
  Back Center - BC
  Side Left - SL
  Side Right - SR
  Top Center - TC
  Top Front Left - TFL
  Top Front Center - TFC
  Top Front Right - TFR
  Top Back Left - TBL
  Top Back Center - TBC
  Top Back Right - TBR

## [ ] Defer -> `x(a) = (>>log(a); >>a+=1; a)`

  + like golang defer execution runs item after function return
  + allows separating return value from increments needed after function
  ? no deferring?
    + obvious code sequence
    + no conceptual/syntax/mental layer over operator
    - no nice definition of variable state and its change
    - noisy code of creating result holder var, performing state update, returning result
    + kind of natural
    - state vars really need it, `x()=(*a=[0,1];>>a[1..]=a[0..];)`
  * symbols: `>>, ||, ~>, //, \\, >-, >>|, <|, <!`,
    * `x()=(@(a);b,c;@(d))`
      - brings `@` into local scope
      - not straight meaning
    * `x() = (//a; b,c; //d;)`
      - strong association with comment
    * `x() = (*i=0;\i++;)`, `x()=(\a; b,c,; \d;)`, `x(a) = (\log(a); \a+=1; a)`
      - a bit too heavy by meaning
      - takes away cool `\\` as comments
    * `x() = (*i=0;**i++;)`, `x()=(**a; b,c,; **d;)`, `x(a) = (**log(a); **a+=1; a)`
      * `x()=(*a=[0,1];**a[1..]=a[0..])`
    * `x() = (/a; b,c; /d;)`, `x()=(*i=0;/i++;*phase=0;/phase+=t;)`, `x()=(/log(a))`
      + one-symbol
      + associates with reddit tags
      + associates with HTML close-elements
      + generally "close" meaning is `/`
      + complementary with `*` as `*a=0; /a++;`
        - reinforces meaning of opposites `*/`, which is not the case here
      + doesn't feel like part of identifier
      - too many slashes `/a/b\\divide a by b`
      - too strong association with something not-end, like `/imagine` or etc.
      - doesn't feel right typing `/` as meaning for defer.
    * `x() = (&a; b,c; &d)`
      + meaning of "and also this"
      + also "counterpart" of `*` from C-lang
        + it was even an alternative to `*` in the beginning
      - has meaning as "part" of identifier, not operator (higher precedence)
        - ie. `&i++` raises confusion, it's not `&(i++)`, it's `(&i)++`
    * `x() = (~a; b,c; ~d)`
      + meaning of "destructor"
      + relatively safe within other options: `/i++, \i++, &i++, 'i++, #i++, @i++, >>i++, .i++`
      + follows spirit of C in terms of "common" operators choice `*, ~`
      + `~` means "after all that is here"
      + `~` also means "delete" or "erase" in markdown
      + minimal noise
      - subtle dissonance with `*`: `x()=(*i=0;~i++;)`
      - reserved for unary "binary inversion", already married
    * `x() = (a.; b,c; d.)`
      + meaning "at the end"
      + same operator is used for export
      - not immediately obvious that it's deferring `*phase=init; phase+=(iterating,phase).;`
      - not nice with `*i=0,i++.;`
        - not clear if the whole phrase is at the end or just i++
    * `x() = (.a; b,c; .d)`
      - has wrong associatino with property access
    * `x() = (&i=0;*i++)`
      - takes away "save" meaning
      + star means "footnote", like "afterword" in typographics
      + `&` means "with" for variables, it was main alternative to `*`
      - `*` has too strong association with "save"
    * `x() = (*i=0;>>i++;)`, `x()=(>>a; b,c,; >>d;)`, `x(a) = (>>log(a); >>a+=1; a)`
      + clear meaning of "shift"
      + Sercy sneezed
      + related to playback's `>>` as fast-forward
      - association with C++ pipe (cout)
      - 2 chars, opposed to 1 char in `*i=0;`
      - a bit too much visual noise, defer doesn't have primary meaning
    * `x() = (*i=0;>i++;*phase=0;>phase+=t;)`, `x()=(>log(a);>a+=1;)`
      + refers to `>>`
      + obvious that there's something fishy going on
      + refers to "quote" from markdown
      + minimal
      + adds to the feeling of flow
      + association with terminal's command "output"
      - breaks loop `a |> b` into `a | >b`
        ~ fixable-ish via precedence
        ~ loop has never defers (?)
        ? can we change loop to `?>`, so it means "until condition holds, defer code"
      - a bit heavy, ruby-like, unfamiliar vibe
    * `x() = (*i=0;>>|i++)`
      + `skip forward`
      - too many symbols
      - somehow related to pipes
    * `x()=(*i=0;=>i++;)`
      - equals noise
    * `x()=(*i=0;'i++)`
      + refers to footnote
      - quotes usually come in pairs
    * `x()=(*i=0;#i++)`
      + also refers to footnote
      + like hashtags, comes afterwards
      - a bit too heavy to reserve such prominent operator for just deferring
      - reserves # as operator
      + includes notion of "double", like double hash `//` in it
        ? is that why python uses # instead of // for comment?
      + associates with comment, something that comes "after"
    * `x() = (*i=0;::i++;)`, `x()=(::a; b,c,; ::d;)`, `x(a) = (::log(a); ::a+=1; a)`
      - noisy
    * `x() = (*i=0;:i++;)`, `x()=(:a; b,c,; :d;)`, `x(a) = (:log(a); :a+=1; a)`
      + 1-character only
      + kind-of matches meaning of labels in JS
      - a bit clumsy
    * `x() = (*i=0;^:i++;)`, `x()=(^:a; b,c,; ^:d;)`, `x(a) = (^:log(a); ^:a+=1; a)`
      + means "after return"
      - colon is not nice here
    * `x() = (*i=0;.i++;)`, `x()=(.a; b,c,; .d;)`, `x(a) = (.log(a); .a+=1; a)`
      - not easy to find-select

## [ ] !Prefer operator `x()=(a;<<x=1;a*x;)` - declares values at the beginning?

## [ ] Try-catch -> `x() ?= (a, b, c)` makes fn definition wrapped with try-catch

  ! Golang-like `result, err = fn()`
    + matches reverse-ternary op
    + also see trytm https://github.com/bdsqqq/try
    + returning group is nice, since the convention is always as last-element=error
    - can be an overkill to wrap every function in try-catch
  ? what if we define `throws` for the time of fn definition as `x() ?= (a,b,c)`?
    + better matches `try-catch block`
  * A symbol can be one of `!`, `@`, `?`
    ? `result, err = ?fn()`
      - conflicts with `a ? b`, `a ?: b`, `a ? b : c`
        - like `a = ?a() ? ?b() ? c() : ?d() ?: e()` - holy...
    ? what if `res, err = fn?()`
      - `a = a?() ? b?() ? c() : d()`
        - if we introduce plain conditionals `a ? b`, `a ?: b` then `a?(arg)` is indistinguishable from `a ? (arg)`
    ? `res = fn() : err`
      - same as above: `res = a ? fn() : err : fn2() : err`
  * Possible syntax: `fn(a) ?= (!a ? 'Bad arg'!; 1/a);`

## [ ] How do we define throw?
  * `!'Error message'`
    + makes use of atoms
  * `?'Error'`
  * `^'Error'`
    + similar by meaning to return
    + returning an atom indicates error
  ~- we can do that via just returns
  - Errors make program syntax case-sensitive

## [x] Pipe: replace with `|:` operator? -> let's use lowered-precedence `|` for now and see for side-effects

  + Doesn't mess up precedence of `a,b | c`
    - actually it's desired precedence...
  - Doesn't look like classic pipe

## [x] Switch operator problem: `a >- b ? c` vs `a > -b ? c` -> deprecate switch
  + switch can be more naturally and unambiguously expressed via sequence of ternaries

## [x] `in` operator problem: `a <- b ? c` vs `a < -b ? c` -> try removing `in` operator for now
  + removing it solves the issue
  + removing it makes iterators available only as maps: `list | x -> x`
    + which is less ambiguity
    + keeps loops logic simple

## [x] `a <~ b` vs `a < ~b` -> use `a ~< b` instead

## [ ] Case-insensitive variable names? -> let's try case-insensitive

  0. Case-insensitive

  + https://twitter.com/bloomofthehours/status/1491797450595528713?s=20&t=1aJpwIDrbNhIjwIohsvxiw
  + reduces use of camelcase convention
  - `AbB` vs `ABb` can be different chords, but lino mixes them up together
  - `X1` and `x1` can be different things in math
    ~ can be solved as eg. `x1` and `_x1` or `@x1`
  - `sampleRate` becomes `samplerate` - can be confusing
    ~ doesn't have to lowcase
  - export naming requirement: `'AbB': AbB, 'sampleRate': sampleRate.`?
    ~ can take exact name though
    + lowcase-enforced export is kind of cool, `exports.samplerate`
  - not much conventional, only MySQL and other oldies
  - import question: `@math:E` vs `@math.e`
    ~ can be solved via manual imports
  + solves problem mentioned by despawnerer (`dateRange` vs `daterange`)
  + lowcase is typographycally more expressive
  + code is robust to changing case, eg. as url string
  - `1Ms` vs `1ms`
    ~ not sure it's good idea to designate such meaning to capitalization
    ~ `1Ms` is super-unlikely, for bytes can use `1mb` - it's never millibyte
  + `#@$_` alleviate case-insensitivity
  - Strings don't allow code to be case-change robust.
    * we either discard strings or make it (half) case-sensitive
  - Atoms may require case-sensitivity, eg. for error messages
  -

  0.5 Capfirst-sensitive, (`Abc` == `ABc`) != (`aBC` == `abc`)

  + fixes problem of math/class capfirst difference (math `X1` vs `x1`, `Oscillator` vs `oscillator`)
  + fixes problem of despawnerer's `fullName` == `fullname`
  + capfirst is typographycally meaningful
  + can fix problem of units size
  - code is not robust to case-insensitive environments
  - import looks like `@math#Pi` still
  - doesn't solve constants issue, `PI` vs `pi` - would be cool to have `pi`

  1. Case-sensitive

  + Enables extra room for naming, eg. `Oscillator` creates oscillator vs `oscillator` is instance
  + Doesn't create exports naming conflict: `foo_bar` is non-js export name, like `samplerate`
  + More conventional: JS, C, Python
  - Possible problem mentioned by despawnerer: `fullName` vs `fullname`.
  ~ MySQL is fine being case-insensitive
  - import becomes case-sensitive `@math#pi` vs `@math#PI`
  - upcase consts are ugly
    ~ can be replaced with units
  - less meaning to atoms

  ? Maybe keep it case-insensitive, but match case by-export?

  2. Export operator `'a': a, 'sampleRate': sampleRate.`
  + Explicit export
  + Reverence to erlang and natural languages
  + Extra use & meaning of atoms
  + Quotes make nicer indicator of case-sensitivity
  + Solves problem of default exporting `0..10` or `() -> x`
  - redundancy: case can be figured out from name directly
  - some conflict with function return
  ~- we can use `^` operator for that purpose: `^sampleRate;`
    ? Can we use `.` postfix as indicator of procedure / void return? nah.
  - must be last, therefore redundant, since last expression is already exported.
    ~ nah - export and return are different operations

  3. Use atoms as case-sensitive variable names
  + enables quote-less imports `@math#pi` and `@'math#PI'`
    + `#` is part of variable name anyways
  - `'Oscillator'()` is unusual construct...
  - not clear if `'oscillator'`, `'Oscillator'`, `oscillator` and `Oscillator` resolve to the same
  - can cause conflicts with "bad" names, like `pipe/arg`

## [x] Ranges: how to organize in wasm level? -> let's try syntactic ranges only

  1. v128 as f64x2
    + stores
    - need to read vector item
    - exporting isn't allowed
    + exporting is possible

  2. 2 spots in memory
    - need to manage memory
    - need to read from memory
    ~+ exportable as pointer?
    + easy from use-case point

  3. function returning 2 values
    + exportable
    + best fit for the use-case
    - extra call
    - can possibly be not the best fit for clamp/etc, will force creating temp variables or calling twice.

  4. immediate values
    - impossible to export
    + fastest & direct

  4.5 ranges as syntax sugar, not data type
    ? do we ever need saved/exported ranges?.
    + allows fast direct static ranges easily
    + removes tacky problems: ranges combination, min/max reading (since they're immediately available)

## [x] Drop ints and use only f64? -> let's try to use only f64 for variables

  + waay less code
  + no type conversion question, since values are floats always
  + no type detection issue
  + f64 stores more ints than i32 (up to i52)
  - no compatibility with bytebeat
  - no meaningful shift/binary operations
    ? can we perform binary ops in terms of int parts of floats?
      ~+ i32 can be result of operation, eg. `a|b`
        * then we can track it similar to `static` property
        * eg. `(a|b)^c` doesn't convert back-forth between f64-i32 and only does binaries
      + we anyways track number of args from operation, so we can track their types or have flag detector in getDesc
  + less cognitive load for users:
    + less to learn from readme
    + less care about types
  + solves problem of variable reassignment, eg. `x=1;x=1.0`: we have only one type and don't wreck our brain.
  + we reserve i32 for internal tasks only
  + makes easy to store variables in memory
  -> ok, so variables are always f64, but calc results can be any, so we only extend i32 to f64 in assignment or fn return

## [x] How to pass int to a function? -> we force ints into floats every so often

  1. Detect i32 from default value `x(i=1)=(...)`
    - default value can be calculable, not primitive, eg. `x(a,b=a)=(...)`
    - floats downgrade to ints in external calls `x(5.4)`
    - we need to track fn signatures to perform calls
  2. Enforce float args, `x(i)=(...)`
    + f64 covers i32 range anyways, so even binary patterns can be preserved
    - some tax of converting i32 to float, that's it

## [x] Use f32 instead of f64 -> keep f64

  + it makes arrays have same stride for storing diffent types
    - not necessarily good, since there's no meaningful way to export such arrays and also we have to track member types
  + solves issue of endianness of float64 arrays - no way from to read via Float64Array, need to use DataView
    - fake issue, works fine
  + enough for majority sound purposes
    - not really, mistakes accumulate
  + more cross-platform compatible
  - not really

## [x] Comma operator precedence: a,b=c,d -> let's use more familiar flowy JS style a=1, b=2

  1. a,b=c,d -> (a,b)=(c,d)

  + python style
  + allows shothand nice swaps
  - problem with fn arguments parsing `(a=1,b=2) => `

  2. a,b=c,d -> (a),(b=c),(d)

  + js style
  + more fluent imho
  + allows function arguments
  - forces group-assign be parenthesized (a,b,c) = (d, e, f)
  + allows comma-style operations sequence, rather than python-like meaning, eg a++, b+=2, c=4,

  3. Single assignment is group, multiple is seq: `a,b = c,d` vs `a=b, c=d`

  + Allows unparented assignments `a,b=c,d;`
  ? What are potential confusions?
    - `a,b=c,d=e,f` - not allowed sequence of multiple assignments
    - `c=d,e` as return member or elsewhere considers only `c` as return instead of `c=d, e`
  - breaks regular parsing logic

## [ ] Should var scope be defined by parens `(x=1;(y=2;);y)` or by function? -> use per-function scope

  1. By parens: `y==undefined`

  + see "scope or not to scope"
  + universal scope definition, just referential to parent scope
  + allows cleaner namespace, no name contamination
  + allows easier namespaces
  - harder to implement
  + streamlines scopes mechanism
  + allows merging globalParse & localParse mechanism, we just have to properly detect variables.
  - `(a,b,c)=(1,2,3)` - this initializer logically creates `a,b,c` within first scope, which is false.
  - in-scope variables are one-time use - they can relatively safely be reused after, can't they?
  - `try {let x = 0;} catch(){ x===undefined }` - is not nice JS footgun, often we need variable from internal scope
  - hard to explain to users what's going on

  2. By function: `y==2`
  + closer to webassembly
  + easier to handle variables since have access to them
  + more transparency, `((a=1;); a++; (a=2;))` feels fine
  + function scope is already defined by function,
  + keeps parens original "safe" meaning of precedence, no logic changes
  + simpler var naming implementation logic
  + less variables-per-function in result
  + solves issue of loops `a <| x -> (y=x)` - `y` becomes function-wise variable
  - no scope isolation like `let` in JS, not sure what's usefulness of that

## [x] How to solve problem of array `length` in scope definition - it can't be used as variable name? -> use .scope

  * it's not just .length - it's any array methods

  1. Catch any set of variable with that name and map to some other name
  - too many modifications in code
  + fastest

  2. Extend array class with own class and redefine that property

  3. Use proxy to intercept access to .length

  4. Inherit from array as `Object.create(arr)`
  + we inherit anyways

  5. Inherit from array as `Object.create(Array.prototype)`
  - 10 times slower than direct array

  6. Just store in `scope.var`
  + fastest
  + no pollution
  + allows other subscopes, like import, export, args etc
  - doesn't do direct inheritance
    + enhances inheritance by maintaining pure object

  7. Store `node.scope` as vars.

## [x] Remove desugaring or keep? -> remove, make desugaring in analyser

  - desugaring solves initially
  + removing is shorter
  + desugaring can be done in-place
  + it can be helpful to maintain parentheses, since parens define scope
  + good for parens opening, not always scope is needed

## [x] Dynamic arrays, eg. `a->[1,a,2]` -> wait for structs generally, currently try memory pointers approach

  1. Alloc memory every return
  - needs somehow freeing memory, gc or manually
    - there doesn't seem to exist a reliable gc way, still would need manual run
  - harder for user to read values back: dealing with typed arrays, need to know $__memory naming

  2. Reuse memory by callsite
  - Subsequent call erases memory
  - Makes some conflict with stateful memory `*[10]a = [1,2,3]`, since that's almost identical by meaning except for auto-sliding

  3. Use multiple returns
  + Perfect user api
  + No memory collection issues
  - Limited to 1000 items
    ~ can be fine-ish for low-latency sounds
  - Compiles to bloated unrolled code
  + Limits lino to static (fixed-size) toy language
  - arrays make no point then

  4. Use wasm gc structs
  + standard way
  + perfect user api
  - not supported by anyone cept flagged chrome
    - chance it will ever be implemented is very small, since it super-complicates gc
    - gc: seems to undermine the point of wasm

  5. Prohibit dynamic arrays allocation: only global (exported) arrays
  + Maintains the old-school spirit of work with memory
  + That's good practice for DSP
  - That's inconsistent language API

  6. Prohibit arrays generally, in favor of work with memory
  + No need to add them until needed
  + Direct work with memory is more apparent
  ~ `x -> *[3]=(1,2,3)` returns internal fn memory, apparently
  +! we can redefine `<<` and `>>` for memory as shift operators, so that it's more apparent
    * `*[3]x; x << 1;` - shift left, `*[3]x; x >> 1;` - shift right
  ~? what's the difference between `([12]x) -> x` and `(*[12]x) -> x`
    * `*[123]x` allocates memory, whereas `[12]x` indicates reference to existing memory
      ? does that mean we can do `[123]x = memoryPtr`?
        ? whould we let creating at any offset then, eg `[123,6]x = memoryPtr`
  + that makes undefined-length arrays more attainable: `([]x)` means function can take any memory pointer
    * and we can track allocated memories, easiest way is to have length be `ptr-1`.
  ! we can define `|=` operator as `x |= x -> x*2` which transforms array in-place
    + `y = x | x -> x*2` maps x memory to y
  ? whad does `([]x) -> x | mult` return?
    ? temporary internal representation of mapped x items?
    ? or function itself becomes a macro, so that once applied somewhere else it just "unfolds"?
    -> the semantics is similar to loop, what does `i < 10 <| i * 2` mean? By itself it returns group, but if forwarded into `[]` it populates memory

  6.1 Make global `*[10]a` a memory reference.
  + Generally `*` points to memory
  + It's logically static - doesn't depend on callsite
  + Array here can be replaced with group, denoting init values

  6.2 What difference does it make creating array as `*[3]a = [1,2,3]` vs `[3]a = [1,2,3]` vs `*[1,2,3]`?

  * `*[]` can save into callstack, `[]` can just directly allocate.
  - direct allocation requires disposal which we want to avoid.
    ? wait for structs?

## [x] 1-based index vs 0-based index -> stick to 0-based

  * 1-based
    * See ref https://www.reddit.com/r/ProgrammingLanguages/comments/t86ebp/thoughts_on_1based_indexing/
    - not very conventional
    + `a[1]` is first element (obvious)
    + `1..n` is common math notation
    + `a[-1]` is considered the last element conventionally, like 1st from the end.
      - same matches 0-based
    + `a[2]` as list creation corresponds to length of a
      - we don't create list like that - that's just accessing member
    + `-1..1` range more obviously indicates reverse operation, since `0` has no meaning as index otherwise than that
      ~ `0..-1` is kind of fine too
  * 0-based
    + very conventional
    * From https://www.jsoftware.com/papers/indexorigin.htm there's clearer arguments pro-0:
    + We're born at 0 age, time starts with 0 seconds, year 2000 is 1st year of 2-nd millenium, so index indicates the starting _position_ in a sequence, whereas 1-based index indicates number of an element.
      - but that's still first year, although it goes from 0 to 1
      . so it's a question either we choose offset as index or index as index
    + wraps `a[-1]` organically to last element
    - `x[1024]` creates an array of `1025` items
      + we create array as `[..1024]` or `[0..1024]` - which is 1024 members with exclusive lists, not as member reading

## [x] Allocate memory: `*[size]x = (1,2,3)` vs `[12]x = [1,2,3]` -> use arrays x = [1,2,3]

  1. `*[size]x = (1,2,3)`

  + allows to skip arrays for at least first time
  + enables `x << 2` operator for shifting memory value
    ~ although `x+1` can work ostensibly too
  - adds extra meaning to `*` from _stateful_ to _saved_.
  - there's no easy way to create in-place memory fragment: to pass memory, it needs `*[]x=(1,2,3,4)` which is weird
    ? can we create in-place memory fragment as `[1,2,3,4]`
      . but then we can't create `*[size]x = (1,2,3)` as easily, since just `*[12]x` doesn't allocate anything (it should).

  2. `[12]x = [1,2,3]`

  + more natural convention
  - no way to deallocate, unless we find something like `~x`.
  -> requires some GC mechanism

  3. `x = [1,2,3]`, `(x)->{}`, `*x = [..3s]` - don't introduce memory prefix

  + compatible with language logic: no separate notation for types, including array
  + memory block can be statically analyzed by most of the cases via usage/call semantics
    + eg. `a[1]`, `a.1` etc.
      ~+ we prohibit `i = (1,2,3)` then in favor of `i[0..3] = (1,2,3)`
  + similar to JS
  - external API requires defining array block via function or something, can't just pass region of memory
    ~ seems we're going to need dynamic allocation due to the following factors:
      * external API must define mem length somehow
      * length operator `a[]` should be meaningful dynamically
      * list comprehension, loop or fold can produce any-length lists
      * we're anyways exporting memory under some technical name
    ~ gotta need to implement `free` function as well or even an operator for that. `~x`?
      + reminds of markdown's ~~x~~.
      + that's syntax for C++ destructors
      + binary ops applied to arrays obtain new meaning -that's nice

  4. Via stdlib fully, `x = alloc(1,2,3)`,
    - no syntax support
    - no type checking
    - hard to write values

## [x] Compiler: expressions return type -> use side-effects?

  1. expr must return string result;
    + allows nested processing like `(parent.expr (nested.expr))`
  2. modify current fn body, return none
    + allows more flexible write to different targets
  3. modify fn and return last element

## [x] Batch function as a syntax sugar -> nah, simplify functions as much as possible, use `|`, `|>` operators to generate processings

  * We often can find code like `gain = (in,vol) -> (*out=[..in[]];out[0..]=in|x->x*vol;out)`

  1. Instead, we can write single-sample functions as `gain = (in[],vol)->in*vol`
    + that's way more natural syntax for single-sample processing, as it was intended initially
    + it allows natural piping as `[1,2,3] | process`
      - passing params eg. `[1,2,3] | x -> process(x, vol)` breaks batching logic
        ~ or at least requires sort of type inference case and 2 compile clauses
      ? What's the way to produce it for generators? `x -> [()]`?
        ~ kind of meaningful, no? The issue is persisting output array instead of recreating that
          - nah, it will produce an array of one item.
    a. `gain = ([]in, vol) -> in * vol`; `gen = (f) -> [](code)`
    b. `gain = (in[], vol) -> in * vol`; `gen = (f)[] -> code`
    c. `gain = ([in], vol) -> in * vol`; `gen = f -> [code]`
    d. `gain = (|in, vol) -> in * vol; [1,2,3] | gain(vol)`;
      ? do we ever need piped value to be not first argument?
    e. `gain = (x,v)->x*v; [1,2,3] | x -> gain(vol)`, `gen=f->code; ..1024 | gen`
      - if we unroll function code at every pipe usage, our pipes will get huge. Ideally we need functions itself taking iterable parameter, and in simple 1-sample case it's just one.

  2. We can make function code either take single-sample or batch-input, depending on usage clauses
    . so that `gain = (in,vol) -> in * vol` can work as `[1,2,3] | gain` or `[1,2,3] | x -> gain(x,vol)`
    + no pointers mental load
    + same way we handle any-arg ops, making auto-type coercion if needed
    - from external API we can't detect if value is a pointer or a number
      -> we open old pandora box of indicating type of argument, there's just no good way
    - there's no way of passing full array as a pointer `a([1,2,3],1)` - it will convert to batcher

  * We're looking for something like `[1,2,3] | gain(volume) | filter(f:440,gain:-1000)` which returns an array as a result.
    * Therefore `gain`, `filter` functions should expect some hidden or first argument to be not an item but full array
  * We're also looking at gain code looking like `gain = (x, volume) -> x * volume`

## [x] Pipe - should it work more as single-sample processing, or can take whole argument? -> ok, use pipe as iterator, benefits outweight block-processing functions

  1. `[1,2,3] | x -> x` - per sample
  + enriches mapper meaning with iterator
  + makes point as iterator operator in `<|`, `|`, `|>` group
  + expands meaning of `|` for ranges, lists, single values
  + makes memory ops waaay less prevalent and needed
  - inability to pass array to fn directly `gain([1,2,3],x)` - runs multiple times
    . we kind of prohibit passing arrays as fn arguments
      ~ on export we can wrap functions into optional params checks as well as passed-memory checks?
      ? also we can manually write exporter functions, targeted for our particular fx, eg. zzfx.lino
  + produces single-loop code which is good
    - doesn't expose function calls within that loop: fns are still called per-sample
      + Binaryen has inlining, potentially reducing fn calls into inlined code
  + it's just less cognitive load, keeps fn syntax natural

  2. `[1,2,3] | x -> x` - `x` is whole argument
  - makes only limited meaning as glue code
  - less meaning for `|` as iterator operator
  - produced code `arr | x -> a(x) | x -> b(x)` turns into a sequence of internal in-memory arrays and writing/reading ops to glue pipes.
    + that's faster within one processor, eg. `a(x)`
    + that allows single processor take arrays from external API `a([1,2,3])`
      ? can we work that around?
  - harder for optimizers

## [x] How to detect optional params -> comparing `a!=a` is not a biggie

  * If we enforce function arguments always be f64 we can detect it via NaN
    - unnecessarily slows down fn calls
    + allows external default args
    + with f64 vars there's no big problem for one extra check a!=a
  * Optional args must be detected statically in fn callsite for perfect performance
    - makes exported functions require all params

## [x] Precedence hurdle: |, (<|, |>), (=, +=) -> let's make `| ->` a ternary and keep `|` precedence as is

  * it seems loop/fold, assign and BOR must be right-assoc same-precedence operator
  * otherwise there are tradeoffs like `i<|x[i] = 1` or `a=b | c` or `a <| b|c |> d`
  * NOTE: assign has += *= etc, also it's right assoc whereas loops are not.

  * `a | b <| c`
    * `a|b <| c` or `a | b <| c`
  * `a <| b | c`
    * `a<|b | c` or `a <| b | c`: `|` <= `<|`, lassoc
  * `a | b = c`
    ?
  * `a = b | c`
    * `a = b|c`: `|` >= `=`, rassoc
    * `a=b | c`
      - can break existing common binary expressions, but other tradeoff is worse
    * `a=b <| c`, since `|` == `<|`
      + pretty meaningful too
  * `a <| b[i] = c`
    * `a <| b[i]=c` : `=` >= `<|`, rassoc
    * `a<|b[i] = c`
      - left side is meaningless here
  * `a = b <| c`
    ? `a=b <| c`

  * Ideal: `a <| b = c = d | e = f` -> `(a <| (b=c=d)) | (e=f)`
    * `=` > `<|`, `<|` == `=`

  ?! can we make pipe rassoc same level as =, and `<|`, `|>` - lassoc?
    * seems it just needs special token parser
  -> we can reduce problem only to `a=b|c`, so that pipe operator requires explicit `(a=b)|c`,
    but the rest works fine

## [x] how to include `a=b|c` expression? (a=b)|c doesn't make sense. -> ~~let's guess standard | precedence, and expect pipes to be properly wrapped~~ let's make `| ->` a ternary operator and keep `|` precedence

  ? what's heuristic behind this?

  * assignment lhs?
    - can be `a <| b = c | d`

## [x] Arrays: rotate or not rotate? -> rotate via memcpy ops

  * Rotate: `list << 1`, `list >> 2`
    + Allows explicit ring buffers
    + Allows explicit memory buffers
    + If we implement memory buffers somehow else, we still need to store offset, not shift actual memory
    + Offset param is possibly fastest way to implement it
    + It makes use of i32 spot
    - It's slower on access, since it must apply extra memory read / sum operator
    - If we export such array, the memory becomes useless to read
      ? We may not need to care about exact rotation, array can have meaning as a chunk
    - There's no way to read the shifted amount by user
    ? Do we ever need rotating more than just 1 step?
    ? Do we ever need rotating right, rather than left?
    ? Do we ever need non-rotating memory in function body?
    - Rotate can be done as `a = a[1..,0]`
      ~ very costly
    - It can be implemented relatively safely by user, without perf penality and more explicitly
      . `a[offset + 1]; offset++`
      + since we already rotate index access via modwrap
      - prohibits static indexes like `x.0`, `x.1`

    ?! note: we can use `@i++, @p++` directives to indicate that phase is incremented after the fn call

  * Rotate as `/ a = [1..,0];` via memory copy ops
    ? how efficient is that?

## [x] Arrays: neg-index access or no? -> let's try modwrap

  + handy & complacent with slicing
  - suboptimal performance, since enforces (idx % len) operation = reading array length
    - especially tacky to call included `wat/i32.modwrap` function
  - mod is not exactly right: out-of-limit write must not rotate to the beginning
    * the only meaningful range is -len..len, everything else must return null or NaN or alike
  + we kind-of need idx checker function if we're going to implement ring buffer
  + modwrap operator is for that purpose...

## [x] Scope resolution (fns within fns) -> functions have no nested scopes and declared at the top level

  * Would be nice to make all variables local
    + less noise in code, + local.tee available
  * Same time functions need to have nested scopes, so common scope is global
    + allows storing tmp variables in local scope
  * Dynamic anonymous functions may need to have applied scope & access to global
    ~ Ideally we'd need dynamic vars creation, like `global $fnX/varX`
  * Alternatively, we can just inline any functions defined within functions
    - not always possible, like in recursion case, which is main use-case
      ~- maybe possible - via block or loop?

## [x] Make functions `f(x)=x` separate from mappers `f=x->x`? -> yes, let's separate

  + We don't support anonymous functions anyways `x -> y -> z`
    * with `x(a,b) = (a * b)` it's impossible to create anonymous function
  + We make it explicit that mapper is just syntactic sugar for iterator/fold, whereas function is runtime (exportable) construct
  + We solve compiler code inconsistency of passing `name` param to `->` expr.
  + `double(n) = n*2;` is shorter than `double = n -> n*2`
  + it's classic math notation for functions
  + it's compatible with mono
  + limits clamping more meaningfully
  + make more sense returning multiple values rather than mapper
  + mapper doesn't need to look fn-like `list | x,i -> i` (no need for scopes)
  + mapper visually belongs to synax better, than designating it with function meaning
  ?- some conflict/issue with storing functions in a table, eg `osc=[sin:x->x,tri:x->x]`
    * likely can be `osc=[sin(x)=...x,tri(x)=...x]`
  + resolves the issue of scope (above): no need to make all vars global since no scope recursion

## [x] Replace `<|`, `|`, `|>`? -> ~~Let's try `::` for loop/generator and `list -> item ::` for extended loop/tranformer~~ let's use `<|`, `|>` for map/reduce, ~~`#` for member placeholder~~, `x -> x*2` for mapping function

  + Less problems with overloading `|`
  + Fold operator is likely not as useful
  + `|` and `|>` require fake function, which is whole mental concept
  + These things can be solved via single simple loop
  + One loop operator is way less cognitive load, than the plaiade of `<|`, `|`, `|>`, `->`

  ? how to do "in" operator, ie. `item <- list <> operator`? -> `list :: it * 2`
    ? `list -> item <> (item * 2)`
    ? `list -> item :: (item * 2)`
      - that operator `list -> item` has no meaning by itself
    ? `list :: x -> x*2`
      - confusion with function mappers, which is not
      + c-like pattern `list::item -> item*2`, meaning for each item
      * loop as `a < 3 -> a++`
    ? `list -> item :: item * 2`
      + also c-like pattern
      + loop as `a < 3 :: a++`
      + list comprehension thing, reversed
    ? `item -< list :: (item * 2)`
      - wrong meaning to clamp operator
    ? `list ~ item :: (item * 2)`
    ? `item ~ list :: (item * 2)`
      - `lpf(x, freq, Q) = (x ~ xi,i :: x[i] = lpf(xi, freq, Q)).` looks unwieldy, compared to
        `lpf(x, freq, Q) = (x |= x -> lpf(x, freq, Q)).`
    ? `list ~> item :: (item * 2)`
    ? `list :item: (item * 2)`
      - `list : item : (item * 2)`
    ? `list :: (@ * 2)` - special character for item
    ? `list :: (& * 2)`
      + almost like pipe by meaning
    ? `list :: # * 2`
      + it's the shortest possible notation
      * `list :: ^^ # & #`
    ? `list#item :: item * 2`
      + very similar to `@path#item`
      - makes `#` an operator
      - `list # item :: item * 2` is not as obvious
    ? `item @ list :: item * 2`
      ?+ maybe combine with `pi,sin @ 'math'`

  ? what's the operator character? -> `::`
    * `<>`? `(while i<500 i++)` -> `(i < 500 <> i++)`
      + diamond is used in flowchart and condition
      - `<>` associates with not-equal from other languages
    * `::`? `(while i<500 i++)` -> `(i < 500 :: i++)`
      + ruby-like iteration
      + better for list comprehensions (classical-ish)
      + lightweight feeling
      - doesn't associate with producing/mapping, more just iteration
        +? maybe we don't need production meaning as much, since we rarely produce new arrays
          + list comprehension can be non-trivial to implement, since requires dynamic memory allocation and prone to memory overflow errors
      + allows `::=` operator, modifying list in-place, eg. `[1..100] ::= # * 2` or `[1..100] ::= & * 2`
      - it's not really pipe-able `out ::= gen() :: filter(#) :: amplify(#)`
        . with pipe that's `out = out |> gen() |> filter(#) |> amplify(#)`
          - doesn't look nice as self-assign `out |>= gen() |> filter(#) |> amp(#)`
    * `~>`? `(while i<500 i++)` -> `(i < 500 ~> i++)`
      + meaning iteration
      + associates with producing more

  ? how to implement in-place modifier, like `x |= x -> abc` -> `a ::= & * 2`

  ? what's the best character for placeholder?
    * `list :: #*2`
      + `#` is almost perfect for topic/reference, associates with `#`th item
        - needs prohibiting variables starting from # though
          - which is problematic for mono buffers `#tri = [..1s] ::= tri(@ * 2)`
    * `list :: &*2`
      + & is almost-character, feels more like an id
      - has weird connotation as binary
      - makes `list :: ^^&&&` a valid construct, ugh
      - there's too much meaning for `&` character as `&`, `&&` already
    * `list :: @ * 2`
      + relatively safe
      + associates with id / character quite a bit
      + is not overused by other meanings, except for import
      - conflicts with import
    * `list :: ~ * 2`
      + hints at "iteratee"
    * `list :: () * 2`
    * `list :: . * 2`

  ? ALT: `a < 10 |> i++`, `list | item -> item*2`, pipe as `list |= i -> i * 2 | i -> filter(i)`?
    + keeps the notion of "producing"
    + less mental load, `|>` and `| i ->` are similar
    + turns `a | b -> c` into a ternary (that's it)
      - somewhat parsing problem, it's problematic to have `|` of different precedence
    + keeps notion of diamond (flow loops) and vertical bar (pipe)
    + makes nice meaning to pipes `gen() | i -> filter(i) | i -> amp(i)`
    + makes meaning for `|=` as `out |= i -> i`
    + no topic operator problem
    + resolves `|` precedence problem
    ~- `|>` is confusable with pipe - it has little to do with pipe...
      ~+ it acts more as generator producing items (no need for intermediary `i`)
    - overwrite-generating `out = out |> sin(phase) | x -> adsr(x,a,d,s,r) |...` converts into
      `out |>= sin(phase) | x -> adsr()`, which is heavy operator `|>=`
      ~ would be easier to have `out ::= sin(phase)`?
      ~ likely relatively rare
    -~ overloading `|` (although resolvable, is not clean still)
    -? `list |> x` - how do we make difference with this and `a < 10 |> i++`? List is always truthy
      ? should we just make `|>` always for condition as the left part, ie. only `while` loop?
        + that would solve `|>=` operator problem
        - generators would become transforms `out |= _ -> sin()`
    ? should we make `a < 2 -> a++`
      - nah, non-argument meaning for `->` is not nice
    ~- blocks potential space for anonymous functions

  ? ALT: `list -> item :: item*2`, `a < 2 :: a++`, `list -> item ::= item*2 -> item :: filter(item)`
    + combines nicely list comprehension, for..in and while
    + known list comprehension pattern, avoids association with functors / lambdas
    + frees `|`
    ? modify list in place `list ::= item -> item * 2` doesn't make sense
      ?+ `list -> item ::= item * 2`
        ?- but then `list ::= gen()` skips member, generally member picking must be optional-ish operation
      + allows generating naturally as `list ::= a*b`, so that no `item` is needed
    ? pipes `list -> item :: filter(item) -> filteredItem :: gain(item)`
      + always returns a list
      - a bit lengthy and unpredictable
      ? should we prohibit pipes for explicity? `(list -> item :: filter(item)) -> item :: gain(item)`
    - a bit haskelly feeling, somewhat chunky, no pipes :(
    - `list -> item, i ::= item * 2` is not the most meaningful, unlike `list |= item, i -> item * 2`
      + pipes reinforce mention of anonymous functions that we try to avoid
    + `list -> item` and `a < b` are good left-hand part of a loop, indicating that the right part is repeatable
    + `:` has a bit more to do from branching in `?:`
    + No op overloading problems
    + No mention of fake anonymous functions
    + No conflict with `a | >b`
    + Leaves `|>` operator for something meaningful
    - a bit cryptic and non-intuitive things like `[0, .1, ...] -> x :: lpf(x, 108, 5)`, `out ::= oscillator[shape](phase) -> x :: adsr(x, 0, 0, .06, .24) -> x :: curve(x, 1.82);`
    - reminds some crazy wasm spec `blocktype ::= 0x40       => [] -> []`

  ? ALT: `list | & * 2 | filter(&)`, `a < 2 | a++`, `list |= & * 2`
    + the most minimal syntax
    + classical look
    + member picking problem is resolved: it's optional
    - too short syntax for item iterators, it's more about pipe operator
      ~ see below
    - overloading `|` is not very wanted effect
    - having rhs as code is not very wanted effect, it "wants to be" in a function body
    - placeholder doesn't allow `idx` as second variable
    ? can we replace `|` with just a bit more elaborate, eg.
      * `a < 2 |: a++`, `list |: # * 2 |: filter(#)`, `list |:= # * 2`
      * `a < 2 |> a++`, `list |> # * 2 |> filter(#)`, `list |>= # * 2`
      * `a < 2 <| a++`, `list <| # * 2 <| filter(#)`, `list <|= # * 2`

  ? ALT: `list <| # * 2 <| filter(#)`, `a < 2 <| a++`, `list = list <| # * 2`
    + `<|` is graphically meaningful for loop
    + `#` is meaningful for member
      - reserves that keyword, can't simply use in var names, also smells from code perspective
        ~ kind of fine to redefine that for local scope
          - we don't redefine variables in scopes, we only assign values to them
            ~ kind of not the biggest evil
        ~ we can limit `#` to be used in var names as part, never by itself
      ? `.`, has almost same meaning & benefints
        * `list <| . * 2 <| filter(.)`, `a < 2 <| a++`, `list <|= . * 2`
        - will make export as last statement
          + which can be actually good & less noise & compatible with function return, it's unnecessary decorum there
        - conflicts with ranges as `list <| ...1` - is that `.. .1` or `. .. 1`?
    -? `for i, j` - how to refer to parent loop placeholder?
      ? `#`, `##`, `###`?
        + follows `^`, `^^`, `^^^` paren breaking logic
        + matches markdowns
    + keeps spirit of pipes, more meaningfully
    + no mandatory member
    + innovative & hereditary same time
    + very compact
    - problem with mapping `list <|= # * 2` - too heavy for map operator
      + quite nice directional meaning btw, like arrow points that the result is rewritten by-element
      ? do directly as `list = list <| # * 2`
        - it's not obvious that we assign iterator result (group or last member) to initial variable
          ?+ why not obvious? quite obvious
      ? should we consider `list[..] = list <| #` instead?
        + keeps pipe untouched
        + introduce all-range operator (cool!)
        + matches lists reassignment
        + makes iterator meaningful in terms of returning result of pipe
        - not obvious that _last_ pipe member is written back, not _first_
      ? should we encourage `list <| ... <| list[i] = #` as result of pipe
      ? should we just make `#` writable as `list <| # = result`
        + very laconic
        + !clever
        + can modify list on the fly
        + allows short operators as `list <| # *= volume`
        - saving last value in pipe is weird `list <| #*2 <| filter(#) <| #=#`
        - we can iterate via range `0.. <| # = 1` - assignment doesn't make sense here
      ? should we direct pipe somewhere at the end?
        `list <| #*2 <| filter(#) |> list`
    ?- how do we indicate index?
      ? `list <| (*i=0, *prev; >i++, >prev=#;)`
        + !clever!
        - requires stateful varis per-block, not per-function
    - no intuitive way to make reducers `a..b |> #0 + #1` ?

  ? ALT: `(list:x <| x * 2):x <| filter(x)`, `a < 2 <| a++`, `list:x <|= x * 2`
    - doesn't allow nice chaining
    + most compact way to write element of list
    - conflicts with named fn arguments

  ? ALT: `list <> # * 2 <> filter(#)`, `a < 2 <> a++`, `list = list <> # * 2`
    - doesn't have pipy look

  ? ALT: `list |> # * 2 |> filter(#)`, `a < 2 |> a++`, `list = list |> # * 2`
    + natural pipe symbol
    - `a |>= # * 2` is unwieldy

  ? ALT: `list -> x <| x * 2 -> y <| y * 2`, `list -> x <|= x * 2`
    - same cons as `list -> x :: x * 2`
    + allows chains `list->a <| a*2 ->b <| b*2`
      - chains are not easy to read
      - haskely construct
    + allows detecting iteration procedure

  ? ALT: `list <| (x, i) -> x * 2 <| y -> y * 2`
    + very natural reference to mappers
    + allows optimized reducer op as `0..10 |> (cur, sum) -> sum + cur`
    + no namespace pollution
    + allows internal vars as `list <| x -> 0..x |> (y, sum) -> y + sum`
    + familiar chaining
    ?+ `0..10 <| 0` enables just filling with single value, like `[0..100 <| 0]`
    + assignment/map as `list <|= x -> x * 2`
    + indicates item index naturally
    + a bit more neatural break/continue

## [x] `list <| x` vs `a < 1 <| x` - how do we know left side type? -> lhs is always either `.. <| #` or `list <| #`

  * type can be unknown, like `x(arg)=(arg <| ...)`
    ? do we run it until condition holds true?
    ? do we consider argument a list?
  * Figure out condition from op in left part: `a < 2 <| #`
    - what if left condition is dynamic: `item <| item = nextItem()`

  ? `list[..] <| #`
    ~ supposedly creates iteration subbuffer
    - `[1,2,3] <| #` would need to become `[1,2,3][..] <| #`
    - anything on the lhs will be multiplied in pipe expression
  ? `a < 1 ? <| a++`, `list <| #+1`

  * it seems whatever type array arg has as a data, that's not what we intend: we should not waste time on detection

  ? ALT: `#` means iteration, `list <| #+1` is iterator, `list <| 1` is while loop.
    - not explicit enough that `#` somewhere in rhs is iteration

  ? ALT: `list |> # + 1`, `a < 1 <| a++`
    - that's same loop, separating operators is confusing

  ? ALT: `list#item |> item + 1 |> item + 2`
    - pipe is not connectable

  ? ALT: iteration is always via ranges
    * `.. <| # + 1` for infinite loop - break if needed
      + `.. <| # < 3 ? ^^;`
    * `..100 <| #` for limited loop
    * `0.. <| # + 1` another kind of limited loop with nicer id
    ? `..(a ? >< : 0) <| a + 1`
    + refers to `..` in more looping sense!

## [x] How to represent array pointer in code? -> let's try f64

  ? ALT: Use multiple stack values?
    + allows returning arrays as a couple [ptr,length] instead of storing length in memory
    * see https://hacks.mozilla.org/2019/11/multi-value-all-the-wasm/
    + allows creating multiple buffers from same memory part
      + length should not be stored in memory
    - enforces functions taking array arg to convert into taking 2-args (ptr + len), which doesn't convert to js well
      ? how much do we need to have access to raw memory from JS side?
    + the most reliable solution in terms of precision/scalability
    +? allows kind-of detecting array argument. How?
      . easy from callsite, but how externally detect that the arg is array?
        ? prohibit external array args?
          + we don't expose implicit memory to JS: explicit export
          -? how do we do processing then?
            ?+ export global array, write to it, read it?
              ?- do we ensure singleton exportable global memory then?
                - that single memory contains a bunch of internal info: no way to give ptr/length
    ? still not clear - how do we know if arg is an array or f64
      + by-operator, as we do now with ints/floats
    - not clear which fn argument can be an array, even from call signature `a(arr, b, c)`
      -> arg must be only one
  ? with GC types can be solved as `(type $ptr (struct i32 i32)) (func (param (ref $ptr)))`
    - unknown when structs will be supported
  ? ~~ALT: funcref returning ptr and length upon call?~~
    + we anyways read length via operator
    + can store these variables anywhere, not just memory
    ~- not any js fn can be passed
    + csn be stored in separate table
    - requires memory variable to be exported...
      ~ maybe unavoidable if user needs to import memory
    - not sure if we can create infinite functions
  ? ~~ALT: can be fn getter/setter that writes or reads value of the array~~
    - not sure if we can create dynamic functions with local state...
  ? ALT: use `i64` to store both array pointer and length.
    - returns BigInt, which needs to be reinterpreted client-side to get pointer to memory, not obvious how
  ? ALT: use `f64` real/fraction for address/length
    + wider addr/length range, up to `2^52` of int values
      - it may be not as good as `2^25`, consider storing length as `i16` (32756) - not so much, but already 52-16=36 bits for array length...
        ~kind of fine still, we can store fraction as the right part of float, at the very end
      - generally it's precision scaling problem
    + possible to use as ptr directly in JS `new Float64Array(memory, ptr, ptr%1)`
    - value needs to be checked somehow if that's an array = we don't have clear understanding if that's an array or float
      ?+ we can avoid value check if we consider it an array by-operation, so that all array ops are non-overlapping with math. Eg. `a |> b` and `a ?> b`
        + we just enforce lhs `a <| #+1` to be a list
    + to get length: reinterpret f64 as i64; apply length mask 0xffffff; wrap to i32.
    * if we stick to this, essentially it means any number becomes memory pointer
    ~- any number for `<|` operator is treated as memory pointer, which might be undesired effect
      ~- we may expect `3 <| # + 1` to be loop of 3 items
        ~+ it's sort of fine to treat it as `3.0` and just skip looping
      ~ `3.000xxx <| # + 1` means iterate memory at offset 3 for 14 elements
        ?+ kind of useful for logging memory state?
        + kind of reinforces notion of singleton-memory
        + can be useful for sound hackers - iterations of fragments of waveforms (granular synth) etc.
    ~- some dec combinations are impossible, eg. `1.102` turns into `1.10200000000000009059`
      + we need to encode int24 into fractional part as binary, allows up to 99999999 memory address value

  ? ALT: v128
    + throws at times ensuring arrays belong to lino, not outside
    + perfectly holds 2xi64 or something else like eg. shift or memory idx
    - fn arg requires to be indicated somehow via syntax, like `a([]x)`
      ?+ do we need that? operator `|>` can naturally expect v128
        - yes: to define function signature / types, we should know what type of argument is that
    ?- no conversions from/to i32/f64.
      ? Do we need it?
    ? how to interact with arrays from JS side?
    - requires SIMD
    - may be not available in some environments

  ? ALT: track all known array ptrs in a table/memory or just as global vars
    + we can represent them single-var via just id, not actual pointer
    - we can do infinite slices, storing all of them as ids is impossible

## [ ] Prohibit dynamic arrays `a()=(x=[1,2,3])`?

  + ensures static memory: doesn't grow cept comprehension
  -? we can track & dispose them by the end of function call ourselves...
    * if array is returned the ref is lost
  + we can track all arrays, including stateful, static-time
    ?+ callsite is supposedly fully predictive: there's no chance for arbitrary new callsites, is there?
  + we can slice existing memory easily

## [ ] List comprehension: how? -> last memory slot is dynamic, and length is increased every time array gets an item

  * The size of final list is unknown in advance. It requires dynamic-size mem allocation.
  ? Can we detect size in advance somehow?

  1. We can reserve memory slot for dynamic ops and perform various stuff there
  2. Alternatively we can create large-dynamic slot for the time of array init, then dispose unused after init
  3. Just create new array and push members to it, increasing array's length. We suggest there's only one dynamic array at-a-time created, so it's safe to increase length on creating time.
    -> Or better just write length after the array is created, eg. somewhere in dynamic `$alloc` method.

## [ ] Should loops return multiple arguments? How to maintain the heap?

  + allows `fn(list <| # * 2)`
  + allows `[(a,b,c) <| # * 2]`
  - internal lists `list <| (0..# <| 2)` becomes problematic to create in memory

  * ALT: We don't make loops return multiple arguments and just one (last argument)
    + solves issue of dynamic args
    + compatible-ish with JS
    + removes question of dynamic members type
    - list comprehension is unavailable
    - we may possibly need heap for other things besides loops, like `m[2..] = (3,4,5)`

  * ALT: it might be possible to maintain nested multiple results
    * we use heap area to avoid clash with static arrays
      * we cannot merge heap and memory, because if internal dynamic array is finished, it must be put in static memory
      * besides multiple memory proposal allows to fix it nicely
    * when we're generating dynamic args, we save heap start address and len variables
    * when we've finished generating multiple args - we either copy them / send to stack and discard heap
    * we continue previous heap

## [x] Heap strategy: tail or head -> let's use head with compile-time heap size detection: heap is just static array in memory

  * Head: `[ Heap | Static... ]`
    + easier offsets (no need to track beginning of heap)
    - overflow risk: silently rewrites static memory
      - checking boundaries on each write would be expensive
        ~ that's risk only for comprehensions: we can check limits in `range_alloc`, `alloc` or
          + list comprehension can know max input length in advance, except for open ranges like `0..` or `..`
            + we'd anyways do something like that to prevent infinite loops
          ~ so heap size would need to be detected compile-time
        ~? ~~we can flush heap into static memory by parts, no need to wait for overflow~~
          + that allows smaller heap size and no need for customization
            - that makes code generation problematic and verbose (multipart case)
            - internal arrays mess up sequential heap
    - fixed-length heap
      ~+ it's fixed anyways in most of the cases, we can do 48000 something (6-10 pages)
    + no need to maintain heap base offset, since it's always 0
    + no need to displace heap all the time: it seems if we create dynamic array we'd copy heap O(n) times - crazy
    + gives better values for array refs - we can just ignore values `< HEAP_SIZE` in iterators, so that userland floats like 10.000012 don't make any point
    + gives nicer calc for mem.alloc - no need to discount heap - mem pointer can reserve heap as "first static array" lol
    - low locality: once heap increases all array refs are lost
      ~ not sure if that's dangerous
      ~- programs with same memory but different heap don't share array references
    + gets easily fixed once multiple memories hit in
    - allocs heap per audio-node which is too excessive

  * Tail: `[ Static... | Heap... ]`
    + heap overflow throws error automatically
    + no risk of rewriting static memory
    + we allocate static memory in blocks, so heap can be eg. at the beginning of the next page, so we move it only when static memory grows
      - needs memcpy to be called for heap
        + heap is small, so memcpy should be fine
    - heap is still fixed size
      ~+ check can be added to simply grow available heap once heap limit is reached
        ~ that check can happen per-heap alloc, so that we ensure max length per allocation, not total heap size

  * Dynamic head: `[ Heap... | Static... ]`
    - memcpy static once heap grows
      + heap grows rarely, unlike static, since it's more like tetris - once arr is filled it destroys
    - requires hard heap limit anyways to prevent infinities
    - once heap grows all array refs are lost
      - we need to store refs as relative

  ? do we actually need growing memory?
    + limited memory ensures portability
    - we can't limit it to some huge block by default, we need it to be able to grow to some extent
    + max array length is limited by-design to i24, which is 16M of els (f64s), which is 2048 pages of memory
      - so it's an overkill for simple tiny programs to limit to such huge numbers
      + same time it's good point to generally limit memory

  * No heap `[ Static... ]`
    + There's a way to comprehend arrays directly in static memory
      + We just don't init internal arrays immediately but save their location and defer init, when the length is known
        ? `[1, 2..x, [3], f()]` - how do we know location of `[3]`?
          * `a=[1, 2..x, #1, #2]; a[a~<#1] = [3]; a[a~<#2] = f();`
        ? `[0..x <| x -> (!x ? ^; [..x]), y]` - how does that work?
          * `a=[0..x <| (x,i) -> (!x ? ^; #i)]; 0..x <| (x,i) -> (!x ? ^; a[a~<#i]=[..x])`
        ? `[a=2,b=[..a],c=b[..]]` - how?
          * `x=[#1,#2,#2]; x[x~<#1]=a=2; x[x~<#2]=b=[..a]; x[x~<#3]=c=b[..]`
        -? `[0..x <| [..x++]]` how?
    - debugging these is laborous
    - perf tax finding index
      ~+ we don't know memcpy tax from head method
    - we need heap to iterat `(a,b,c) <|` - there's no way to do that via stack (it seems) since loop enforces params

  * Mixed no-heap as much as possible, otherwise heap


## [x] Import into function scope? -> let's use `@math.pi` as direct tokens for now, multiple imports are too heavy for the value

  * `saw() = (@math:pi; pi*2+...)`
  + allows avoiding conflicts
  ~+ seems unavoidable if we introduce with `list:a,b,c` operator
    - we don't;
    - also we don't have array aliases.

## [x] Import JS things? -> yes, import only JS things, WASM has no import mechanisms

  * Must look more like a native object
  + `@math.pi` can be directly mapped as `(import "math" "pi")`
  + allows hiding particular file mechanics, making imports fully JS-thing
    + makes musi, latr and others just wasm libraries for lino, they can be written in any form/language, even JS
    + makes `#` part of var names
    + allows avoiding quotes

## [ ] Should we make memory importable, instead of exportable?

  + naturally enables shared memory
  ? can help with question of naming memory?

## [x] Directly call imported items as `@math.pi`? -> yes

  + so js does.
  + nicely separates namespace
  ~ so to import into a namespace we'd need to `(pi, sin, cos) = @math`
    - not fully compatible with buffers, eg. `(a,b,c) = [c:1,2,3]` takes sequence
    - not compatible with the way groups work: `(a,b,c) = x` assigns `a=x,b=x,c=x`
    ~ it'd be `(pi,sin,cos) = @math[..]`
      - confusable with lists still
    ? `{pi,sin,cos} = @math[..]`
      + makes sense as sets/enums
      - introduces whole sets concept
    ? `(pi,sin,cos) = @math.*`
      - introduces blobs, meaning is similar to `[..]`
    - it is sort of shadowing, which we don't welcome.
    ? Maybe we should just prohibit destructuring imports? Like, everything is very explicit and self-contained?
      ? destructuring of internals must be also possible: `(ABC, CDE) = @musi.chord`
    ? What if `(pi, sin, cos) <= @math`?
  + makes `@` part of name with special meaning

  ? what if `pi@math`?

  * if we make import as `@math:x,y,z` then `list:first,last` acts as destructuring as well...
    * same as `(x,y,z)=@math.(x,y,z)` or `(first:first, last:last) = list`
    - we already have `list.first`, `list[0]` - making also `list:first` adds to confusion
      ? can we lower precedence of `.` so that `list.a,b,c` returns 3 items?
        - nah, `list.a, b, c` that is
    ~ makes `:` local operator, eg. `(list:first,last; first+last)`, so `(@math:sin,cos; sin(x)+cos(x))`
    ~ narrow version of `with` operator, that takes list of items to expose
    - `lib:a,b,c` has precedence conflict with `fn(a:1,b:2,c:3)` and `[first:a, last:b]`

  ? Should we just keep `(x,y,z)=(@math.x,@math.y,@math.z)`? Can we optimize it?
    * `(x,y,z)=@math[x,y,z]`?
      ? `(a,b,c)=list[0,1,2]`?
    * `(x,y,z)=@math.(x,y,z)`?
      ? `(a,b,c)=list.(0,1,2)`?
    * `(x,y,z)=@math.;`?
      ? `(a,b,c)=list.`?
    * `(x,y,z)=@math[..]`?
    * `(..x,..y,..z)=@math`?
    * `x,y,z @ math`?


## [x] Labels `a:1, b:2` vs imports `a: b,c` -> we need neither of them, but let's raise `,` precedence;

  - ~~`[a:1, b:2]`~~, `fn(a:1, b:2)` and ~~`(a:1, b:2) = x`~~ "hold hostage" the following operators:
    * `list: a,b,c`
      + if we prohibit named lists, this disappears
    * `@mod: a,b,c`
      + if we opt out of named lists, we essentially introduce `:` for only imports
        + we likely don't need `@a:b,c` imports
    * `^ a,b,c`
    * `a,b,c <|`, `a,b,c |>`
    * `a,b,c -> a,b,c`
    * `x ? a,b,c;`
  - we're not able to implement array aliases: arbitrary argument can be an array, some arrays have aliases others not
    , we're not going to make aliases dynamic
  - destructuring `(a:1,b:2)=x` is therefore not needed, since we can't create array aliases
  - function named args therefore reserve a whole unique naming method `a:1, b:2`, which is not supported elsewhere.

  ? What are the alternative ways for named arguments ? Are they so much useful?
    + they increase readability
      - increase code size as well
    - `fn(a,,b,,,c)` - pretty terse and minimalistic way, compatible with arrays, to skip args
    - js doesn't have named arguments
    ~- if we pass args from heap as `x(x:1, 1..10)` then what? is there a conflict?
    - units also help separating args: `osc(3s, 1000hz)`, it would be too verbose to `osc(t:3s, f:1000hz)`
    ? we could do them as group `osc((t:3s), (f:1000hz))`, `adsr((a:1),(d:2),(s:3),(r:4))`
      ~ so `label:` works more as part of block/group as `(name: a,b,c)` rather than individual items.
        + which makes sense in terms of importing `@modul:a,b,c`

## [ ] Is it worthy introducing `:` only for importing members, ie. ->

  1. `@math:sin,cos` vs `sin=@math.sin, cos=@math.cos`
    + we introduce whole operator for exports: `a,b,c.`
    + it's very naturan typographic convention: `these: this, that`.
    ~ alternatively we just do `(sin, cos) = @math`
    - `@math:sin,cos` doesn't allow redefinition of names, it's hardly bound to "with"
    - colon has types association lately
    - it's likely good practice to explicitly indicate `@math.sin` to show that's not native code everywhere
    - JS does `Math.sin`
    + `@math.abs` everywhere makes code quite noisy
    ? Can we reuse `:` for sequences somewhere else?
      * `export: sin, cos;`
      * `(x()+y(), z()+w()): a, b`
      - nah

  2. `@math#sin,cos`
    + allows files as href `@./std.ln#sin,cos`
      - takes access to files
    + decouples `:` from operator, making it more part of "string"

  3. no imports?
    - no library reuse
      ~ can reuse via manual copy-paste
    + self-isolated code
    + no unnecessary file access or bundling
    - imports is part of JS, code may be not known
    + good for embeddable systems since all code is known in advance

## [ ] Importing issue: `@math.pi` vs `@math.sin()` - we have to detect type and fn signature. How?

  1. By usage. `@math.pi * 2` - imports number, `@math.sin()` - imports a function.
    + we apply same logic in ops: `()` treats as fn, `[]` as array and `+` as number
    - `x=@math.pi; y()=(x+1)` - it can be a bit problematic to track status of `x`
    - `y(x)=(x); y(@math.pi);` - it cannot be ambiguous here.

  2. From import object (js side)?
    - we don't have import object on lino compile stage...
    + it would be the most reliable since just function is not enough, we need to know signature

## [x] Should we make dot part of name, eg. `x.1`, `x.2`? -> no, it can be `a . 0`

  - likely no, since we use it in `@math.pi`

## [x] Overdeclaring local variables -> shadowing is not nice anyways

  * `(x=1; (x=2;))` - `x` in both scopes is the same variable, so that we can't declare `x` within nested scope this way.
  * that means there's one global namespace
  * shadowing variables in JS is not nice practice anyways `let x = 0; if () { let x = 1; } `

## [x] Changing variables type `x=1;x=1.0;` -> vars are always f64, operators can cast to int

  * that's problematic via wasm, since it enforces variable type: would be wrong to cast float to int
  ? upgrade type definition to float if it's ever assigned to
  ? declare float alias variable at the moment of finding upgrade
    + allows merging analyser into 1-pass compiler
    + retains precision

## [ ] mix, smoothstep operators -> `-/` and `-/=` for smoothstep

  * `x -< a..b` defines clamping
  * `x -/ a..b` for smoothstep?
    + reminds `_/`
    + compatible with clamping by meaning (one of integral)
      - x is clamped, but here x is mapped
  * `x ~/ a..b`
    + allows `x -/ a..b` for lerp
  * `x ~< a..b`
  * `a..b -> x`
    - looks like function
  * can be done via external lib
  * `x >< a..b` for mix?
  * `x =< a..b` for mix?
    - what's infinity then?
  * `x / a..b` for smoothstep?
  * `x <= a..b`
    - can be used to compare ranges
  * `x =/ a..b` for smoothstep
  * `x </ a..b` for smoothstep
  * `x /< a..b` for smoothstep
  * `x -| a..b` for step?

## [ ] how do we represent infinity?

  * `oo`
  * `~~`
  * `-/-`
  * `<>`
  * `><`
  * `..[-1]`, `..[0]`
    + technically correct

## [x] exclusive / non-inclusive range: how? -> use `0..10` as exclusive (by default), `0..=10` as inclusive (waiting if needed)

  * `0..<10`, `0<..10`
    - `0 > ..10`, `0.. < 10`
  * `min..(max-1)` for ints, `min..(max-.00001)` for floats, so basically no exclusive ranges
    + problem solved
    - width of int range is screwed up
  * exclusive ranges only
    + solves problem of range width:
      * take `1..2`, so `2-1` as floats gives 1 which is correct width, but gives `2` as integers which is wrong
    + initializing array as `[..10]` creates `10` elements this way from `0..9` inclusive
    + inclusivity is a matter of `<=` or `<`
    + no questions with the way `range()`, `clamp()` works
  * generally exclusives in langs are right `0..<10` or `0...10`, not making separate left `0>..10`
  * we can only have `0 .< 10` or `0 .> 10`
    ?- `x <> 0 .< 10` vs `x <> 0..<10`
    + have logic as `==` becomes `!=`, so `..` becomes `.<`
    + more laconic kind of
  * inclusive as `0..=10`, `0..10` is exclusive
    - `=` has wrong association, there must be `<`
    + `Rust` has that
    + open-right range seems to be ubiquotous & mathematically standard
    - clamp is weird: `x <? 0..=10` - very unnatural
      ~ `x <=? 0..10` ?
      ~ or we can keep clamping to normal values `x <? 0..10` and keep range "exclusive" only for range constructor
    + follows the logic of `<` and `<=`
  * inclusive as `0...10`, exclusive as `0..<10`?
    - too lengthy
  * ruby's `0...10`?
    - `0.. .10`
  * `0..+10` for inclusive range, `0..10` for exclusive
    + `+` has no meaning as operator anyways
    - `10..-+10` vs `10..+-10` is weird,vs `10..=-10`


## [x] replace `x -< 0..10` with `x =< 0..10`? -> clamp is `x <? 0..10`

  ? do we ever need `clamp(x, 0, 10)`, opposed to `x = clamp(x, 0, 10)`?
    + it seems from examples we always `x = clamp(x, 0..10)`
  + it's similar to `-<` but more specific
  + for fn definition `x =< 0..10` is more precise what's going on there (value is clamped to range)
  + `=<` consists of standard understandable characters
    - the order is messed up, the pattern is `-<` + `=`
      ~+ it doesn't necessarily match `+=` or `*=`: we don't modify the value, we completely rewrite/map it
  + it's 2 chars vs 3
  ? how do we indicate clamp or min/max?
    * `x <= ..10`
    ? keep `x -< ..10` ?
  ?+ kind-of enables `=/` for smoothstep?
    ? then `x =/ 0..10` maps x to smooth range, `x -/ 0..10` returns value from smooth range
      * `x = x -/ 0..10`, `x =/ 0..10`
  - seems that's confusable: `a <= b..c` vs `a =< b..c`

## [x] Limited variables `x:0..100; x = 1000;` -> nah, perf-unwise

  + allows static tracking of value
  + compatible with arguments limiting
  - we don't have explicit clamp operator
    ?+ can easily `x > 10 ? 10 : x`
      ? can max be `x >? 10`
  - can be unexpected meaning
  - can slow down calculations, since performs runtime checks on every write

## [ ] Function references: use i32?

  + we can hold both $x global and $x function name
  + i32 can automatically mean function reference
  + allows storing funcs in lists
    - we'd need to use NaNs with non-canonical form as list members

## [ ] Use v128 of i64 for rational numbers?

  + Converts back to f64 on export
  + Gives extreme precision/dimension

## [x] min, max, clamp as `a <? 0..100`?

  * `a |< ..10`, `a >| 10` for
  * can be solved via clamp operator `a <> ..10`, `a <> 10..`
    - adds confusion as `a < >..10`
  * `a >? 10`, `a <? 10`
    + meaningful shortened `a > 10 ? 10 : a`, `a < 10 ? 10 : a`
    ? logically clamp is `a > 10 ? 10 : a < 0 ? 0 : a` -> `a <?> 0..10` or `a >?< 0..10` or `a <>? 0..10`
      * or `a <? 10 >? 0` -> `a <? 0..10` meaning within, or less than
      + `a >? 0..10` means outside, not clear though which side

## [x] Create empty array - how? -> `[..10]` since range is exclusive

  * `[..10]`
    - not clear if that's 10 members from 1 to 10 or 0 to 10 or what
      ~+ with enforced 1-idx convention it doen't make sense to have anything below 1
    - confusing, since range starts with minus-infinity
    + a bit hacky = non-main way to create blank list, ie. values can be heap-y

  * `[1..10 <| 0]`
    + very explicit
    - verbose
    + protects from not-zero values
    - requires initializer

  * `[0..10]` creates empty array instead of raising seq
    - not how range maps to group

  * `[15]x` creates `x` as array
    + gives static indication of var/argument as list.
    - sabotages whole concept of `x = [1,2,3]` as `[]x = (1,2,3)`
      + which can be nice since can replace concept of buffers with just lists
      + this avoids `m = [n[1..3, 5, 6..]]` as `m[] = n[1..3, 4, 6..]`
      - nah, `[1,2,3]` is too nice to avoid
    - introduces new operator
      * (set length? a bit weird/unclear outside of declaration, eg. `[10]x = (1,2,3)`, `x = [10]y, [10]x = [1,2,3];`)
    + returns newly created array, not array property

  ** `x[0..6];`
    + same as just declaring variable, but immediately declares a list
    + removes the whole syntax concept of `[a,b,c]`
    - discards position aliases
      ? can be done as `x[2,-1] = (third:3, last:-1); x.third; x.last;`
      ? alt: `x[third:2, last:-1] = (3,-1); x.last`
        + then `(third, last) = x[..];`
    - `x[2..4]` doesn't make any sense for initializing buffers
      ~+ can just refer to items to prefill, eg. `x[5] = 0` or `x[2..3] = 4,5`
    - `x[4]` creates buffer of 5 items
      ? unless we make 1-based indexing
    + if we drop named args/array members we can save `:` operator for later uses
      ?! can be used for clamp or var range indication? like type definition but more meaningful
    + solves issue of table of funcs definition: `funcs[..] = (a()=(), b()=())`
    - iteration is available as `x <| #` and `x[..] <| #`
      ~+ first case it's list iteration, second case it's group iteration
    - declaring fn argument `gain(out[])` vs `gain(out[1024])` vs `gain(out)` - not clear the difference
      ~ `x(out[])` is meaningless,
      ~? `x(out[3])` creates array of 3 if arg is not provided
        ? alt: it writes argument to 3rd position in `out` local variable
    + reduces the necessity of 0-based indexing since list becomes a bit more hi-level thing
    - inconsistent: expected to return an array reference, but returns value of an array instead
      - so that if we want to return just created array, we'd need to `x[10];x;`
    - creates not very nice condition in code of property access.
    - enforces 1-based index for list elements

## [x] Should we keep immediate list notation? -> yes, let's keep

  + Allows passing memory area directly `gain([1,2,3])`
  + Enables nested lists for tree structures, unlike groups `[1,2,[3,4,[5]]]`
  + Looks more natural

## [ ] Make func args identical with group destructuring?

  * `(a[..10], b=2, c<=4, (d,e)) = (e:12, x[..])`
  * `fn(a[..10])=(); fn(1..10)`
    + factually defines infinite arguments
  * `fn(a,,b,c)=(); fn(a,,b,c)`
    + defines arguments to skip
  + removes questions, merges pattern

## [x] How to create sublist/subarray? -> @latr.sublist or directly math `y+=2;y[]-=2;`

  * `x[] = y[1,2..3]`
    - syntactically creates copy of y
    - writes to x's length, which is weird

  * `x[10]; y = x + 3;`
    + mathematically correct
    + keeps proper offset
    - may need to have special fn to change length, since uses reinterpreting
    - knows about pointers

  * `x[10]; y = @latr.sublist(x, len: 3, start: 2)`

  * `x[..] = y[..]`
    - creates a copy

  * `x = y[..]`
    - takes first item from many

  * `x = [10..]y`
    - weird syntax

  * `x []= 10..`
    ~ kind of valid self-slicing
    - loses reference to initial list
    - means `x = x[10..]` would create reference, not clone

  * `x = [..10]; y = x+3; y[] -= 3;`
    * that's just math trick, not actual operator.
    * that's why we can wrap it into `@latr.subarray(x, start, end)`

## [ ] Range step: how

  * `[0..+10..0.5]`
  * `[0..0.5..+10]`
    - `[20..0.5..+-20]`
  * `[0..10:0.5]`
    - conflicts with
  * `[0..20 <| x -> x*0.5]`
    - very verbose
  * `[0..10 / 0.01]`
    + recommended by gpt

## [ ] Range modifiers: how, when?

  * `0..100 ** 0.01`
    * `a <? 0..100 ** .01` - maps to pow range?
      + reinforces meaning of max operator, which is nice

## [x] Early return: how to consolidate type? -> just enforce f64 for now for early returns

  * we have to consolidate output type with early returns
  * cases:
  a. `(a?^b;c,d);`
  b. `(a?^12;13.4);`
  c. `(a?^12:^13.4;15)`

  1. we can simply upgrade preliminary returns to f64
    + simplest solution
    - enforces all funcs with prelim returns be f64
      ~+ prelim returns belong to userland anyways, it's not demanded internally
    - we can't

## [ ] Iteration: optionally pass prev item, as in reducer? `a <| (x, i, prev) ->`

## [ ] Iteration: allow condition on the left side? `a < b <| ...`

  + enables simple while loops
  + allows prohibiting infinite lhs ranges
  + detectible from input arg type
    * it would need special boolean indicator for ops result. Boolean ops:
  - `1 <| ...` will produce infinite loop

## [x] State variables: How can we call same fn twice with same context? -> context is the same per-scope; to call with other context - wrap into a function; you can pass funcs by reference.

  * It seems for now to be able only externally
  ? but what if we need to say fill an array with signal from synth?

  1. `(a,b,c) <| x->osc(x)` - identifies state fn by callsite (literally location in code) - so `osc` is same state
    + same as tagged literals in js x`abc`
      - tagged literals don't account for callstack, they literally identify location in code
        * `x()=(*i=0); y()=x(); y();y();` - template tags would keep same state of x for different y calls.
          ? can we utilize that fact somehow?
            - not really: `sound()=(gen()); sound(); sound()` - 2 sound instances would share same gen instance, not good
    + logic similar to react hooks
    + solves problem of dynamic infinite linked list, so that we can know state tree in advance
    + we know all callsite ids in advance
    ? how can we iterate, say, 100 separate oscillators? having 100 callsites?
      ~+ kind-of meaningful reflection of underneath complexity
      ~+ musician would anyways manually connect such things, so it kind-of follows manual patching
    - doesn't leverage power of groups to deal with multiple states
      ~ js kind-of doesn't spawn template tags instances either
    ~ every function that has potential of calling internal state function becomes state function
    - not compatible with JS: we may need from JS a way to call same function multiple times with persistent state (expected)

  2. Indicator of static function, eg `*x() = (*i=0;...;i++)`
    + allows JS to use state persistency
    - doesn't solve direct case for JS: it still doesn't persist state

  4. Grops/ranges iterate as separate contexts, and lists as same context?
    `(a,b..c) <| item -> osc(item)` vs `samples <| sample -> osc(item)`
    - doesn't solve the problem of computed ranges: they still need dynamic-size instances
    - we may need to iterate list of frequencies via array...

  5. Parens indicate separate context or not, eg.
    * `(a,b,c)<|item->osc(item)` - same context
    * `(a,b,c)<|item->(osc(item))` - separate context
    * `(a,b,c)<|(item->osc(item))` - separate context
    - very fragile/sensitive: parens should not break the code
      - ie. parens are not "transparent" anymore
    - enforces syntax of stateful functions as
    + kind of meaningful if we define `*` context by `()` scope, not by function body
      + same way it works for declaring within-scope variables `(a;(b=0;))`
  5.1 (following 8.1 and 6.1) - scope defines state
    * `(osc()) + (osc()) + (osc())` - 3 separate oscillators
    * `osc() + osc() + osc()` - 3 calls to same oscillator
    * `(a,b,c)<|x->osc(x)` - same oscillator
    * `(a,b,c)<|(x->osc(x))` - same oscillator
    * `(a,b,c)<|x->(osc(x))` - separate oscillator
    + to export single instance to JS do `sin.`
    + to export separate instance to JS do `sin1()=(sin()); sin2()=(sin())`
    - loop meaning is confusable and unclear
    - makes parens super-sensitive - can't easily remove them

  6. `osc.0()`, `osc.1()` - use dot-operator to identify instances
    ? what about dynamic indexing

  6.1 `osc:0()`, `osc:1()`, `osc:i()`
    - `:` is reserved for labeling
  6.2 `osc#0()`, `osc#1()`, `osc#i()`
    + `#` used as id across many environments
    + `#` used as `member` naturally
    + looks like part of name, same time allows dynamic index
    ? subtle conflict with `list.1` or `list[1]` - what's meaning of `list#1`?
      - it means _first instance_ of `list`, but what's that?
    ? subtle conflict with potential strings `'abc{d}'` vs `osc{2}()`
      ~ `osc{2}` looks like multiple oscillators rather than osc identifier
    - isn't enough for absolute identification - osc can be called with same id somewhere else
    ~- needs resolution of automatic id and manual id, ie. we can't refer automatic ids manually eg `osc();osc#0()` - not the same.

    ~ `a#b` is means of polymorphism, but we resolve variables via scopes `(a=1) + (a=2)` are 2 different `a`'s.
      !? we could do the same for stateful functions: scope defines state

  7. Global functions are stateful, in-scope functions are per-call-context.
    * `sin(f);sin(f);sin(f);` - same state
    * `signal(f)=(sin(f)+sin(f*2)+sin(f*3);)` - separate states
    - code depends on nested level (non-transferable): not consistent
    - mind-wrapping: code behaves in different ways
    ? it seems by default we have to use same-state function, unless separate state is provided?

  8. All functions are single-state by default, unless instancing is provided via `osc#0() + osc#1() + osc#2() + osc#i()`
    + compatible with JS in external fn case
    + obvious separate instances
    + enables same-state and multi-state funcs: `fs |> (f,sum,i) -> sum+=osc#i(f)` vs `fs |> (f,sum,i) -> sum+=osc(f)`
    - cross-scope instance transparency: `osc(f); sound1(f)=(osc(f)+...); sound2(f)=(osc(f)+...)`
      -> these sounds use same osc instance.
      ? should osc instance depend on current scope?

  8.1 Per-scope-instance: `osc(); sound1(f)=(osc(f)+...); sound2(f)=(osc(f)+...)`
    + no osc id conflict
    ~ separate instances can be only-static as `osc.1(f) + osc.2(f) + osc.3(f)`
      + doesn't reserve `#` syntax
      + can be calculated in advance - no dynamic instances
        ~ likely we can prohibit `arr.1` - only for instances
      - natural expectation is `osc[i](f)` which we don't support
      - `a.b` associates more with "part of the whole", whereas `a#b` just identifies `a` by id
    ? how do we allow dynamic-sized scopes, ie. number of instances can vary?
      * number of instances is hardcoded/known in advance.
    * following 5.1:
      + if user needs a new instance - can wrap into new scope as `oscA()=(sin()+sin()+sin()...), oscB()=(sin()+sin()+sin())`
    + simple
    + easy to grasp: function is standalone instance, new instance is done either via wrapping or via new module instance
    + js-compatible
    + essentially same as 6.1/6.2: `sin1()=sin(); sin2()=sin(); ...` - just create as many funcs as you need with own names
    + parens don't affect scope anyhow
    - there's a chance of confusion when we may want a function have access to same context as root `sin();x()=(sin());`
      ? how to get access to root context? or just generally same fn context from another fn?
        ~ likely we can make functions strong singletons - whenever it's called from it gets same context
          ? same time how to create new instance then?
            !? `x()=(sin(x))` calls root instance, `*y()=(sin(x))` creates new instance?
              ? how to make mixed new and old instances then, eg. `y()=(*sin(a)+sin(b))`?
                !? pass fn as arg: `x(sin1)=(sin()+sin1())` - keeps state of parent fn
                  + we can pass fn refs as floats as well - it seems trivial to store all funcs in a table
                    + that allows calling directly or indirectly

## [ ] State variables logic - how to map callsite to memory address? -> see 4.1 - via array argument

  ```
  sin(f, (; scope-id ;)) = (*phase=0;>phase+=f;...);
  note(f, (; parent ;)) = sin(f, (; parent,1 ;)) + (xxx ? sin(f*2, (; parent,2 ;))) + sin(f*3);
  chord(fs, (; parent ;)) = (fs) |> (f, sum, i) -> sum += note(f, (; parent,i ;)); ;; sum all freqs in a chord
  ;; likely will be this, to indicate separate callsites
  ;; chord(fs) = note(fs[0]) + note(fs[1]) + note(fs[2]) + note(fs[3]);
  ;; or this
  ;; chord(fs) = fs |> (f,sum,i) -> sum += note#i(f)
  samples |> (x,i) -> i<1000?chord(A,(;1;)) + i>1000?chord(B,(;2;)) + i>2000?chord(c,(;3;))
  ```

  * From the example - context is defined by # in current (function?) scope (like react hooks).
  * Unlike hooks, the id is defined by the # within function, not by call order.
  * Function scope prefixes the id

  1. For each stateful fn we create a global - current memory pointer;
    * upon calling the function, we set current pointer to proper address
    * outer calls should know all required memory for internal calls, since internal ptrs have offset within outer ptr

    ```
    sin.ptr, sin(f) = (phase=memory[sin.ptr];>phase+=f;...);
    note.ptr, note(f) = (sin.ptr=note.ptr; sin(f); sin.ptr+=sizeOf(sin)) + (sin(f*2)) ;
    chord.ptr, chord(fs) = (
      note.ptr = chord.ptr;
      fs |> (f, sum, i) -> (sum += note(f); note.ptr += sizeOf(note););
    )
    chord.ptr = 0 \or something like 0\;
    chord(A), chord.ptr += sizeOf(chord), chord(B), chord.ptr += sizeOf(chord), chord(C);
    ```
    * we know static size of a function state in advance, so we can just wrap calls to increase memory pointer to known size
      * so essentially we precalculate memory and "store" offsets as code constants
    - doesn't allow dynamic-size allocations
      ? can we store relative offsets, so that we don't need to know absolute addresses?
    + allows pre-allocating required memory for even gated stateful calls like `a ? note(a);`, meaning counting memory is done absolutely

  2. Count offsets from first fn to run
    ```
    sin(f, addr=mem) = (sin.count=0;*phase=(sin.count++;mem[addr]||0);>phase+=f;...);

    note(f, addr=mem) = (
      note.count=0
      sin(f, addr+note.count);(note.count+=sin.count) +
      (xxx ? sin(f*2, addr+note.count);(note.count+=sin.count)) +
      sin(f*3, addr+note.count);(note.count+=sin.count)
    );

    chord(fs, addr=mem) = (
      chord.count = 0
      fs |> (f, sum, i) -> (sum += note(f, addr+chord.count);chord.count+=note.count;);
    );

    root.count = 0;
    if (!addr) addr = mem
    chord(A,addr+root.count);root.count+=chord.count,
    chord(B,addr+root.count);root.count+=chord.count,
    chord(C,addr+root.count);root.count+=chord.count;
    ```
    - no address persistency: note can produce either 2 or 3 values
      ~ unless we unwrap all internal calls
        - order of calls still can be messed up, considering we can do loop: in other words we don't know order in advance
    * we don't know exact address offsets until we run the function, which can be gated. The only thing we know is call id.

  3. Local variable for callsites, eg `chord.123423` - once called they obtain the address.
    * similar to 1., but variables obtain the callsite address ptr dynamically, not hardcode
    ```
    sin.adr
    sin(f) = (*phase=0;>phase+=f;...);
    ;; this "table" stores all callsite instances addresses
    ;; would be meaningful to put into memory
    chord1.note1.sin1, chord1.note1.sin2, chord1.note1.sin3
    chord2.note1.sin1, chord2.note1.sin2, chord2.note1.sin3
    chord3.note1.sin1, chord3.note1.sin2, chord3.note1.sin3
    note.adr
    note(f) =
      (sin.adr=sin.1||=$mem;sin(f)) +
      (xxx ? (sin.adr=sin.2||=$mem;sin(f*2))) +
      (sin.adr=sin.3||=$mem;sin(f*3));
    chord.adr
    chord(fs) = fs |> (f, sum, i) -> sum += (note.adr=note.1||=$mem;note(f)); ;; sum all freqs in a chord
    chord1, chord2, chord3
    chord.adr=chord.1||=$mem;chord(A),
    chord.adr=chord.2||=$mem;chord(B),
    chord.adr=chord.3||=$mem;chord(C);
    ```
    - see chord function - it can receive any-length argument, but we can't create any-length number of variables
      -> callsite pointers must be stored in a table or linked list

  4. memory region for instances with static pointers
    + allows compactness - storing only addresses of data, since we know sequence of hooks in advance
    + allows dynamic allocation of new stateful functions
    + allows lazy-init of memory regions
    + allows storing absolute address value directly in code
    ```
    sin.adr
    sin(f) = (*phase=mem[adr]||(mem[adr]=alloc(1);...init);>>phase+=f;...;mem[adr]=phase;);
    note.adr
    note(f) = (
      (adr=mem[0x00];sin(f)) +
      (xxx?(adr=mem[0x01];sin(f*2))) +
      (adr=mem[0x02];sin(f*3))
    )
    chord(fs) = fs |> (f,sum,i) -> sum += (note(f));
    chord(A);
    chord(B);
    chord(C);
    ```
    - external variables is not flexible enough: we cannot dynamically spawn variables.
      * it's better to pass state as last argument, an array of arrays

  4.1 last argument is array of addresses for fn state
    + allows dynamic passing state to fn
    ```
    sin(f,st=[cur:1,..1]) = (*phase=mem[st[st.cur]||(mem[st[st.cur]]=[1])];st.cur++;...;mem[st[0]]=phase);
    note(f,st=[cur:1,..1]) = (sin(f,st) + (xxx?sin(f*2,st)) + sin(f*3,st); >>st.cur%=st.len);
    chord(fs,st=[cur:1,..1]) = (fx |> (f,sum,i) -> sum += note(f,st); >>st.cur%=st.len);
    chord(a); chord(b); chord(c);
    ```
    - gated params screw offset here - we need absolute offset instead of iterating.
  4.2
    + absolute offsets account for skipped positions
    ```
    sin(f,st=[..1],cur=0) = (*phase=mem[st[cur]||(mem[st[cur]]=1)];cur++;...;mem[st[cur]]=phase);
    note(f,st=[..(sizeof(sin)+sizeof(sin)+sizeof(sin))],cur=0) = (sin(f,st,cur) + (xxx?sin(f*2,st,cur+sizeof(sin)) + sin(f*3,st,cur+sizeof(sin)+sizeof(sin););
    chord(fs,st=[..sizeof(note)],cur=0) = (fs |> (f,sum,i) -> sum += note(f,st,cur+0));
    chord(a); chord(b); chord(c);
    ```

  5. fn scope-based instances entail C-like static variables per-function
    ```
    sin(f)=(*phase=0;...);
    x(f)=(sin(f)+sin(f)+cos(f));
    y(f) = (0..10|>(i,s)->x(i*108)+s + sin(54));

    ;; converts to

    sin.state = [..1];
    sin(f)=(phase=mem[sin.ptr];...;st[sin.ptr]=phase);
    x.state = [..2];
    x(f)=(
      sin.prev=sin.state;sin.state=x.state.sub(0);
      cos.prev=cos.state;cos.state=x.state.sub(1);
      >>sin.state=sin.prev;
      >>cos.state=cos.prev;
      sin(f)+sin(f)+cos(f);
    )
    y.state = [..3];
    y(f)=(
      x.prev=x.state;x.state=y.state.sub(0);
      sin.prev=sin.state;sin.state=y.state.sub(3);
      >>x.state=x.prev;
      >>sin.state=sin.prev;
      0..10|>(i,s)->x(i*108)+s + sin(54)
    );
    ```
    + allows attaching/detaching all states in the beginning/end of parent function
    + doesn't require fake arguments
    + allows tracking function state in a standalone way

## [ ] Prohibit dynamic-size list comprehensions

  + Solves issue of state vars logic: we can precalculate addresses
  + Likely we don't need heap: can be fully static memory
  + There's plenty of places where dynamic lists are not supported anyways: function return, function args
  ~ maybe we need to introduce some meaningful static-only limitations for the beginning and get v1 of lang ready.
    * like array building, static-size map/reduce, state variables etc. once that's ready we may think of extending to dynamic-size ones.
  + we cannot dynamically declare local variables within loop. Static-size loop would make it possible to declare all variables in advance...
    - it would require thousands of local variables...

## [ ] Loop vs fold: no difference

  * `sum=0; xs <| (x) -> (sum += x)`
  * `xs |> (x, sum) -> sum + x`
  * Folds seem to be more efficient than loops: they create single value as result, loop creates multiple values (heap?).
