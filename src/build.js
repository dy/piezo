// builder actually generates wast code from params / current context
import { globals, locals, slocals, funcs } from "./compile.js"
import { err } from "./util.js"
import stdlib from "./stdlib.js"

// create op result, a string with extra info like types
// holds number of returns (ops)
// makes sure it stringifies properly into wasm expression
// provides any additional info: types, static, min/max etc
export function op(str = '', type, info = {}) {
  str = new String(str)
  if (!type) type = []
  else if (typeof type === 'string') type = [type]
  return Object.assign(str, { type, ...info })
}

// (local.set) or (global.set) (if no init - takes from stack)
export function set(name, init = '') {
  return op(`(${locals?.[name] || slocals?.[name] ? 'local' : 'global'}.set $${name} ${init})`, null)
}

// (local.get) or (global.get)
export function get(name) {
  return op(`(${locals?.[name] || slocals?.[name] ? 'local' : 'global'}.get $${name})`, (locals?.[name] || slocals?.[name] || globals[name]).type)
}

// (local.tee) or (global.set)(global.get)
export function tee(name, init = '') {
  return op(locals?.[name] || slocals?.[name] ? `(local.tee $${name} ${init})` : `(global.set $${name} ${init})(global.get $${name})`, init.type)
}

// produce function call method
export function call(name, ...args) {
  if (!funcs[name]) err(`Unknown function call '${name}'`)
  return op(`(call $${name} ${args.join(' ')})`, funcs[name].type)
}

// define variable in current scope, export if necessary; returns resolved name
// FIXME if name includes `:` - it enforces local name (in start local function)
// definition includes { var, type, init } object
export function define(name, type = 'f64', init) {
  if (locals?.[name] || slocals?.[name] || globals?.[name]) return name;
  ; (locals || (name.includes(':') ? slocals : globals))[name] = { var: true, type, init }
  return name
}

// wrap expression to float, if needed
export function float(opStr) {
  if (opStr.type[0] === 'f64') return opStr
  if (opStr.startsWith('(i32.const')) return op(opStr.replace('(i32.const', '(f64.const'), 'f64')
  return op(`(f64.convert_i32_s ${opStr})`, 'f64')
}
// cast expr to int
export function int(opStr) {
  if (opStr.type[0] === 'i32') return opStr
  return op(`(i32.trunc_f64_s ${opStr})`, 'i32')
}

// add include from stdlib and return call
// NOTE: we cannot remove it due to circular deps
export function include(name) {
  if (!stdlib[name]) err('Unknown include `' + name + '`')
  // parse type from first (result) token
  // FIXME: must be done better
  let code = stdlib[name]
  let type = code.match(/\(result\s+([^\)]+)\)/i)?.[1].trim().split(/\s+/)
  if (!funcs[name]) fun(name, code, type)
}

// define (global) function
export function fun(name, code, type) {
  funcs[name] = new String(code)
  funcs[name].type = type
  console.log(name, funcs[name])
}

/**
 * Pick N input args into stack, like (a,b,c) -> (a,b)
 *
 * @param {number} count - number of elements to pick
 * @param {string} input - stringified operation
 * @returns {string}
 */
export function pick(count, input) {
  // (a,b,c) = d - we duplicate d to stack
  if (input.type.length === 1) {
    // a = b - skip picking
    if (count === 1) return input
    // (a,b,c) = d - duplicating via tmp var is tentatively faster & more compact than calling a dup function
    // FIXME: can be single global variable
    const name = define(`dup:${input.type[0]}`, input.type[0])
    return op(
      `(local.set $${name} ${input})${`(local.get $${name})`.repeat(count)}`,
      Array(count).fill(input.type[0])
    )
  }

  // (a,b) = (c,d) - avoid picking since result is directly put into stack
  if (input.type.length === count) return input

  // (a,b) = (c,d,e) – drop redundant members
  if (count < input.type.length) return op(input + `(drop)`.repeat(input.type.length - count), input.type.slice(0, count))

  // (a,b,c) = (d,e) – pick a & b, skip c
  if (count > input.type.length) err('Picking more members than available')

  // NOTE: repeating els like (a,b,c)=(b,c,a) are not a threat, we don't need a function
  // putting them directly to stack is identical to passing to pick(b,c,a) as args
}
