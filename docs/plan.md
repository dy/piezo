# plan

* [x] make subscript generate lispy tree (wasm, wat, js, ast targets are possible)
  . we need not immediately compile, we need intermediary state to codegenerate after.
  . parsing time can be improved via wasm version;
  * [ ] make subscript generate wasm binary for evaluator.

* [ ] @audio/gain module
  * compiles basic son file to multicased function `process, process1, process2, process0`

* [ ] Minimal set:
  * [ ] common expressions
  * [ ] name(a,b,c) = body.
  * [ ] ...state
  * [ ] . end operator

* [ ] compile every trick from basic wasm tutorial

* [ ] implement sonr expressions
  * `sin(432 + 10*sin(8)) * adsr(0, 0, .4, 0)`

* [ ] implement zzfx

* [ ] compile common subscript syntax to wasm

* [ ] wasm gain node: browser

* [ ] wasm gain node: node

* [ ] web-audio-api
