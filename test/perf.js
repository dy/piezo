
import t, { is, not, ok, same, throws } from 'tst'
import compile from '../src/compile.js'
import { compileWat } from './compile.js'

t('perf: sobel', t => {
  // Reference:
  // https://github.com/mattdesl/wasm-bench/blob/main/src/javascript/process.js
  compile(`
    get_pixel(data, px, py, columns, rows) = (
      (px < 0) ? px = 0;
      (py < 0) ? py = 0;
      (px >= columns) ? px = columns - 1;
      (py >= rows) ? py = rows - 1;
      data[px + py * columns];
    ),

    process(data, width, height) = (
      0..height <| y -> (
        0..width <| x -> (
          ;; Extract values from image
          (val0, val1, val2, val3, val5, val6, val7, val8) = (
            get_pixel(data, x, y, width, height),
            get_pixel(data, x + 1, y, width, height),
            get_pixel(data, x + 2, y, width, height),
            get_pixel(data, x, y + 1, width, height),
            get_pixel(data, x + 2, y + 1, width, height),
            get_pixel(data, x, y + 2, width, height),
            get_pixel(data, x + 1, y + 2, width, height),
            get_pixel(data, x + 2, y + 2, width, height),
          )
          ;; Apply Sobel kernel
          gx = -1 * val0 + -2 * val3 + -1 * val6 + val2 + 2 * val5 + val8;
          gy = -1 * val0 + -2 * val1 + -1 * val2 + val6 + 2 * val7 + val8;
          mag = (gx * gx + gy * gy) ** 1/2;
          mag <?= 0..1;
          data[x + y * width] = mag;
        )
      )
    ).`
  )
})

t.todo('perf: biquad', t => {
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