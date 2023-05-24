# plan

* [x] make subscript generate lispy tree (wasm, wat, js, ast targets are possible)
  . we need not immediately compile, we need intermediary state to codegenerate after.
  . parsing time can be improved via wasm version;
  * [x] ~~make subscript generate wasm binary for evaluator.~~ nah, later
    * Example: https://crypto.stanford.edu/~blynn/asm/wasm.html

* [x] Watr
  * [x] compiler
  * [x] parser: very basic commands, no legacy
  * [x] Compare vs wabt, wat-compiler
  * [ ] Repl with compiler selector

* [x] Parser

* [x] Add proper scope mechanism (streamline compiler)
* [ ] case-insensitive
* [ ] Replace `temp` with `wat/fn` includes:
  * [x] `and`/`or` must be implemented via stack, not tmp values nor function
  + helper functions naturally isolate temp scope variables () for storing (no names conflict)
  + [x] swizzling like `pick3(a,b,c,d)` (returns 3 arguments)
  + loop easily returns result
  + standardized non-standard operators
  + we keep analyzer code clean
  + inliner on optimizing stage can take care of everything else
* [ ] merge analyzer into compile
  + the difference between them is unclear, compiler can map expression results
  + compiler follows scopes anyways, easier to merge scope vars if needed
  + we use desc anyways from analyser all the time
  + we don't test analyser anyways, it's not stable
* [ ] implement new loop/pipe `<|`, `|>`
* [ ] implement no-ptr buffer lengths: either i64 or 2 values in stack
* [ ] refactor `pick(N,arg)` into `dup(arg,3)`
* [ ] more complex group conditionals: `a,b,c || d,e`
* [ ] implement scopes as either tmp functions or blocks
* [x] Implement storing buffer items
* [ ] Test nested scopes variables
* [ ] Test optional arguments
* [ ] Implement memory alloc fn
* [x] Simple loops
* [ ] Audio gain example
* [ ] Sine gen example
* [ ] All lang reference cases
* [ ] Nice errors: line number to AST nodes?
* [ ] Stub all wrong syntax error cases, like `++a=123;` etc - any operators on the lhs of `=` etc., all permutations
* [ ] math: sin, cos, pow, mod etc - from mono https://github.com/stagas/mono
* [ ] *state (global var per callsite?)

* [ ] Processing modules collection

* [ ] Demo page in style of assembly AI with wavefont marquee player

* [ ] @audio/gain module
  * compiles basic son file to multicased function `gain`
  * [ ] wasm gain node: browser
  * [ ] wasm gain node: node

* [ ] sonr expressions
  * `sin(432 + 10*sin(8)) * adsr(0, 0, .4, 0)`

* [ ] Loudness meter for waveplay


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

