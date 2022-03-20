let fns

export default (tree) => {
  // reset IR
  fns = {}

  // we have to transform our input tree into wasm-level tree.
  statements(tree)

  function statements([_, ...exprs]) {
    exprs.forEach(node => {
      const [type, sig, body] = node
      console.log(node)
      // collect function definitions
      if (type === '=' && sig[0] === '(') {
        const [_, name, args] = sig
        ;(fns[name] ||= []).push(args)
      }
    })
  }

  console.log(fns)

  // ref: https://ontouchstart.pages.dev/chapter_wasm_binary
  const magic = [0x00, 0x61, 0x73, 0x6d];
  const version = [0x01, 0x00, 0x00, 0x00];
  const types = [
      0x01, // type section
      0x04, // 4 bytes
      0x01, // 1 type
      0x60, // func type
      0x00, // no input
      0x00  // no output
  ];
  const funcs = [
      0x03, // func section
      0x02, // 2 bytes
      0x01, // number of functions
      0x00  // type of the function
  ];
  const codes = [
      0x0a, // code section
      0x04, // 4 bytes
      0x01, // number of function bodies.
      0x02, // 2 bytes
      0x00, // number of local variables
      0x0b  // opcode for end
  ];
  const wasm = new Uint8Array([
    ...magic,
    ...version,
    ...types,
    ...funcs,
    ...codes
  ])

  const module = new WebAssembly.Module(wasm.buffer)

  return {
    binary: wasm,
    module,
    create(importObject) {return new WebAssembly.Instance(module, importObject)}
  }
}
