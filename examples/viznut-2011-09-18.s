;; http://viznut.fi/demos/unix/bytebeat_formulas.txt

f() = (
  *t=0; (t++)*(((t>>12)|(t>>8))&(63&(t>>4)))
)
