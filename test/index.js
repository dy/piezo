import './case/array.js'
import './case/comments.js'
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
import './case/state.js'
import './case/strings.js'
import './case/units.js'
import './case/vars.js'

import t from 'tst'
import { compileWat } from './util.js'


t.todo('debugs', t => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const importObject = { x: { y: () => 123, z: 123 } };
  let { instance } = compileWat(`
  (memory 1)

  (global $g_v128 (export "x") (mut v128) (v128.const i32x4 0 0 0 0))

  (func $test_v128
    (result v128)

    ;; Define two v128 vectors
    (local $a v128)
    (local $b v128)

    ;; Initialize the vectors
    (local.set $a (v128.const i32x4 1 2 3 4))
    (local.set $b (v128.const i32x4 5 6 7 8))

    ;; Perform addition on the vectors and return the result
    (i32x4.add (local.get $a) (local.get $b))
  )

  ;; Export the function to be called from outside
  (export "test_v128" (func $test_v128))
`, importObject)
  console.log(instance.exports.test_v128())
  // instance.exports.x(instance.exports.x(instance.exports.cb))
})
