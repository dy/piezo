import { FLOAT, FUNC } from "./const.js"

// helpers
export const wat = {
  // signed min/max
  "i32.smax": "(func $wat/i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $wat/i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))",

  "f64.isnan": "(func $wat/f64.isnan (param f64) (result i32) (f64.ne (local.get 0) (local.get 0)))",

  // a %% b, also used to access buffer
  "i32.modwrap": `(func $wat/i32.modwrap (param i32 i32) (result i32) (local $rem i32)
  (local.set $rem (i32.rem_s (local.get 0) (local.get 1)))
  (if (result i32) (i32.and (local.get $rem) (i32.const 0x80000000))
    (then (i32.add (local.get 1) (local.get $rem)))
    (else (local.get $rem))
  ))`,

  // &&
  "i32.and": `(func $wat/i32.and (param i32 i32) (result i32) (if (result i32) (i32.eqz (local.get 0)) (then (local.get 0)) (else (local.get 1)) ))`,
  "f64.and": `(func $wat/f64.and (param f64 f64) (result f64) (if (result f64) (f64.eq (local.get 0) (f64.const 0)) (then (local.get 0)) (else (local.get 1)) ))`,
  // ||
  "i32.or": `(func $wat/i32.or (param i32 i32) (result i32) (if (result i32) (i32.eqz (local.get 0)) (then (local.get 1)) (else (local.get 0)) ))`,
  "f64.or": `(func $wat/f64.or (param f64 f64) (result f64) (if (result f64) (f64.eq (local.get 0) (f64.const 0)) (then (local.get 1)) (else (local.get 0)) ))`
}

export const math = {
  pi: ["(global pi f64 (f64.const 3.141592653589793))", FLOAT]
}

export default {
  wat, math
}