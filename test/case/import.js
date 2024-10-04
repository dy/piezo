import t, { almost, is, not, ok, same, throws } from 'tst'
import compileZ from '../../src/compile.js'
import { compileWat } from '../util.js'

t.todo('import: simple', t => {
  // FIXME: need to use external imports, not internal
  const imports = { math: { sin: Math.sin, pi: Math.PI } };
  let wat = compileZ(`<math#pi,sin>; pi, sinpi(n=1)=sin(pi*n)`, { imports })
  let mod = compileWat(wat, imports)
  let { pi, sinpi } = mod.instance.exports
  is(pi.value, Math.PI)
  is(sinpi(1 / 2), Math.sin(Math.PI / 2))
  is(sinpi(2), Math.sin(Math.PI * 2))
})

t.todo('import: non-existent', t => {
})
