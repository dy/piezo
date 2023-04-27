import { FLOAT, FUNC } from "./const.js"

// helpers
export const util = {
  "i32.smax": "(func $util/i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $util/i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))",
  // calculate array index - (i + len) % len
  "idx": "(func $util/idx (param i32 i32) (result i32) (i32.rem_s (i32.add (local.get 0)(local.get 1)) (local.get 1)))"
}

export const math = {
  pi: ["(global pi f64 (f64.const 3.141592653589793))", FLOAT]
}

export default {
  util, math
}