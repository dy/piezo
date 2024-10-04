import piezo from '../dist/piezo.js'
// import watr from '../node_modules/watr/watr.js'
import watr from 'https://unpkg.com/watr'

class MeloProcessor extends AudioWorkletProcessor {
  f() { return Math.random() * 2 - 1 }
  // f() { return t * (((t >> 12) | (t >> 8)) & (63 & (t >> 4))) }
  constructor(...args) {
    super(...args);
    this.port.onmessage = async (e) => {
      console.log('received', e.data);
      const wast = piezo(e.data)
      const buffer = watr(wast)
      const module = await WebAssembly.compile(buffer)
      const instance = await WebAssembly.instantiate(module);
      this.f = instance.exports.f
      console.log('compiled', this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f(), this.f())
    };
  }
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        channel[i] = this.f()
      }
    });
    return true;
  }
}

registerProcessor("processor", MeloProcessor);
