
import t, { is, not, ok, same, throws } from 'tst'
import compile from '../src/compile.js'
import { compileWat } from './compile.js'


t('perf: biquad', t => {
  compile(`
    @math: pi,cos,sin;                  ;; import pi, sin, cos from math

    1pi = pi;                           ;; define pi units
    1s = 44100;                         ;; define time units in samples
    1k = 10000;                         ;; basic si units

    lpf(                                ;; per-sample processing function
      x0,                               ;; input sample value
      freq <= 1..10k = 100,             ;; filter frequency, float
      Q <= 0.001..3.0 = 1.0             ;; quality factor, float
    ) = (
      *(x1, y1, x2, y2) = 0;            ;; define filter state

      ;; lpf formula
      w = 2pi * freq / 1s;
      (sin_w, cos_w) = (sin(w), cos(w));
      a = sin_w / (2.0 * Q);

      (b0, b1, b2) = ((1.0 - cos_w) / 2.0, 1.0 - cos_w, b0);
      (a0, a1, a2) = (1.0 + a, -2.0 * cos_w, 1.0 - a);

      (b0, b1, b2, a1, a2) *= 1.0 / a0;

      y0 = b0*x0 + b1*x1 + b2*x2 - a1*y1 - a2*y2;

      (x1, x2) = (x0, x1);              ;; shift state
      (y1, y2) = (y0, y1);

      y0                                ;; return y0
    );

    ;; (0, .1, .3) <| x -> lpf(x, 108, 5)

    lpf.                                ;; export lpf function, end program
  `)
})