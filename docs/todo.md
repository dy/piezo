## Stage 0

* [x] make subscript generate lispy tree (wasm, wat, js, ast targets are possible)
  . we need not immediately compile, we need intermediary state to codegenerate after.
  . parsing time can be improved via wasm version;
  * [x] ~~make subscript generate wasm binary for evaluator.~~ nah, later
    * Example: https://crypto.stanford.edu/~blynn/asm/wasm.html

* [x] Watr
  * [x] compiler
  * [x] parser: very basic commands, no legacy
  * [x] Compare vs wabt, wat-compiler

* [x] Parser

## Stage 1

* [x] Add proper scope mechanism (streamline compiler)
* [ ] case-insensitive
* [x] Replace `temp` with `wat/fn` includes:
  * [x] `and`/`or` must be implemented via stack, not tmp values nor function
  + helper functions naturally isolate temp scope variables () for storing (no names conflict)
  + [x] swizzling like `pick3(a,b,c,d)` (returns 3 arguments)
  + loop easily returns result
  + standardized non-standard operators
  + we keep analyzer code clean
  + inliner on optimizing stage can take care of everything else
* [x] merge analyzer into compile
  + the difference between them is unclear, compiler can map expression results
  + compiler follows scopes anyways, easier to merge scope vars if needed
  + we use desc anyways from analyser all the time
  + we don't test analyser anyways, it's not stable
  + simplifies parent state management
* [x] use f64 everywhere
* [x] implement array pointer as float64
* [x] ~~`x=1; x=1.0` - add float dup~~
* [x] arity of ops, for proper `(drop)` amount, eg. `a ? b;` has 0 items in stack;
* [x] early return detection
  * [ ] break/continue
* [x] Readable generated code
* [x] Per-function vars scope: we don't need parens as scope
* [ ] Change `,` precedence to be under `=` to allow `^a,b,c`, `x?1,2,3:4,5,6`, `a,b<|x,i->x,i`
* [ ] Bench biquad
  * [ ] Clamp args
  * [ ] Imports
  * [x] Units
  * [ ] basic maths
  * [ ] Group operators
  * [ ] Comments
* [ ] static arrays
* [ ] list comprehension
* [ ] static expressions detection
  * [ ] need for units
  * [ ] a+0 -> a
* [ ] static arrays via `data` section
* [ ] loops
* [x] implement no-ptr buffer lengths: either i64 or 2 values in stack
* [x] ~~refactor `pick(N,arg)` into `dup(arg,3)`~~
* [ ] more complex group conditionals: `a,b,c || d,e`, `a,b * c,d`
* [x] implement computed ranges in lists creation
* [x] ~~implement scopes as either tmp functions or blocks~~ -> just resolve variables
* [x] Implement storing buffer items
* [x] Make all `local.set` / `global.set` a `set(name, value)` function: we don't need to know about tmp/define etc.
  * [x] ~~Think if we need to expose fully-js API for building wasm code, similar to wasmati~~ no
* [ ] Test nested scopes variables `(x=0;(y=1);y)`
* [ ] `(a=1,c; (b=2; c=a+b;); c)` test
* [ ] Extend i32 to i64 whereever possible
* [ ] Test optional arguments
* [ ] Test a,,c = d,e,f; a,b,c = d,,f
* [x] Test if memory grows properly
* [x] Simple loops
* [x] Track memory via runtime variable: check against array len/address
* [ ] Dispose references to immediate arrays `[1,2,3]` if not saved anywhere
  * [ ] Can be also disposed once variable is out of reach
    * [ ] Need detection when vars are out of reach
* [ ] All lang reference cases
* [ ] Nice errors: line number to AST nodes?
* [ ] Stub all wrong syntax error cases, like `++a=123;` etc - any operators on the lhs of `=` etc., all permutations
* [ ] math: sin, cos, pow, mod etc - from mono https://github.com/stagas/mono
* [x] *state
  * [x] `*x=[0..10]`
  * [x] `x()=(*i);y()=(x())`
  * [ ] `x()=(*(a,b,c))`
  * [ ] `x(_sin)=(sin() + _sin())`
* [ ] Make `br_if` loops everywhere - it doesn't create control block (more lightweight)
* [ ] Test in-loop variables `xs <| (x) -> (y;x+=y;)`
* [ ] pass fns by reference `x(a,_osc)=(osc(a)+_osc(a))`
* [ ] Readme examples
  * [ ] Audio gain example
  * [ ] Sine gen example

## 2

* [ ] extend internal arrays as separate `addr` and `len` variables: speeds up perf, allows enhanced precision
* [ ] Processing modules collection

* [ ] Demo page in style of assembly AI with wavefont marquee player

* [ ] @audio/gain module
  * compiles basic son file to multicased function `gain`
  * [ ] wasm gain node: browser
  * [ ] wasm gain node: node

* [ ] sonr expressions
  * `sin(432 + 10*sin(8)) * adsr(0, 0, .4, 0)`

* [ ] Loudness meter for waveplay

## 3

* [ ] Repl with compiler selector
* [ ] Web-audio-api
* [ ] musi
* [ ] latr
* [ ] Neural audio effects
* [ ] Essentia

## Test cases

* sonr expressions
* FM, AM signals sin(f + sin(m) * 100), sin(f) * (cos(m) + 1)
* weighted mixing signals sin(a) * .75 + cos(b) * .25
* periodic wave eg. wave(1204) - seed indicates overtone weights
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

