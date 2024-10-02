import './case/array.js'
import './case/comments.js'
import './case/defer.js'
import './case/examples.js'
import './case/export.js'
import './case/funcs.js'
import './case/groups.js'
import './case/import.js'
import './case/loops.js'
import './case/memory.js'
import './case/operators.js'
import './case/parse.js'
import './case/perf.js'
import './case/ranges.js'
import './case/readme.js'
import './case/scope.js'
import './case/static.js'
import './case/strings.js'
import './case/units.js'
import './case/vars.js'

import t from 'tst'
import { compileWat } from './util.js'


t.skip('debugs', t => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const importObject = { x: { y: () => 123, z: 123 } };
  let { instance } = compileWat(`
  ;; Define a function that returns an i32 by default,
  ;; but may return an f32 early
  (func $test (param i32) (result i32)
    (local f32)    ;; Declare a local variable of type f32
    local.get 0    ;; Get the function parameter (i32)
    i32.const 10   ;; Push 10 onto the stack
    i32.lt_s       ;; Compare param < 10
    if (result i32)
      ;; Early return with an f32 cast to i32
      f32.const 1.5     ;; Push the float value 1.5
      local.set 1       ;; Store it in local f32
      local.get 1       ;; Load the float
      i32.trunc_f32_s   ;; Convert the f32 to an i32 (truncated)
      return
    else
      ;; Return the parameter directly if param >= 10
      local.get 0       ;; Load the input parameter (i32)
    end
  )

  ;; Export the function
  (export "test" (func $test))
`, importObject)
  console.log(instance.exports.test())
  // instance.exports.x(instance.exports.x(instance.exports.cb))
})
