import './case/array.js'
import './case/comments.js'
import './case/defer.js'
import './case/examples.js'
import './case/export.js'
import './case/funcs.js'
import './case/groups.js'
import './case/import.js'
import './case/loops.js'
import './case/number.js'
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


t('debugs', t => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const importObject = { x: { y: () => 123, z: 123 } };
  let { instance } = compileWat(`
  ;; Define a function that returns an i32 by default,
  ;; but may return an f32 early
  (func $test (param $a f64)(result i32)
    (i32.const nan)
  )

  ;; Export the function
  (export "test" (func $test))
`, importObject)
  console.log(instance.exports.test())
  // instance.exports.x(instance.exports.x(instance.exports.cb))
})
