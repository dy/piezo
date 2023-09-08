#!/usr/bin/env node

import arg from "arg";
import { readFile, writeFile } from "fs/promises";
import { compile } from "./index.js";
import Wabt from './lib/wabt.js'

const argv = arg({
  '--output': String,
  '--text': Boolean,
  '-o': '--output',
  '-t': '--text'
});

const help =
  `
Usage: mell <source> -o <destination>

Description:
  Compiles mell source file to wasm binary output.

Repository:
  https://github.com/audio-lab/mell

Options:
  --output, -o    Output file path
  --text, -t      [TODO] Output WASM text instead of binary

Example:
  mell input.s -o output.wasm
`

const path = argv._?.[0], outpath = argv['--output']

if (!path || !outpath) {
  console.log(help);
  process.exit(1); // 1 indicates an error occurred, any non-zero value can be used
}

const code = await readFile(path, 'utf8');

const wabt = await Wabt();
const wasmCode = compile(code);

const wasmModule = wabt.parseWat('inline', wasmCode, {
  // simd: true,
  // reference_types: true,
  // gc: true,
  bulk_memory: true,
  // function_references: true
})

const binary = wasmModule.toBinary({
  log: true,
  canonicalize_lebs: true,
  relocatable: false,
  write_debug_names: false,
})

writeFile(outpath, binary.buffer)

