# Language design / issues R&D

## [x] WAT, WASM? All targets

Having wat files is more useful than direct compilation to binary form:

+ wat files are human-readable, so it's possible to debug mistakes and do changes
+ wat files are standard interchangeable format with proven compiler: no need to reimplement compilation and deal with its bugs
+ optimization out of the box
- wat files are still a bit hard
- modifying wat files creates divergence from son files..


## [x] frames as vectors

  * like glsl (data views to underlying block buffer), with [standard channel ids](https://en.wikipedia.org/wiki/Surround_sound#Standard_speaker_channels); swizzles as `a.l, a.r = a.r, a.l; a.fl, a.fr = a.fl`

## [x] `import a,b,c from 'lib'`, `import sin from 'stdlib'` → `# 'stdlib': sin`, `# 'lib': a,b,c;`

  * ? How do we redefine eg. sin from stdlib?
    ? Just reassign to var or give another name? Every fn has unique name?
    → import only subset, like `import sin from 'stdlib'`

  → default is going to need a name to be importable directly

  → We can declare exporting as a separate area, like `export gain, somethingElse, somethingElse`

## [x] `f(x, y) = x + y` standard classic way to define function in math
  + also as in F# or Elixir

## [x] Ranges: f(x=100~0..100, y~0..100, p~0.001..5, shape~(tri,sin,tan)=sin)

  * `f(x=100 in 0..100, y=1 in 0..100, z in 1..100, p in 0.001..5) = ...`
    - conflicts with no-keywords policy

  * ! Swift: non-inclusive range is 0..<100

  * `f(x{0..100} = 100, y{0..100} = 1, z{1..100}, p{0.001..5}, shape{sin,tri,tan}=sin )`
    +  matches set definition
    - missing operator

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
    + `:` is a bit more standard type definition
    - doesn't play well after value.
    + better fits for loops: `i: 0..100 ?.. i*2` vs `i ~ 0..100 ?.. i*2`
      - nah, inverting ?: as :? can lead to hell.

  * `f(x = 100 ~= 0..100, y ~= 0..100 = 1, z ~= 1..100, p ~= 0.001..5, shape ~= (tri, sin, tan) = sin)`
    + matches Ruby's regex-search operator, inversed
    + matches "equals" as "clamp"
    - isn't interchangable with `=`, has different meaning
    → too much `=` noise - not clear associativity; `~` shows better contrast.

  * `f(x = 100 ~ {0..100}, y ~ {0..100} = 1, z ~ {1..100}, p ~ {0.001..5}, shape ~ {tri, sin, tan} = sin)`
    + less digit-y as above
    - a bit redundant
    + allows sets
    - confuses of 0..10 and {0..10}
    + allows joining ranges {0..10, 20..30}
      ~ can be solved as 0..10 + 20..30
    - too curvy

  * `f(x = 100 -< 0..100, y -< 0..100 = 1, z -< 1..100, p -< 0.001..5, shape -< (tri, sin, tan) = sin)`
    + visually precise indication of what's going on
    - false match with reduce operator

  * `f(x = 100 <- 0..100, y <- 0..100 = 1, z <- 1..100, p <- 0.001..5, shape <- (tri, sin, tan) = sin)`
    + literally elixir/haskel/erlang/R/Scala's list comprehension assigner
    + stands in-place for "in" operator
    + similar to -<

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

## [x] !? erlang strings: "hello" === [104,101,108,108,111]

## [x] !? erlang atoms: 'hello' (not string)
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

## [x] Numbers: float64 by default, unless it's statically inferrable as int32, like ++, +-1 etc ops only
  * Boolean operators turn float64 into int64

## [x] Pipes: → let's try basics: lambdas, then pipe overload, then topic reference between expressions

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

  1.1 ✱ What if we get rid of pipe operator and just use "last expression" placeholder?
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

  3.1 ✱ Use topic token 1.1 only as part of pipe expressions but as curried fn constructor as rhs? `a | a->a+1` === `a | ^+1`
    + syntax looks fresh, compact, flowy
    + combines JS's F#/Hack pipes
    + no redundant function calls from 2. (unless we do 4. with constructor/currying meaning)
    + `|` + `^` = `|>`, makes sense
    + reducer operator is as promised, without redundant call: `..combs_a | comb(^, input, room, damp) >- sum`
    ~ Likely there's benefit of limiting topic to pipe only. Generic ^ may have unexpected side-effects.
      + eg. initializer `...a=(x;^+y)` can be `...a=x|^+y` now, since no conflict with semi.

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
    - there's no difference in `a | b(x)` between OR of result and overloaded function
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

## [x] Lambda → (wait for use-case) generalized fn by callsite, spawning creates bound call

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

## [x] Reduce/fold operator: unrols into single expression for groups OR applies reduce/fold for arrays. Acts as convolver also.

  * ? Reduce operator? It can be eg. `:>` (2 become 1), or `=>`.
    * ? `a,b,c :> reducer`, like `signals :> #0 + #1`
      - `:>` looks like expecting some input or something.
    * ? Or maybe `a,b,c ||> a,b -> a + b |...`
    * ? `a,b,c => a,b ->a+b`
    * ? `a,b,c ..> a,b -> a+b`
    → `(a,b,c) >- a,b -> a+b` (crazy!)
  ! >- operator can be statically analyzable if group length is known (it should be known)

## [x] Units: time primitive and short orders is natural: 1h2s, 20k

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

## [ ] Number types: fractions, complex numbers

  + improves precision

## [x] End operator → indicator of return/export statement.

  * `.` operator can finish function body and save state. `delay(x,y) = ...d=[1s], z=0; d[z++]=x; d[z-y].`
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

## [x] Early return?

  * can often see `if (a) return;` - useful construct. How's that in sonl?
  1. `a ? value.`
    * There doesn't seem to be other options.
    → `a ? b.;` expects `;` at the end.
      * skipping ; means node is the last element: `(a;b;c.)`
  2. not supporting that.
    + simpler flow/logic
    + no (b.c;d) case

## [x] Return operator: alternatives → no alternatives, use .

  1. `.`
    + erlang-y
    + very natural
    - early return is weak `a ? b.;`
      - can't suppress semicolon: `a ? b. c + d;`
    - exported global is confusing `sampleRate = 44100.;`
  * `a ? b...;`, `sampleRate = 44100...;`
  * `a ? b!;`, `sampleRate = 44100!;`
  * `a ? b :| c + d`, `sampleRate = 44100:|;`

## [x] State management → function state identified by callsite

  * `...x1, y1, x2, y2`
    + yes, that acts as hooks from react
    + that solves problem of instancing
    + identified by callstack

## [x] Load state syntax → `*` seems to match "save value" pointers intuition

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
    + existing convention
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
    - a bit hard to "find all"
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
  8. Introduce keywords? Not having if (a) b can be too cryptic.

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

  11. ~~`@x1, @x2, @y1, @y2`~~
    + 'at' means current scope, 'at this'
    + more wordy - less operator-y, as if part of id
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

## [x] Named array items → yes, useful and organic replacement for object structs

  * named properties in arrays? `[1,2,3,a:4,b:5]`
    ~ reminds typescript named tuples
    ~ should find exactly where we'd need that
  ? Maybe can be done purely as aliases for position? Let's see for use-case
  + in JS that's frequent good-to-have
  + that would organically introduce pattern of named fn arguments either `gain(volume: 1)`
  + named group items are also useful: `oscillators = (a: x->y, b: x-y)`

## [x] Elvis operator: `a ?: b` instead of jsy `a ?? b`
  * ~ equivalent to a ? #0 : b

## [x] Init operator: too monstrous, no
  - pointless: `a = a && b` is a bit meaningless construct, isn't it, we need `a = a ? a : b`, `a = a ?: b`, or `a ?:= b`

## [x] Short ternary operators as ` a > b ? a = 1;` → use elvis `?:` or direct JS `a && b`
  + it not only eliminates else, but also augments null-path operator `a.b?.c`, which is for no-prop just `a.b?c` case.
  - weirdly confusing, as if very important part is lost. Maybe just introduce elvis `a>b ? a=1` → `a<=b ?: a=1`

## [x] Loops: `i <- 0..10 -< a + i`, `i <- ..list -< a`, `[x <- 1,2,3 -< x*2]`
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
  * Export area solves the issue: `gain()=...; export gain`

## [ ] Arrays: to be or not to be? → for complex / arbitrary-length / nested structures?
  * ? what if we don't deal with arbitrary-length arrays?
    + it guarantees memory limitation, "embeds" into syntax
    + it removes much need in syntax around arrays like map, filer: it can be as `(a,b,c) | map`
    - that can be covered by groups
  → ok, for map use groups `(a,b,c)(fn)` or `a,b,c | i->i**.5`
    . for reduce use `a,b,c >- fn` or `a,b,c >- a,b -> a+b`
    ! that is in fact mixing operator! a,b,c >- mix
    !? we can reduce based on reducer's number of args
  * I think we should overload these operators |, >-
  ?! Groups are flat, small and fixed-size; Arrays are nested and any-length.

## [x] Concat/flat groups → no need to flattening/deep nesting
  * ?is done via range operator a, ..b, c..d, e (shortened spread)

  * ? destructuring is `a,b,c = ..d`
    - nah, just do `(a,b,c) = d`
    ? Alternatively: do we need nested structures at all? Maybe just flat all the time?

## [x] -< operator: useful for loops

  * ? splits list by some sorter: `a,b,c -< v -> v`
  * ? or in fact multiplexor? selects input by condition? like a,b,c -< x -> x > 2 ? 1 : 0
  * ? what if we use it as loop? [ x <- 1,2,3 -< x * 2]
    + matches that arrow madness
  * ? maybe that's just inverse reduce operator. a = sum -< a,b,c

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
  * Besides listed issues, it also reduces use of camelcase convention

## [x] Groups: basic operations

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

  * It seems nested grouping creates more syntax confusion than resolves, like `..combs | a -> comb(a,b,c) >- a,b -> a+b`.
    - not clear if that's supposed to pass a group or a single value.
    . Nested structures better be solved via arrays.
  * Instead, groups can always do flattening, eg. `(a, (b, c), d)` === `(a,b,c,d)` === `a,b,c,d`
    + that would prove them to be just syntax sugar
    + that would make them lightweight like a cloud, without rigid type checking
      * sort of "fluent" type, existing on the time of syntax analyser
    + that would simplify fold / pipe logic, meaning they always get applied to each member `combs | a -> comb(a,b)`
    ? how to pass all group arguments to piping function? (a,b) | (a,b) -> a + b
      ? maybe extending fold operator to account for processor arguments? eg.
        * a,b,c >- a -> a * 2  →  a*2, b*2, c*2
          - nah, following fold logic must return only c*2
        * a,b,c >- a,b -> a+b  →  (a+b) + c
        * a,b,c >- a,b,c -> a+b+c → a+b+c
          - unclear how to shift these args.
          - index comes as third argument usually
        ? it generalizes then as "convolve", where window is defined by number of arguments
          - not really: convolver doesn't fold signal
      ? or - loop operator with function may act as map
        * a,b,c -< a -> a*2
      !? or - we can pass all args depending on args count in pipe transform:
        * `a,b,c | a,b -> a+b` means  `((a,b) | a,b->a+b, (b,c) | a,b->a+b)`
        + yep. seems like a way to go,
        + establishes operator-overloading pattern
        + may act as convolver
      ? do we need index argument for pipe transformer
        - no, pipe is not mapper...
        ? how do we map arrays then
          * list comprehension: i <- arr -< i * 10

## [ ] Convolver operator?

  * Fold operator gives thought to convolver operator which slides window depending on number of arguments,
    samples ^ (a,b,c,d,e) -> a*0.1 + b*0.2 + c*0.4 + d*0.2 + e*0.1 returns all same samples weighted with a formula
    - can be too hard for big kernels
    - debases point of arguments spread: `samples ^ (...kernel) ->` - what's supposed kernel size?
      ~ we not necessarily support args spread
  * Pipe can be used as simple convolver (see above):
    * `a,b,c | a,b -> a+b` means  `((a,b) | a,b->a+b, (b,c) | a,b->a+b)`

## [x] Array slice takes ranges a[1..3], unlike python

## [x] Notes as hi-level aliases for frequencies A4, B1 etc.
  * import 'musi' - imports all these constants
  + allows building chords as (C3, E3, G3) = Cmaj
    ~ would require # to be valid part of identifier

## [x] ? Parts of identifier: $, #, @, _ → don't see why not, doesn't seem we need number references
  + allows private-ish variables
  + allows notes constants
  ~ mb non-standardish

## [x] ? Should it compile to wat or to wasm? → wat for now

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

## [x] Compiler: How do we map various clauses to wat/wasm? → `allocBlock` function, untyped (f64 by default), see audio-gain

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
  3. use csound-like prefixing for identifying params: ifrequency, ainput, gi
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

## [x] Batch function reads from memory; regular function takes arguments. How to differentiate them? → detect batchable function from channeled inputs/outputs.

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
  * gain([..in], amp) = [..in]*amp

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
  - not latr nut std. Latr is generic synthesis

## [x] Array/string length → not abs, but #(a,b,c) or #arr for number of items
  * Ref https://en.wikipedia.org/wiki/Comparison_of_programming_languages_(array)
  * Ref https://en.wikipedia.org/wiki/Cardinality
  * Lua, J langs propose # operator for length
    + Math #S indicates cardinality. (number of something)
    + `#` is `number of` (in Russian №)
    - `#str` in module space means "load module", `#str` in function scope means `length of function`
    - `#str` doesn't work well as "length of string"
    -~ `abs()` allows group inside, making # a unary operator would create `#(a,b,c)` stuff, which has strong intuition as records-ish
      - `#(a,b,c)` doesn't make clear if that's number of items or abs values of all internals (likely the second)
  * Icon, Unicon propose * operator for length
  * ? `melody_string[]`
    ~+ sort of math association
    ~+ sort of #, but not as generic
    ~+ empty array is unused anyways
    - `(a,b,c)[]` is a mess, `#(a,b,c)` is fine.
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

## [x] ASI: semicolons or not? → enforce semicolons.

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

## [x] Flowy operators

  Draft is ready, needs polishing corners and reaching the planned feeling.
  Taking r&d issues and aligning them.

  * There are 4 types available: numbers, functions, booleans, strings. Build around that and reinforce that.

  * <-, ->, >-, -< is group of similar operators, they should build intuition around. "Would be cool if JS had them"
    * |: → :>, <: loop → nah, `-<` is nicer for loop
    * `<-` is in operator
    * `>-` is reducer
    * `->` is lambda

  * Don't extend conditionals, elvis `?:` is enough, the rest is &&, ||

## [x] Make channeled input an array: `gain([left, right], amp)` instead of group destructuring `gain((left, right), amp)`?

  + array better refers to memory send to input, not some internal grouping - so it's a "frame"
  + it allows more clearly indicate output signal, opposed to just grouped value:
   * `phase -> (sin(phase))` === `phase -> sin(phase)` - because group of 1 element is that element;
   * `phase -> [sin(phase)]` - that's output signal.
  - [..ch]. vs [..size] − conflict with array creation.
    - [a] means frame with 1 channel, [a] also means array with 1 item.
    - [..a] means frame with `a` channels, [..a] also means array with `a` items.
    ? prohibit array signature in favor of groups: `(..size)` can define a group as well...
      - nah, groups are just syntax sugar, they don't have serialization or own taste, whereas arrays do.
    ~ if blockSize === 1, block frame becomes identical to array
    - when we return [a,b,c] it implies frame, but we may want non-batch array result, do we?
      ~ worst case it creates redundant block, but the way value is read from it is still array-like frame.
    → ok, let's keep same for now: it seems array===frame is not a crime

## [x] No-keywords? Let's try. i18n is a good call.

  * for(a,b,c) is valid fn; if(a,b) is valid fn;
  + It allows compressing code to no-spaces, which can be nice for serialization to/from string;
  + Natural languages or math equations don't have keywords in punctuation. Imagine if we had to write sentences where some of words were syntactic. It's fine - everyone got used to punctuational conventions and even don't mix up ...a and a..b
  + From ancient times scientists separated meta-meaning (take music staff notation) from actual content by different kind of notation.
  + No-keywords removes English language bias, allowing real i18 code.
  + It frees user from caring about variable name conflict. `in`, `from`, `if`, `for`, `at` can be useful variable bits.
  + JS keywords are ridiculous: they block many good names pushing user use marginal names.
  + keywords play role of comments anyways. It's better to put freeword explanation into comments rather than pollute language.

## [x] Import no-keyword? @ 'math#floor';

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
  * ✱ `sin, cos @ 'math', * @ 'latr'`
    + a,b at source
    +~ reminds npm namespace convention
    + CSS @import, Objective C @import.
    + relatively exceptional character, compared to #, :, &
    - conflicts with npm namespaces `osc1, osc2 @ '@audio-lab/synt'`
      ~ we may not necessarily want to resolve node_modules path, it's going to be either just `synth` or full path.
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

  * importing all or is not nice pattern: that causes implicit conflict.
    * it's better to always assign to a variable to make importable parts explicit.
    - conflicts with notes. We need to import all of them.

### [x] Import subparts → try `@ 'math#floor,cos,sin'`

  1. `@ 'math': sin, cos`
    + defines global functions

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

## [x] Wasmtree instead of IR would be simpler:

  * ['module', ['func', '$name', ['param', 'a', 'b'], ...statements], ['global'], ['exports']]
  + it would allow to just apply a bunch of transforms to inputs, keeping the format
  + it takes less space and less computation
  + it is easier serializable

### [x] sonscript → sontree → Wattree → wasm

  + also allows sontree → jstree, just a set of transforms
  * maybe we may need generalizing transformers


## [x] How to differentiate a-param from k-param argument: gain(input?, kParam) for pipe, but no fn overloading

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
  4. Prohibit overloading functions?
    + removes ambiguity
    + simple solution
    + all pros from 2.
    + solves this issue completely
    + doesn't enforce artificial naming convention
    + argument doesn't drive function clause
    - it complicates `curve(input, param)` and `input | curve(param)` case.
      ~ either we introduce pipe operator `input |> curve(param)`
        + less code (no need to define pipe fns), + less need in arrow functions, + less overloaded operators

## [ ] Compile targets:

  * WASM
  * WAT
    + replaceable with wabt, wat-compiler
    + generates wat file as alternative - gives flexibility
    + easier debugging
  * JS
    + can be useful in debugging
    + can useful in direct (simple) JS processing
    + can be useful for benchmarking
  * Native bytecode
  * others?

## [ ] Live env requirements

  1) compilable in a worker thread
  2) hot swapping code in the worklet as it is playing and reusing memory state from the previous compile. If there's a delay/note/reverb tail playing from the previous compilation, and i compile a change, the new instance should inherit all the memory/buffers from the previous one, not start from zero. I have to be able to make changes without affecting the sound that is playing (too much). It won't be possible for 100% of the cases, but if the compiler can match the previous buffers with the new one then it should reuse them.
  3) parser/compiler errors with line/col/symbol/token information so they can be displayed inline in the editor while the user is typing, so they see what they're doing wrong. They don't need to be extremely descriptive, but at least showing the right symbol position i.e what to draw red.
  4) a way to export certain parameters into UI elements arbitrarily and with minimal effort. Right now in mono i've introduced a . prefix operator in the arguments so f(a, b, c) if i do f(a, .b, c) then i immediately get a knob for 'b' with that simple addition of the . prefix. That helps me a lot as a producer to not have to go elsewhere to define these and to try new things. The '.b' also becomes hoverable and can change with the wheel, but there's also a UI knob and they're associated, when you hover one, both light up. The idea is that once you export the controls like that, you can hide the editor and that can be a standalone effect/instrument with those controls it pulls from the code. You want another thing to tweak? Simply jump into the code and add a . next to the parameter and save. When there will be dozens of instruments and effects in the screen playing you need to be able to quickly do these things so you don't kill the flow. The flow must never be killed. That's the most important feature. You should be dancing all your way through from start to end while making a track without any gap of having to stop and take closer look at code or something isn't playing right or there are audible glitches etc. So first and foremost it is a party tool. You need to be able to party with it or it's worth nothing.
