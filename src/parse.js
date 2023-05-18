// parser converts syntax into AST/calltree
import parse, { lookup, skip, cur, idx, err, expr, token, unary, binary, nary, isId } from 'subscript/parse.js'
import { FLOAT, INT } from './const.js'

export default (src) => parse(src)

// char codes
const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, QUOTE=39, DQUOTE=34, PERIOD=46, BSLASH=92, _0=48, _9=57, COLON=58, HASH=35, AT=64, PLUS = 43, MINUS = 45, GT = 62

// precedences
const PREC_SEMI=1,
PREC_EXPORT=2,
PREC_SEQUENCE=3, //  a, b==c, d,   a, b>=c, d,   a | b,c | d,   a?b:c , d
PREC_LOOP=4, // |>
PREC_PIPE=5, // |->
PREC_MAP=6, // ->
PREC_ASSIGN=7,  // a=b, c=d,  a = b||c,  a = b | c,   a = b&c
PREC_BOR=8, // a|b , c|d,   a = b|c
PREC_LABEL=10, // a:b = 2,  a:b, b:c,   a: b&c
PREC_TERNARY=11,
PREC_OR=12,
PREC_AND=13,
PREC_XOR=14,
PREC_BAND=15,
PREC_EQ=16,
PREC_COMP=17,
PREC_SHIFT=18,
PREC_CLAMP=19, // pre-arithmetical: a+b*c -< 10; BUT a < b-<c, a << b-<c
PREC_SUM=20,
PREC_RANGE=22, // +a .. -b, a**2 .. b**3, a*2 .. b*3; BUT a + 2..b + 3
PREC_MULT=23,
PREC_POW=24,
PREC_UNARY=25,
PREC_CALL=26, // a(b), a.b, a[b], a[]
PREC_TOKEN=27 // [a,b] etc

// make id support #
parse.id = n => skip(char => isId(char) || char === HASH)

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

  if (!n && !d) err('Bad number')

  // subscript takes 0/nullish value as wrong token, so we must wrap 0 into token
  // can be useful after (hopefully)
  let node = (numTypes[sep])(n, d);

  // parse units, eg. 1s
  if (unit = skip(c => !isNum(c) && isId(c))) node.push(unit)

  // parse unit combinations, eg. 1h2m3s
  if (isNum(cur.charCodeAt(idx))) node.push(num())

  return node
}
const numTypes = {
  '': (n, d) => [INT, +n],
  '.': (n, d) => [FLOAT, Number(n+'.'+d)],
  'e': (n, d) => [FLOAT, Number(n+'e'+d)],
  'x': (n, d) => [INT, parseInt(d, 16)],
  'b': (n, d) => [INT, parseInt(d, 2)]
}
// 0-9
for (let i = 0; i<=9; i++) lookup[_0+i] = num;
// .1
lookup[PERIOD] = a=>!a && num();

// export is parsed as last-resort period operator, conditioned it's last in the code
unary('.', PREC_EXPORT, true)

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
binary('=', PREC_ASSIGN, true)
binary('+=', PREC_ASSIGN, true)
binary('-=', PREC_ASSIGN, true)
binary('-<=', PREC_ASSIGN, true)
binary('**', PREC_POW, true)

binary('+', PREC_SUM)
binary('-', PREC_SUM)
binary('*', PREC_MULT)
binary('/', PREC_MULT)
binary('%', PREC_MULT)
// binary('|', PREC_BOR)
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

binary('-<', PREC_CLAMP) // a -< b

binary('|>', PREC_LOOP)
nary('|', PREC_PIPE)
token('|', PREC_BOR, (a,b)=> (
  // return BOR precedence only if rhs is not `->`, otherwise lower precedence
  // NOTE: there is a case with rhs higher than map:  a|b=c
  // it's parsed as a | b=c, which is better than "logical"  a|b  = c
  a && (b=expr(PREC_ASSIGN-1)) && (b[0]!=='->') && ['|',a,b]
))
// NOTE: we take functions same precedence as assign to be able `a = x -> y`
binary('->', PREC_ASSIGN, true)

// unaries
unary('+', PREC_UNARY)
unary('-', PREC_UNARY)
unary('!', PREC_UNARY)
unary('~',  PREC_UNARY)
unary('++', PREC_UNARY)
unary('--', PREC_UNARY)
token('++', PREC_UNARY, a => a && ['-',['++',a],[INT,1]])
token('--', PREC_UNARY, a => a && ['+',['--',a],[INT,1]])

unary('^', PREC_TOKEN) // continue with value: ^ a
token('^', PREC_TOKEN, a => !a && !expr(PREC_TOKEN) && ['^']) // continue: ^
unary('^^', PREC_TOKEN) // break with balue: ^ a
token('^^', PREC_TOKEN, a => !a && !expr(PREC_TOKEN) && ['^^']) // return value: ^ a

// a..b, ..b, a..
token('..', PREC_RANGE, a => ['..', a, expr(PREC_RANGE)])
token('>..', PREC_RANGE, a => ['>..', a, expr(PREC_RANGE)])
token('>..<', PREC_RANGE, a => ['>..<', a, expr(PREC_RANGE)])
token('..<', PREC_RANGE, a => ['..<', a, expr(PREC_RANGE)])

// a.b
// NOTE: we don't parse expression to avoid 0..1 recognizing as 0[.1]
token('.', PREC_CALL, (a,b) => a && (b=skip(isId)) && ['.', a, b])

// *a
unary('*', PREC_UNARY)

// >a
unary('>', PREC_UNARY)

// @ 'ab'
unary('@', PREC_TOKEN)

// a?b, a?:b
// NOTE: duplicate of || &&
// binary('?', PREC_TERNARY)
// binary('?:', PREC_TERNARY)

// a?b:c,   a ? b?c:d : e,   a ? b : c?d:e
token('?', PREC_TERNARY, (a, b, c) => (
  a && (b=expr(PREC_TERNARY-1)) && skip(c => c === COLON) && (c=expr(PREC_TERNARY-1), ['?', a, b, c])
))
// a:b, c:d
binary(':', PREC_LABEL, false)

// a[b], a[]
token('[', PREC_CALL,  (a,b) => a && (b=expr(0,CBRACK), b ? ['[]', a, b] : ['[]', a]))

// [a,b,c], [], [1]a, [1,2,3]a
// token('[', PREC_TOKEN, (a,b,name) => !a && (b=expr(0,CBRACK), name = skip(isId), a = ['['], (b||name) && a.push(b||''), name && a.push(name), a ))
token('[', PREC_TOKEN, (a,b) => !a && (b = expr(0,CBRACK), b ? ['[', b] : ['[']))

// (a,b,c), (a)
token('(', PREC_CALL, (a,b) => !a && (b = expr(0,CPAREN), b ? ['(', b] : ['(']))

// a(b,c,d), a()
token('(', PREC_CALL, (a,b) => a && (b = expr(0, CPAREN), b ? ['()', a, b] : ['()', a]))

