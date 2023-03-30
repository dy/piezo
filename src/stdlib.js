import { FLOAT, FUNC } from "./const.js"

// helpers
export const std = {
  "i32.smax": "(func $std/i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $std/i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))"
}

export const math = {
  PI: ["(global PI f64 (f64.const 3.141592653589793))", FLOAT]
}

export default {
  std, math
}