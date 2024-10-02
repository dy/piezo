import Wabt from '../lib/wabt.js'
import watr from 'watr';


// convert wast code to binary
const wabt = await Wabt()
export function compileWat(code, imports = {}) {
  code =
    '(func $i32.log (import "imports" "log") (param i32))\n' +
    '(func $i32.log2 (import "imports" "log") (param i32 i32))\n' +
    '(func $i32.log3 (import "imports" "log") (param i32 i32 i32))\n' +
    '(func $f64.log (import "imports" "log") (param f64))\n' +
    '(func $f64.log2 (import "imports" "log") (param f64 f64))\n' +
    '(func $f64.log3 (import "imports" "log") (param f64 f64 f64))\n' +
    '(func $i64.log (import "imports" "log") (param i64))\n' +
    code

  // WABT compilation
  // const wasmModule = wabt.parseWat('inline', code, {
  //   simd: true,
  //   reference_types: true,
  //   gc: true,
  //   bulk_memory: true
  //   // function_references: true
  // })
  // const { buffer } = wasmModule.toBinary({
  //   log: true,
  //   canonicalize_lebs: true,
  //   relocatable: false,
  //   write_debug_names: false,
  // })
  // wasmModule.destroy()

  // WATR compilation
  const buffer = watr(code)

  const config = {
    imports: {
      ...(imports.imports || {}),
      log(...args) { console.log(...args); },
    },
    ...imports
  }

  // sync instance - limits buffer size to 4kb
  const module = new WebAssembly.Module(buffer)
  return { module, instance: new WebAssembly.Instance(module, config) }

  // async instance
  // return WebAssembly.instantiate(binary.buffer, config)
}
