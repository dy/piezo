import { FLOAT, FUNC } from "./const.js"

// helpers
export const std = {
  // signed min/max
  "i32.smax": "(func $i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))",

  "f64.isnan": "(func $f64.isnan (param f64) (result i32) (f64.ne (local.get 0) (local.get 0)))",

  // a %% b, also used to access buffer
  "i32.modwrap": `(func $i32.modwrap (param i32 i32) (result i32) (local $rem i32)
  (local.set $rem (i32.rem_s (local.get 0) (local.get 1)))
  (if (result i32) (i32.and (local.get $rem) (i32.const 0x80000000))
    (then (i32.add (local.get 1) (local.get $rem)))
    (else (local.get $rem))
  ))`,

  "buf.len": `(func $buf.len (param i32) (result i32) (i32.load (i32.sub (local.get 0) (i32.const 8))))`,
  "buf.store": `(func $buf.store (param $ptr i32) (param $idx i32) (param $val f64) (result f64) (f64.store (i32.add (local.get $ptr) (i32.shl (local.get $idx) (i32.const 3))) (local.get $val)) (local.get $val))`
}

export const math = {
  pi: ["(global pi f64 (f64.const 3.141592653589793))", FLOAT]
}

export default std