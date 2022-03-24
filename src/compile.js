// convert wat tree to wasm binary
export default (tree) => {
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
