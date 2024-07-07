import './case/array.js'
import './case/comments.js'
import './case/examples.js'
import './case/export.js'
import './case/functions.js'
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


t.skip('debugs', t => {
  const memory = new WebAssembly.Memory({ initial: 1 });
  const importObject = { x: { y: () => 123, z: 123 } };
  let { instance } = compileWat(``, importObject)
  // console.log(new Uint8Array(instance.exports.memory.buffer))
  // instance.exports.x(instance.exports.x(instance.exports.cb))
})
