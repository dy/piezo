// test bits of wat
import t, {is} from 'tst'
import Wabt from 'wabt'

const wabt = await Wabt()
const { parseWat } = wabt

function wat(src, ...parts) {
  if (Array.isArray(src)) src = String.raw(src, ...parts)
  const wabtModule = parseWat('', src)
  const bin = wabtModule.toBinary({log:true})
  const module = new WebAssembly.Module(bin.buffer)
  const instance = new WebAssembly.Instance(module)
  return instance
}

t('testy', () => {
  const inst = wat`
  (module
    (global $module/a i32 (i32.add (i32.const 1) (i32.const 1)))
    (memory $0 0)
    (export "default" (global $module/a))
    (export "memory" (memory $0))
  )`
  console.log(inst.exports.default)
})

