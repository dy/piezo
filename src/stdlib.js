import { FLOAT, FUNC } from "./const.js"

// helpers
export const wat = {
  "i32.smax": "(func $wat/i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $wat/i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))",
  "f64.isnan": "(func $wat/f64.isnan (param f64) (result i32) (f64.ne (local.get 0) (local.get 0)))",
  "i32.modwrap": `(func $wat/i32.modwrap (param i32 i32) (result i32) (local $rem i32)
  (local.set $rem (i32.rem_s (local.get 0) (local.get 1)))
  (if (result i32) (i32.and (local.get $rem) (i32.const 0x80000000))
    (then (i32.add (local.get 1) (local.get $rem)))
    (else (local.get $rem))
  ))`
}

export const math = {
  pi: ["(global pi f64 (f64.const 3.141592653589793))", FLOAT]
}

export default {
  wat, math
}