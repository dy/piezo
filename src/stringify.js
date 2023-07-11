export default function stringify(str) {
  if (typeof str === 'string') return str
  let [op, a, b] = str
  return `${stringify(a)} ${op} ${stringify(b)}`
}