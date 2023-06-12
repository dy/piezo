// helpers
export const std = {
  // signed min/max
  "i32.smax": "(func $i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))",

  // just for reference - easier to just `f64.ne` directly
  "f64.isnan": "(func $f64.isnan (param f64) (result i32) (f64.ne (local.get 0) (local.get 0)))",

  // a %% b, also used to access buffer
  "i32.modwrap": `(func $i32.modwrap (param i32 i32) (result i32) (local $rem i32)\n` +
  `(local.set $rem (i32.rem_s (local.get 0) (local.get 1)))\n` +
  `(if (result i32) (i32.and (local.get $rem) (i32.const 0x80000000))\n` +
    `(then (i32.add (local.get 1) (local.get $rem))) (else (local.get $rem))\n` +
  `))`,

  // memory & associated functions
  "mem": `(memory (export "__memory") 1)(global $mem.size (mut i32) (i32.const 0))\n` +
  // increase available memory to N bytes, grow if necessary; return ptr to allocated block
  `(func $mem.alloc (param i32) (result i32) (local i32)\n` +
    `(local.set 1 (global.get $mem.size))\n`+
    `(global.set $mem.size (i32.add (local.get 0) (local.get 1)))\n` +
    // 2^13 is how many f64 fits into 64KiB memory page
    `(if (i32.gt_s (local.get 1) (i32.shl (memory.size) (i32.const 16))) (then (memory.grow (i32.const 1))(drop)))\n` +
    `(local.get 1)\n` +
  `(return))`,

  // create buffer pointer at specific mem address & length (address is in bytes)
  "buf.create":
  `(func $buf.create (param i32 i32) (result f64)\n` +
    `(f64.reinterpret_i64 (i64.or\n` +
      // buffer address is int part of f64, safe up to i32 ints
      `(i64.reinterpret_f64 (f64.convert_i32_u (local.get 0)))\n` +
      // buffer length is last 24 bits of f64 - it doesn't affect address i32 part
      `(i64.extend_i32_u (i32.and (i32.const 0x00ffffff) (local.get 1)))\n` +
    `))\n` +
  `(return))`,

  // reads buffer length as last 24 bits of f64 number
  "buf.len": `(func $buf.len (param f64) (result i32) (i32.wrap_i64 (i64.and (i64.const 0x0000000000ffffff) (i64.reinterpret_f64 (local.get 0)))))`,

  // buf.write(buf, pos, val): writes $val into buffer, $idx is position in buffer, not address.
  "buf.write": `(func $buf.write (param f64 i32 f64) (result f64)\n` +
    // wrap negative idx: if idx < 0 idx = idx %% buf[]
    `(if (i32.lt_s (local.get 1) (i32.const 0)) (then (local.set 1 (call $i32.modwrap (local.get 1) (call $buf.len (local.get 0))))))\n` +
    `(f64.store (i32.add (i32.trunc_f64_u (local.get 0)) (i32.shl (local.get 1) (i32.const 3))) (local.get 2))\n` +
    `(local.get 2)\n` +
  `(return))`,

  // buf.read(buf, pos): reads value at position from buffer
  "buf.read": `(func $buf.read (param f64 i32)\n` +
  // wrap negative idx
  `(if (i32.lt_s (local.get 1) (i32.const 0)) (then (local.set 1 (call $i32.modwrap (local.get 1) (call $buf.len (local.get 0))))))\n` +
  `(f64.load (i32.add (i32.trunc_f64_u (local.get 0)) (i32.shl (local.get 1) (i32.const 3))))\n` +
  `)`,

  math: `(global pi f64 (f64.const 3.141592653589793))`
}


export default std