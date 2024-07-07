import t, { almost, is, not, ok, same, throws } from 'tst'
import compileMel from '../../src/compile.js'
import { compileWat } from '../util.js'

t.todo('example: audio-gain', t => {
  let wat = compileMel(`
  blockSize = 1024;
  gain = ([blockSize]data, volume ~ 0..1000) -> [data | x -> x * volume];
  `)
  let mod = compileWat(wat)
  let { gain } = mod.instance.exports
  is(gain([1, 2, 3], 2), [2, 4, 6])

  // let wat = compileMel(`
  //   blockSize = 1024;
  //   gain = ([2, blockSize]data, volume ~ 0..1000) -> [data | ch -> (ch | x -> x * volume)];
  // `)
})

t.todo('example: sine gen', t => {
  let wat = compileMel(analyse(parse(`
    pi = 3.14;
    pi2 = pi*2;
    sampleRate = 44100;

    sine(freq) = (
      *phase=0;
      phase += freq * pi2 / sampleRate;
      [sin(phase)].
    )
  `)))
  console.log(wat)

  is(wat, [])
})
