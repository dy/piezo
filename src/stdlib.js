export const std = {
  // signed min/max
  "i32.smax": "(func $i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))",
  "i32.dup": "(func $i32.dup (param i32) (result i32) (local.get 0)(local.get 0))",

  // just for reference - easier to just `f64.ne x x` directly
  "f64.isnan": "(func $f64.isnan (param f64) (result i32) (f64.ne (local.get 0) (local.get 0)))",

  // a ** b generic case
  // used ref: https://github.com/jdh8/metallic/blob/master/src/math/double/pow.c
  // ref 2: https://chromium.googlesource.com/external/github.com/WebAssembly/musl/+/landing-branch/src/math/pow.c
  // ref 3: https://github.com/vlang/v/blob/master/vlib/math/pow.v
  "f64.pow": `(func $f64.pow (param $x f64) (param $y f64) (result f64)` +
    `(local $sign i64)(local $t0 f64)(local $t1 f64)(local $y0 f64)` +
    // if (y == 0) return 1;
    `(if (f64.eq (local.get $y) (f64.const 0)) (return (f64.const 1)))\n` +
    // if (signbit(x) && rint(y) == y) {
    //     x = -x;
    //     sign = (uint64_t)(rint(y / 2) != y / 2) << 63;
    // }
    `(if (i32.and (f64.lt (local.get $x) (f64.const 0)) (f64.eq (f64.nearest (local.get $y)) (local.get $y)) )
      (then
        (local.set $x (f64.neg (local.get $x)))
        (local.set $sign
          (i64.shl
            (i64.extend_i32_u (f64.ne (f64.nearest (f64.div (local.get $y) (f64.const 2))) (f64.div (local.get $y) (f64.const 2))) )
            (i64.const 63)
          )
        )
      )
    )\n` +
    // (inline) double unsigned_(double x, double y)
    `(block (result f64)` +
    // if (x == 1) return 1;
    `(if (f64.eq (local.get $x) (f64.const 1)) (br 1 (f64.const 1)))` +
    // if (x == 0) return signbit(y) ? HUGE_VAL : 0;
    `(if (f64.eq (local.get $x) (f64.const 0))
      (br 1 (if (result f64) (f64.lt (local.get $y) (f64.const 0)) (then (f64.const +inf)) (else (f64.const 0))) )
    )` +
    // if (isinf(x)) return signbit(y) ? 0 : HUGE_VAL;
    `(if (f64.eq (local.get $x) (f64.const +inf))
      (br 1 (if (result f64) (f64.lt (local.get $y) (f64.const 0)) (then (f64.const 0)) (else (f64.const +inf))))
    )` +
    // if (signbit(x)) return NAN;
    `(if (f64.lt (local.get $x) (f64.const 0)) (br 1 (f64.const nan)))` +
    // if (isinf(y)) return signbit(y) ^ (x < 1) ? 0 : HUGE_VAL;
    `(if (f64.eq (local.get $y) (f64.const inf)) (br 1 (f64.const inf)))` +
    `(if (f64.eq (local.get $y) (f64.const -inf)) (br 1 (f64.const 0)))` +
    // double t0 = log2_(normalize_(reinterpret(int64_t, x)), &t1);
    `(call $f64.pow:norm (i64.reinterpret_f64 (local.get $x)))` +
    // (inline) double log2_(int64_t i, double residue[static 1])
    `(block (param i64) (result f64)` +
    // const double log8e2[] = { 0x1.ec709dc4p-1, -0x1.7f00a2d80faabp-35 };
    // int64_t exponent = (i - 0x3FE6A09E667F3BCD) >> 52;
    // double x = reinterpret(double, i - (exponent << 52)) - 1;
    // double w = truncate_(x + 2, 32);
    // double z = x / (x + 2);
    // double z0 = truncate_(z, 27);
    // double z1 = (x - z0 * w - z0 * (2 - w + x)) / (x + 2);
    // double h = z0 * z0;
    // double r = log_kernel_(z) + z1 * (z0 + z);
    // double t = truncate_(h + r + 3, 26);
    // double a = z0 * t;
    // double b = z1 * t + z * (3 - t + h + r);
    // double s = truncate_(a + b, 32);
    // double u = s * log8e2[0];
    // double v = s * log8e2[1] + (a - s + b) * (log8e2[0] + log8e2[1]);
    // double y = truncate_(u + v + exponent, 21);
    // *residue = exponent - y + u + v;
    // return y
    `(drop)(f64.const 0)` +
    `)` +
    `(local.set $t0)` +
    // double y0 = truncate_(y, 32);
    `(local.set $y0 (call $f64.pow:trunc (local.get $y) (i64.const 32)))` +
    // return exp2_(y0 * t0, (y - y0) * t0 + y * t1);
    `(call $f64.pow:exp2
      (f64.mul (local.get $y0) (local.get $t0))
      (f64.add (f64.mul (f64.sub (local.get $y) (local.get $y0)) (local.get $t0)) (f64.mul (local.get $y) (local.get $t1)))
    )` +
    `)\n` +
    // uint64_t magnitude = reinterpret(uint64_t, unsigned_(x, y));
    // return reinterpret(double, magnitude | sign);
    `(return (f64.reinterpret_i64 (i64.or (i64.reinterpret_f64) (local.get $sign))) )` +
    `)\n` +
    // static int64_t normalize_(int64_t i) {
    //     if (i < 0x0010000000000000) {
    //         int64_t shift = __builtin_clzll(i) - 11;
    //         return (i << shift) - (shift << 52);
    //     }
    // return i; }
    `(func $f64.pow:norm (param i64) (result i64) (local i64)
      (if (i64.lt_u (local.get 0) (i64.const 0x0010000000000000))
        (then
          (local.set 1 (i64.sub (i64.clz (local.get 0)) (i64.const 11)))
          (return (i64.sub (i64.shl (local.get 0) (local.get 1)) (i64.shl (local.get 1) (i64.const 52))))
        )
      )
      (local.get 0)
    )\n` +
    // static double truncate_(double x, int bits) {
    // uint64_t i = reinterpret(uint64_t, x) & (uint64_t)-1 << bits;
    // return reinterpret(double, i); }
    `(func $f64.pow:trunc (param f64 i64) (result f64)
      (f64.reinterpret_i64 (i64.and
        (i64.reinterpret_f64 (local.get 0))
        (i64.shl (i64.const -1) (local.get 1))
      ))
    )\n` +
    `(func $f64.pow:exp2 (param f64 f64) (result f64)
      (local.get 0)
    )\n` +
    // static double log_kernel_(double x) {
    //   const double c[] = {
    //       0.60000000000000910393,
    //       0.42857142856356307074,
    //       0.33333333563056661945,
    //       0.27272695496468461223,
    //       0.23079269122036327328,
    //       0.19905203560197025739,
    //       0.19611466759635016238
    //   };
    //   x *= x;
    //   return x * x * ((((((c[6] * x + c[5]) * x + c[4]) * x + c[3]) * x + c[2]) * x + c[1]) * x + c[0]);
    // }
    `(func $f64.pow:log_kernel (param $x f64) (result f64)
    (f64.const 0)
    )`
  ,

  // a %% b, also used to access buffer
  "i32.modwrap": `(func $i32.modwrap (param i32 i32) (result i32) (local $rem i32)\n` +
    `(local.set $rem (i32.rem_s (local.get 0) (local.get 1)))\n` +
    `(if (result i32) (i32.and (local.get $rem) (i32.const 0x80000000))\n` +
    `(then (i32.add (local.get 1) (local.get $rem))) (else (local.get $rem))\n` +
    `))`,

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

  // fill mem area at @offset with range values @from, @to via @step param; returns ptr to address after range
  "range":
    `(func $range (param i32 f64 f64 f64) (result i32)\n` +
    `(local.get 0)(local.get 1)(local.get 2)(local.get 3)\n` +
    `(if (param i32 f64 f64 f64) (result i32) (f64.gt (local.get 2)(local.get 1))\n` +
    `(then (call $range.asc))(else (call $range.dsc))\n` +
    `)` +
    `)\n` +
    `(func $range.asc (param i32 f64 f64 f64) (result i32)` +
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
    `(func $range.dsc (param i32 f64 f64 f64) (result i32)` +
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
    `(return))\n` +

    // same as arr.set, but returns assigned value
    `(func $arr.tee (param f64 i32 f64) (result f64) (call $arr.set (local.get 0)(local.get 1)(local.get 2))(drop) (return (local.get 2)))`,

  // arr.get(ref, pos): reads value at position from array
  "arr.get": `(func $arr.get (param f64 i32) (result f64)\n` +
    // wrap negative idx
    `(if (i32.lt_s (local.get 1) (i32.const 0)) (then (local.set 1 (call $i32.modwrap (local.get 1) (call $arr.len (local.get 0))))))\n` +
    `(f64.load (i32.add (i32.trunc_f64_u (local.get 0)) (i32.shl (local.get 1) (i32.const 3))))\n` +
    `)`,

  math: `(global pi f64 (f64.const 3.141592653589793))`
}


export default std