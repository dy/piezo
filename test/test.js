// import fs from 'fs';
// import t, {is} from 'tst'
// import son from '../src/sonscript.js'

// t('basic', () => {
//   // is(
//   //   son('1 + 2').toWAT(),
//   //   `(func (param $p i32)
//   //     (result i32)
//   //     local.get $p
//   //     local.get $p
//   //     i32.add)`
//   // )
// })

// var buffer = fs.readFileSync('./add.wasm');
// const mod = new WebAssembly.Module(buffer)
// const instance = new WebAssembly.Instance(mod)

// console.log(instance.exports.add(1,2)) // => 42

import './parse.js'
