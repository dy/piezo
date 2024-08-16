export const std = {
  // signed min/max (better be called i32.max_s)
  "i32.smax": "(func $i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))",
  "i32.dup": "(func $i32.dup (param i32) (result i32) (local.get 0)(local.get 0))",

  // just for reference - easier to just `f64.ne x x` directly
  "f64.isnan": "(func $f64.isnan (param f64) (result i32) (f64.ne (local.get 0) (local.get 0)))",

  // a ** b generic case
  // ref: https://github.com/jdh8/metallic/blob/master/src/math/double/pow.c
  "f64.pow": `(func $f64.pow(param f64 f64)(result f64)(local f64 i64 i64 i64 f64 f64 f64 f64 f64 f64)(local.set 2(f64.const 0x1p+0))(block(br_if 0(f64.eq(local.get 1)(f64.const 0x0p+0)))(local.set 3(i64.const 0))(block(br_if 0(i64.gt_s(i64.reinterpret_f64(local.get 0))(i64.const -1)))(br_if 0(f64.ne(f64.nearest(local.get 1))(local.get 1)))(local.set 3(i64.shl(i64.extend_i32_u(f64.ne(f64.nearest(local.tee 2(f64.mul(local.get 1)(f64.const 0x1p-1))))(local.get 2)))(i64.const 63)))(local.set 0(f64.neg(local.get 0))))(local.set 2(f64.const 0x1p+0))(block(br_if 0(f64.eq(local.get 0)(f64.const 0x1p+0)))(block(br_if 0(f64.ne(local.get 0)(f64.const 0x0p+0)))(local.set 2(select(f64.const inf)(f64.const 0x0p+0)(i64.lt_s(i64.reinterpret_f64(local.get 1))(i64.const 0))))(br 1))(block(br_if 0(f64.ne(f64.abs(local.get 0))(f64.const inf)))(local.set 2(select(f64.const 0x0p+0)(f64.const inf)(i64.lt_s(i64.reinterpret_f64(local.get 1))(i64.const 0))))(br 1))(block(br_if 0(i64.ge_s(local.tee 4(i64.reinterpret_f64(local.get 0)))(i64.const 0)))(local.set 2(f64.const nan))(br 1))(block(br_if 0(f64.ne(f64.abs(local.get 1))(f64.const inf)))(local.set 2(select(f64.const inf)(f64.const 0x0p+0)(i32.eq(i32.wrap_i64(i64.shr_u(i64.reinterpret_f64(local.get 1))(i64.const 63)))(f64.lt(local.get 0)(f64.const 0x1p+0)))))(br 1))(block(br_if 0(i64.gt_u(local.get 4)(i64.const 4503599627370495)))(local.set 4(i64.sub(i64.shl(local.get 4)(local.tee 5(i64.add(i64.clz(local.get 4))(i64.const -11))))(i64.shl(local.get 5)(i64.const 52)))))(local.set 2(f64.const inf))(br_if 0(f64.gt(local.tee 1(f64.add(local.tee 10(f64.mul(local.tee 6(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.get 1))(i64.const -4294967296))))(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(f64.add(f64.add(local.tee 7(f64.mul(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(f64.add(local.tee 11(f64.mul(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.tee 9(f64.div(local.tee 7(f64.add(f64.reinterpret_i64(i64.sub(local.get 4)(i64.and(local.tee 5(i64.add(local.get 4)(i64.const -4604544271217802189)))(i64.const -4503599627370496))))(f64.const -0x1p+0)))(local.tee 8(f64.add(local.get 7)(f64.const 0x1p+1))))))(i64.const -134217728))))(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(f64.add(f64.add(local.tee 10(f64.mul(local.get 0)(local.get 0)))(local.tee 8(f64.add(f64.mul(local.tee 7(f64.div(f64.sub(f64.sub(local.get 7)(f64.mul(local.get 0)(local.tee 11(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.get 8))(i64.const -4294967296))))))(f64.mul(local.get 0)(f64.add(local.get 7)(f64.sub(f64.const 0x1p+1)(local.get 11)))))(local.get 8)))(f64.add(local.get 9)(local.get 0)))(f64.mul(f64.mul(local.tee 0(f64.mul(local.get 9)(local.get 9)))(local.get 0))(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(local.get 0)(f64.const 0x1.91a4911cbce5ap-3))(f64.const 0x1.97a897f8e6cap-3))(local.get 0))(f64.const 0x1.d8a9d6a7940bp-3))(local.get 0))(f64.const 0x1.1745bc213e72fp-2))(local.get 0))(f64.const 0x1.5555557cccac1p-2))(local.get 0))(f64.const 0x1.b6db6db6b8d5fp-2))(local.get 0))(f64.const 0x1.3333333333385p-1))))))(f64.const 0x1.8p+1)))(i64.const -67108864))))))(local.tee 9(f64.add(f64.mul(local.get 7)(local.get 0))(f64.mul(local.get 9)(f64.add(local.get 8)(f64.add(local.get 10)(f64.sub(f64.const 0x1.8p+1)(local.get 0)))))))))(i64.const -4294967296))))(f64.const 0x1.ec709dc4p-1)))(local.tee 9(f64.add(f64.mul(local.get 0)(f64.const -0x1.7f00a2d80faabp-35))(f64.mul(f64.add(local.get 9)(f64.sub(local.get 11)(local.get 0)))(f64.const 0x1.ec709dc3a03fdp-1)))))(local.tee 8(f64.convert_i64_s(i64.shr_s(local.get 5)(i64.const 52))))))(i64.const -2097152))))))(local.tee 0(f64.add(f64.mul(f64.sub(local.get 1)(local.get 6))(local.get 0))(f64.mul(f64.add(local.get 9)(f64.add(local.get 7)(f64.sub(local.get 8)(local.get 0))))(local.get 1))))))(f64.const 0x1p+10)))(local.set 9(f64.sub(local.get 1)(local.get 10)))(block(br_if 0(f64.ne(local.get 1)(f64.const 0x1p+10)))(br_if 1(f64.lt(local.get 9)(local.get 0))))(local.set 2(f64.const 0x0p+0))(br_if 0(f64.lt(local.get 1)(f64.const -0x1.0ccp+10)))(block(br_if 0(f64.ne(local.get 1)(f64.const -0x1.0ccp+10)))(br_if 1(f64.gt(local.get 9)(local.get 0))))(local.set 4(i64.reinterpret_f64(f64.add(f64.add(local.tee 8(f64.mul(local.tee 7(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.tee 2(f64.sub(local.get 1)(local.tee 9(f64.nearest(local.get 1))))))(i64.const -4294967296))))(f64.const 0x1.62e42ffp-1)))(f64.add(local.tee 2(f64.add(f64.mul(local.get 2)(f64.const -0x1.718432a1b0e26p-35))(f64.mul(f64.add(local.get 0)(f64.sub(local.get 10)(f64.add(local.get 9)(local.get 7))))(f64.const 0x1.62e42ffp-1))))(f64.div(f64.mul(local.tee 0(f64.add(local.get 8)(local.get 2)))(local.tee 2(f64.sub(local.get 0)(f64.mul(local.tee 2(f64.mul(local.get 0)(local.get 0)))(f64.add(f64.mul(local.get 2)(f64.add(f64.mul(local.get 2)(f64.add(f64.mul(local.get 2)(f64.add(f64.mul(local.get 2)(f64.const 0x1.63f2a09c94b4cp-25))(f64.const -0x1.bbd53273e8fb7p-20)))(f64.const 0x1.1566ab5c2ba0dp-14)))(f64.const -0x1.6c16c16c0ac3cp-9)))(f64.const 0x1.5555555555553p-3))))))(f64.sub(f64.const 0x1p+1)(local.get 2)))))(f64.const 0x1p+0))))(block(block(br_if 0(i32.eqz(f64.lt(f64.abs(local.get 9))(f64.const 0x1p+63))))(local.set 5(i64.trunc_f64_s(local.get 9)))(br 1))(local.set 5(i64.const -9223372036854775808)))(local.set 2(select(f64.mul(f64.reinterpret_i64(i64.add(local.tee 4(i64.add(i64.shl(local.get 5)(i64.const 52))(local.get 4)))(i64.const 4593671619917905920)))(f64.const 0x1p-1020))(f64.reinterpret_i64(local.get 4))(f64.lt(local.get 1)(f64.const -0x1.fep+9)))))(local.set 2(f64.reinterpret_i64(i64.or(local.get 3)(i64.reinterpret_f64(local.get 2))))))(local.get 2))`,

  // a %% b, also used to access buffer
  "i32.modwrap": `(func $i32.modwrap (param i32 i32) (result i32) (local $rem i32)
    (local.set $rem (i32.rem_s (local.get 0) (local.get 1)))
    (if (result i32) (i32.and (local.get $rem) (i32.const 0x80000000))
      (then (i32.add (local.get 1) (local.get $rem)))
      (else (local.get $rem)
    )
  ))`,
  "f64.modwrap": `(func $f64.modwrap (param f64 f64) (result f64) (local $rem f64)
    (local.set $rem (call $f64.rem (local.get 0) (local.get 1)))
    (if (result f64) (f64.lt (local.get $rem) (f64.const 0))
      (then (f64.add (local.get 1) (local.get $rem)))
      (else (local.get $rem))
    )
  )`,
  // divident % divisor => dividend - divisor * floor(dividend / divisor)
  "f64.rem": `(func $f64.rem (param f64 f64) (result f64)
    (f64.sub (local.get 0) (f64.mul (f64.floor (f64.div (local.get 0) (local.get 1))) (local.get 1)))
  )`,

  // increase available memory to N bytes, grow if necessary; returns ptr to allocated block
  "malloc": `(func $malloc (param i32) (result i32) (local i32 i32)\n` +
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

  // fill mem area at $offset with range values $from, $to via $step param; returns ptr to address after range
  "range": `
    (func $range.dsc (param i32 f64 f64 f64) (result i32)
      (loop
        (if (f64.gt (local.get 1)(local.get 2))
        (then
          (f64.store (local.get 0) (local.get 1))
          (local.set 0 (i32.add (local.get 0) (i32.const 8)))
          (local.set 1 (f64.sub (local.get 1) (local.get 3)))
          (br 1)
          )
        )
      )
      (local.get 0)
    )`,

  // create reference to mem address (in bytes) with length (# of f64 items) - doesn't allocate memory, just creates ref
  "arr.ref":
    `(func $arr.ref (param i32 i32) (result f64)\n` +
    `(f64.reinterpret_i64 (i64.or\n` +
    // array address is int part of f64, safe up to i32 ints
    `(i64.reinterpret_f64 (f64.convert_i32_u (local.get 0)))\n` +
    // array length is last 24 bits of f64 - it doesn't affect address i32 part
    `(i64.extend_i32_u (i32.and (i32.const 0x00ffffff) (local.get 1)))` +
    `))\n` +
    `(return))`,

  // reads array address from ref (likely not needed to use since can be just converted float to int)
  // address is float number truncated to int
  "arr.adr": `(func $arr.adr (param f64) (result i32) (i32.trunc_f64_u (local.get 0)) (return))`,

  // reads array length as last 24 bits of f64 number
  "arr.len": `(func $arr.len (param f64) (result i32) (i32.wrap_i64 (i64.and (i64.const 0x0000000000ffffff) (i64.reinterpret_f64 (local.get 0)))))`,

  // arr.set(ref, pos, val): writes $val into array, $idx is position in array (not mem address). Returns array ref (for chaining).
  // FIXME: throw if setting value < length
  "arr.set": `(func $arr.set (param f64 i32 f64) (result f64)\n` +
    // wrap negative idx: if idx < 0 idx = idx %% ref[]
    `(if (i32.lt_s (local.get 1) (i32.const 0)) (then (local.set 1 (call $i32.modwrap (local.get 1) (call $arr.len (local.get 0))))))\n` +
    `(f64.store (i32.add (i32.trunc_f64_u (local.get 0)) (i32.shl (local.get 1) (i32.const 3))) (local.get 2))\n` +
    `(local.get 0)\n` +
    `(return))\n`,

  // same as arr.set, but returns assigned value
  "arr.tee": `(func $arr.tee (param f64 i32 f64) (result f64) (call $arr.set (local.get 0)(local.get 1)(local.get 2))(drop) (return (local.get 2)))`,

  // arr.get(ref, pos): reads value at position from array
  "arr.get": `(func $arr.get (param f64 i32) (result f64)\n` +
    // wrap negative idx
    `(if (i32.lt_s (local.get 1) (i32.const 0)) (then (local.set 1 (call $i32.modwrap (local.get 1) (call $arr.len (local.get 0))))))\n` +
    `(f64.load (i32.add (i32.trunc_f64_u (local.get 0)) (i32.shl (local.get 1) (i32.const 3))))\n` +
    `)`,

  math: `(global pi f64 (f64.const 3.141592653589793))`
}


export default std
