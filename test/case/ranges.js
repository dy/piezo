import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'


t('ranges: basic', t => {
  let wat = compileMel(`x = 11 ~ 0..10`)
  let mod = compileWat(wat)
  is(mod.instance.exports.x.value, 10)

  wat = compileMel(`x = 0 ~ 1..10`)
  mod = compileWat(wat)
  is(mod.instance.exports.x.value, 1)

  wat = compileMel(`clamp(x) = (x ~ 0..10)`)
  mod = compileWat(wat)
  is(mod.instance.exports.clamp(11), 10)
  is(mod.instance.exports.clamp(-1), 0)
})


t('range: ', () => {
  `a |> _`
})

t(`a..b |> _`, () => { })
t(`a.. |> _`, () => { })
t(`..b |> _`, () => { })
t(`.. |> _`, () => { })

t(`(a,b..c) |> _`, () => { })
t(`(a,b..) |> _`, () => { })
t(`(a,..c) |> _`, () => { })
t(`(a,..) |> _`, () => { })
t(`(a,b[c..]) |> _`, () => { })
t(`(a,b[c..],..d|>_*2) |> _`, () => { })

t(`a[b..c] |> _`, () => { })
t(`a[b..] |> _`, () => { })
t(`a[..c] |> _`, () => { })
t(`a[..] |> _`, () => { })

t(`a[a..b,c] |> _`, () => { })
t(`a[a..b,c..d] |> _`, () => { })

t(`a..b + c.. |> _`, () => { })
t(`(x = (a,b..c) + d..) |> _`, () => { })
