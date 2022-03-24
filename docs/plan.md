# plan

* [x] make subscript generate lispy tree (wasm, wat, js, ast targets are possible)
  . we need not immediately compile, we need intermediary state to codegenerate after.
  . parsing time can be improved via wasm version;
  * [x] ~~make subscript generate wasm binary for evaluator.~~ nah, later
    * Example: https://crypto.stanford.edu/~blynn/asm/wasm.html

* [ ] Watr
  * [ ] compiler
  * [ ] parser: very basic commands, no legacy
  * [ ] Compare vs wabt, wat-compiler
  * [ ] Repl with compiler selector

* [ ] stdlib
  * cos, sin, pow, mod

* [ ] @audio/gain module
  * compiles basic son file to multicased function `gain`
  * [ ] wasm gain node: browser
  * [ ] wasm gain node: node

* [ ] Minimal set:
  * [ ] common expressions
  * [ ] name(a,b,c) = body.
  * [ ] &state
    * [ ] instances state can be allocated as global variables in advance by stacktrace
  * [ ] . end operator

* [ ] compile every trick from basic wasm tutorial

* [ ] implement sonr expressions
  * `sin(432 + 10*sin(8)) * adsr(0, 0, .4, 0)`

* [ ] implement zzfx

* [ ] web-audio-api

* [ ] [musicdsp](https://github.com/bdejong/musicdsp/tree/master/source)
* [ ] [sndkit](https://github.com/paulbatchelor/sndkit)

* [ ] Compare to alternatives: rust, soul, elementary-audio
