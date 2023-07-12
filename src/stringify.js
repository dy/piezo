import { FLOAT, INT } from "./const.js"

export default function stringify(str) {
  if (typeof str === 'string') return str
  let [op, a, ...args] = str
  if (op === INT || op === FLOAT) return a+args.join('')
  return `${stringify(a)} ${op} ${stringify(args[0])}`
}