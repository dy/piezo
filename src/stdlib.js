export const std = {
  // signed min/max
  "i32.smax": "(func $i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))",
  "i32.dup": "(func $i32.dup (param i32) (result i32) (local.get 0)(local.get 0))",

  // just for reference - easier to just `f64.ne` directly
  "f64.isnan": "(func $f64.isnan (param f64) (result i32) (f64.ne (local.get 0) (local.get 0)))",

  // a %% b, also used to access buffer
  "i32.modwrap": `(func $i32.modwrap (param i32 i32) (result i32) (local $rem i32)\n` +
  `(local.set $rem (i32.rem_s (local.get 0) (local.get 1)))\n` +
  `(if (result i32) (i32.and (local.get $rem) (i32.const 0x80000000))\n` +
    `(then (i32.add (local.get 1) (local.get $rem))) (else (local.get $rem))\n` +
  `))`,

  // increase available memory to N bytes, grow if necessary; returns ptr to allocated block
  "malloc":
  `(func $malloc (param i32) (result i32) (local i32 i32)\n` +
    `(local.set 1 (global.get $__mem))\n` + // beginning of free memory
    `(global.set $__mem (i32.add (global.get $__mem) (local.get 0)))\n` + // move memory pointer
    `(local.set 2 (i32.shl (memory.size) (i32.const 16)) )\n` + // max available memory
    // 2^12 is how many f64 fits into 64Kb memory page
    `(if (i32.ge_u (global.get $__mem) (local.get 2)) (then\n` +
      // grow memory by the amount of pages needed to accomodate full data
      `(memory.grow (i32.add (i32.shr_u (i32.sub (global.get $__mem) (local.get 2))(i32.sub (i32.const 1)) (i32.const 16)) (i32.const 1)) )(drop)\n` +
    `))\n` +
    `(local.get 1)\n` +
  `)`,

  // fill mem area at offset with range values from, to via step param; returns ptr to last address
  "range": `(func $range (param i32 f64 f64 f64) (result i32)\n` +
    `(local.get 0)(local.get 1)(local.get 2)(local.get 3)` +
    `(if (param i32 f64 f64 f64) (result i32) (f64.gt (local.get 2)(local.get 1))` +
      `(then (call $range.asc))(else (call $range.dsc))` +
    `)` +
  `)\n` +
  `(func $range.asc (param i32 f64 f64 f64) (result i32)`  +
    `(loop ` +
      `(if (f64.lt (local.get 1)(local.get 2))` +
        `(then` +
          `(f64.store (local.get 0) (local.get 1))` +
          `(local.set 0 (i32.add (local.get 0) (i32.const 8)))` +
          `(local.set 1 (f64.add (local.get 1) (local.get 3)))` +
          `(br 1)` +
        `)` +
      `)` +
    `)` +
    `(local.get 0)` +
  `)\n` +
  `(func $range.dsc (param i32 f64 f64 f64) (result i32)`  +
    `(loop ` +
      `(if (f64.gt (local.get 1)(local.get 2))` +
        `(then` +
          `(f64.store (local.get 0) (local.get 1))` +
          `(local.set 0 (i32.add (local.get 0) (i32.const 8)))` +
          `(local.set 1 (f64.sub (local.get 1) (local.get 3)))` +
          `(br 1)` +
        `)` +
      `)` +
    `)` +
    `(local.get 0)` +
  `)`,

  // create reference to memory address (in bytes) & length (# of f64 items)
  "ref":
  `(func $ref (param i32 i32) (result f64)\n` +
    `(f64.reinterpret_i64 (i64.or\n` +
      // buffer address is int part of f64, safe up to i32 ints
      `(i64.reinterpret_f64 (f64.convert_i32_u (local.get 0)))\n` +
      // buffer length is last 24 bits of f64 - it doesn't affect address i32 part
      `(i64.extend_i32_u (i32.and (i32.const 0x00ffffff) (local.get 1)))` +
    `))\n` +
  `(return))`,

  // get address/length from reference
  "deref":
  `(func $deref (param f64) (result i32 i32) (call $ref.addr (local.get 0)) (call $ref.len (local.get 0)) (return))`,

  // reads buffer address from pointer (likely not needed to use since can be just converted float to int)
  "ref.addr": `(func $ref.addr (param f64) (result i32) (i32.trunc_f64_u (local.get 0)) (return))`,

  // reads buffer length as last 24 bits of f64 number
  "ref.len": `(func $ref.len (param f64) (result i32) (i32.wrap_i64 (i64.and (i64.const 0x0000000000ffffff) (i64.reinterpret_f64 (local.get 0)))))`,

  // takes required size, allocates memory and returns adr
  "buf.new": `(func $buf.new (param i32) (result i32) (local i32) \n` +
    `(local.set 1 (call $__mem.alloc (i32.shl (local.get 0) (i32.const 3))))\n` + // get allocated fragment ptr
    `(local.get 1)\n` + // return adr
  `(return))`,

  // buf.set(buf, pos, val): writes $val into buffer, $idx is position in buffer, not address. Returns buffer
  "buf.set": `(func $buf.set (param f64 i32 f64) (result f64)\n` +
    // wrap negative idx: if idx < 0 idx = idx %% buf[]
    `(if (i32.lt_s (local.get 1) (i32.const 0)) (then (local.set 1 (call $i32.modwrap (local.get 1) (call $ref.len (local.get 0))))))\n` +
    `(f64.store (i32.add (i32.trunc_f64_u (local.get 0)) (i32.shl (local.get 1) (i32.const 3))) (local.get 2))\n` +
    `(local.get 0)\n` +
  `(return))\n` +
  // same as buf.set, but returns assigned value
  `(func $buf.tee (param f64 i32 f64) (result f64) (call $buf.set (local.get 0)(local.get 1)(local.get 2))(drop) (return (local.get 2)))`,

  // buf.get(buf, pos): reads value at position from buffer
  "buf.get": `(func $buf.get (param f64 i32)\n` +
  // wrap negative idx
  `(if (i32.lt_s (local.get 1) (i32.const 0)) (then (local.set 1 (call $i32.modwrap (local.get 1) (call $ref.len (local.get 0))))))\n` +
  // TODO: check if index is out of boundaries
  `(f64.load (i32.add (i32.trunc_f64_u (local.get 0)) (i32.shl (local.get 1) (i32.const 3))))\n` +
  `)`,

  math: `(global pi f64 (f64.const 3.141592653589793))`
}


export default std