// parser converts syntax into AST/calltree
import parse, { lookup, skip, cur, idx, err, expr, token, unary, binary, nary, isId } from 'subscript/parse.js'

export default (src) => parse(src)

// char codes
const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, QUOTE=39, DQUOTE=34, PERIOD=46, BSLASH=92, _0=48, _9=57, COLON=58, HASH=35, AT=64, _X = 120, _B = 98, PLUS = 43, MINUS = 45

// precedences
const PREC_SEMI=1,
PREC_ASSIGN=3,  // a = b=>c,  a,b = c,d,  a = b||c,  a = b|c (NOTE: different from JS, more Pythony)
PREC_BOR=3.5, // NOTE: reduced weight to use as pipe operator, may cause side-effects (which ones?)
PREC_FUNC=4, // a = b=>c, BUT b => c,d
PREC_SEQUENCE=5, // a => b,c; BUT a, b==c, d,   a, b>=c, d,  a | b,c | d,   a?b:c , d
PREC_TERNARY=6,
PREC_LABEL=6.5, // a:b = 2,  a:b, b:c,   a: b&c
PREC_OR=7,
PREC_AND=8,
PREC_XOR=10,
PREC_BAND=11,
PREC_EQ=12,
PREC_COMP=13,
PREC_SHIFT=14,
PREC_CLAMP=15, // pre-arithmetical: a+b*c -< 10; BUT a < b-<c, a << b-<c
PREC_SUM=16,
PREC_FIND=17, // a <~ b*2, a..b <~ c BUT a<~b + 2
PREC_RANGE=18, // +a .. -b, a**2 .. b**3, a*2 .. b*3; BUT a + 2..b + 3
PREC_MULT=19,
PREC_POW=20,
PREC_UNARY=21,
PREC_CALL=22, // a(b), a.b, a[b], a[]
PREC_TOKEN=23 // [a,b] etc

// make id support #
parse.id = n => skip(char => isId(char) || char === HASH).toLowerCase()

const isNum = c => c >= _0 && c <= _9
const num = (a) => {
  if (a) err(); // abc 023 - wrong
  let n = skip(isNum), sep='', d='', unit; // numerator, separator, denominator, unit

  let next = cur.charCodeAt(idx+1)
  if (numTypes[cur[idx]] && (isNum(next) || next === PLUS || next === MINUS)) {
    sep = skip()
    if (next === PLUS || next === MINUS) d = skip(), d += (skip(isNum) || err('Bad number', n + sep + d))
    else d = skip(isNum)
    if (sep && !d) err('Bad number', n + sep + d)
  }

  // subscript takes 0/nullish value as wrong token, so we must wrap 0 into token
  // can be useful after (hopefully)
  let node = (numTypes[sep])(n, d);
  if (!node) err('Bad number')

  // parse units, eg. 1s
  if (unit = skip(c => !isNum(c) && isId(c))) node.push(unit)

  // parse unit combinations, eg. 1h2m3s
  if (isNum(cur.charCodeAt(idx))) node.push(num())

  return node
}
const numTypes = {
  '': (n, d) => ['int', +n],
  '.': (n, d) => ['flt', Number(n+'.'+d)],
  'e': (n, d) => ['flt', Number(n+'e'+d)],
  'x': (n, d) => ['hex', parseInt(d, 16)],
  'b': (n, d) => ['bin', parseInt(d, 2)]
}
// 0-9
for (let i = 0; i<=9; i++) lookup[_0+i] = num;
// .1
lookup[PERIOD] = a=>!a && num();


const string = q => (qc, c, str='') => {
  qc&&err('Unexpected string') // must not follow another token
  skip()
  while (c=cur.charCodeAt(idx), c-q) {
    if (c === BSLASH) skip(), c=skip(), str += escape[c] || c
    else str += skip()
  }
  skip()
  return [String.fromCharCode(q),str]
},
escape = {n:'\n', r:'\r', t:'\t', b:'\b', f:'\f', v:'\v'}
lookup[DQUOTE] = string(DQUOTE)
lookup[QUOTE] = string(QUOTE)


// comments
token('//', PREC_TOKEN, (a, prec) => (skip(c => c >= SPACE), a||expr(prec)))

// sequences
nary(',', PREC_SEQUENCE, false)
nary(';', PREC_SEMI, true)
nary('||', PREC_OR)
nary('&&', PREC_AND)

// binaries
binary('**', PREC_POW, true)
binary('=', PREC_ASSIGN, true)
binary('+=', PREC_ASSIGN, true)
binary('-=', PREC_ASSIGN, true)
binary('-<=', PREC_ASSIGN, true)

binary('+', PREC_SUM)
binary('-', PREC_SUM)
binary('*', PREC_MULT)
binary('/', PREC_MULT)
binary('%', PREC_MULT)
binary('|', PREC_BOR)
binary('&', PREC_BAND)
binary('^', PREC_XOR)
binary('==', PREC_EQ)
binary('!=', PREC_EQ)
binary('>', PREC_COMP)
binary('>=', PREC_COMP)
binary('<', PREC_COMP)
binary('<=', PREC_COMP)
binary('>>', PREC_SHIFT)
binary('>>>', PREC_SHIFT)
binary('<<', PREC_SHIFT)

// binary('<-', PREC_COMP ) // a <- b
binary('->', PREC_FUNC) // a,b->b,a
// binary('>-', PREC_FUNC) // a,b>-c
binary('-<', PREC_CLAMP) // a -< b

binary('~>', PREC_FIND) // a ~> b
binary('<~', PREC_FIND) // a <~ b

// unaries
unary('+', PREC_UNARY)
unary('-', PREC_UNARY)
unary('!', PREC_UNARY)
unary('~',  PREC_UNARY)
unary('++', PREC_UNARY)
unary('--', PREC_UNARY)
token('++', PREC_UNARY, a => a && ['-',['++',a],1])
token('--', PREC_UNARY, a => a && ['+',['--',a],1])

unary('^', PREC_TOKEN) // pin: ^ a
unary('^^', PREC_TOKEN) // pin: ^ a

// a..b, ..b, a..
token('..', PREC_RANGE, a => ['..', a, expr(PREC_RANGE)])
token('>..', PREC_RANGE, a => ['>..', a, expr(PREC_RANGE)])
token('>..<', PREC_RANGE, a => ['>..<', a, expr(PREC_RANGE)])
token('..<', PREC_RANGE, a => ['..<', a, expr(PREC_RANGE)])

// a.b
// token('.', PREC_CALL, (a,b) => a && (b=expr(PREC_CALL)) && ['.', a, b])
// NOTE: we don't parse expression to avoid 0..1 recognize as 0[.1]
token('.', PREC_CALL, (a,b) => a && (b=skip(isId)) && ['.', a, b])

// *a
unary('*', PREC_UNARY)

// @ 'ab'
unary('@', PREC_ASSIGN)

// a?b
binary('?', PREC_TERNARY)

// ?:
token('?', PREC_TERNARY, (a, b, c) => a && (b=expr(2)) && (cur[idx]===':'&&idx++) && (c=expr(3), ['?', a, b, c]))

// a[b]
token('[', PREC_CALL,  a => a && ['[', a, expr(0,CBRACK)||err()])

// a[]
unary('[]', PREC_CALL, true)

// [a,b,c]
token('[', PREC_TOKEN, (a) => !a && ['[', expr(0,93)||''])
binary(':', PREC_LABEL)

// (a,b,c), (a)
// FIXME: do we need extra wrapper here? can we just return internal token
token('(', PREC_CALL, a => !a && ['(', expr(0,CPAREN)||err()])

// a(b,c,d), a()
token('(', PREC_CALL, (a,b) => a && ['(', a, expr(0, CPAREN)])

