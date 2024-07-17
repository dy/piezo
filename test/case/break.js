// various break, skip, continue tests

`(a ? ./ : b)` // throws
  `(a ? ./1 : b)` // ok
  `(a ? ./ : b.)` // ok
  `(a ? ./;)`     // ok
  `(a ? ./)`      // ok

  `(a ? ../ : b)` // throws
  `(a ? ../1 : b)` // ok
  `(a ? ../ : b.)` // ok
  `(a ? ../;)`     // ok
  `(a ? ../)`      // ok

  `((a ? ../) : b)` // throws
  `((a ? ../1) : b)` // ok
  `((a ? ../) : b.)` // ok
  `((a ? ../);)`     // ok
  `((a ? ../))`      // ok

  `((((a ? .../))))` // ok
  `((((a ? .../))) b;)` // throws
