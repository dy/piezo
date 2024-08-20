import melo from '../melo.js'
import watr from '../node_modules/watr/watr.js'

class MeloProcessor extends AudioWorkletProcessor {
  s = 0
  f(t) { return Math.random() * 2 - 1 }
  // f(t) { return t * (((t >> 12) | (t >> 8)) & (63 & (t >> 4))) }
  constructor(...args) {
    super(...args);
    this.port.onmessage = async (e) => {
      console.log('received', e.data);
      const wast = melo(e.data)
      const buffer = watr(wast)
      const module = await WebAssembly.compile(buffer)
      const instance = await WebAssembly.instantiate(module);
      this.f = instance.exports.f
    };
  }
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = this.f(this.s++)
      }
    });
    return true;
  }
}

registerProcessor("processor", MeloProcessor);
