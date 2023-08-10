// parser converts syntax into AST/calltree
import parse, { lookup, skip, cur, idx, err, expr, token, unary, binary, nary, isId } from 'subscript/parse.js'
import { FLOAT, INT } from './const.js'

export default (str) => (
  parse(str)
)

// char codes
const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, QUOTE=39, DQUOTE=34, PERIOD=46, BSLASH=92, _0=48, _9=57, COLON=58, HASH=35, AT=64, PLUS = 43, MINUS = 45, GT = 62

// precedences
const PREC_SEMI=1,
PREC_EXPORT=2,
PREC_RETURN=4, // x ? ^a : y
PREC_STATE=4, // *(a,b,c)
PREC_LOOP=5, // <| |>
// NOTE: these halves are sensitive since subscript for rassoc uses 0.5 precedence shift
PREC_SEQUENCE=7.75, //  ^a,b,c;  a, b ? c,d : e,f;
PREC_IF=8,    // a ? b=c;  a = b?c;
PREC_ASSIGN=8.25,  // a=b, c=d,  a = b||c,  a = b | c,   a = b&c
PREC_OR=11,
PREC_AND=12,
PREC_BOR=13, // a|b , c|d,   a = b|c
PREC_XOR=14,
PREC_BAND=15,
PREC_EQ=16,
PREC_COMP=17,
PREC_SHIFT=18,
PREC_CLAMP=19, // pre-arithmetical: a+b*c <? 10; BUT a < b<?c, a << b<?c
PREC_SUM=20,
PREC_RANGE=22, // +a .. -b, a**2 .. b**3, a*2 .. b*3; BUT a + 2..b + 3
PREC_MULT=23,
PREC_POW=24,
PREC_UNARY=26,
PREC_CALL=27, // a(b), a.b, a[b], a[]
PREC_TOKEN=28 // [a,b] etc

// make id support #@
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
// lookup[DQUOTE] = string(DQUOTE)
// lookup[QUOTE] = string(QUOTE)

// sequences
nary(',', PREC_SEQUENCE, true)
nary(';', PREC_SEMI, true)
nary('||', PREC_OR)
nary('&&', PREC_AND)

// binaries
binary('=', PREC_ASSIGN, true)
binary('+=', PREC_ASSIGN, true)
binary('-=', PREC_ASSIGN, true)
binary('<?=', PREC_ASSIGN, true)
binary('<|=', PREC_ASSIGN, true)
binary('**', PREC_POW, true)

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

binary('<?', PREC_CLAMP) // a <? b
nary('<|', PREC_LOOP)
nary('|>', PREC_LOOP)

// unaries
unary('+', PREC_UNARY)
unary('-', PREC_UNARY)
unary('!', PREC_UNARY)
unary('~',  PREC_UNARY)
unary('++', PREC_UNARY)
unary('--', PREC_UNARY)
token('++', PREC_UNARY, a => a && ['-',['++',a],[INT,1]])
token('--', PREC_UNARY, a => a && ['+',['--',a],[INT,1]])

// returns
// unary('^^', PREC_RETURN) // break with value: ^ a
// unary('^', PREC_RETURN) // continue with value: ^ a
token('^', PREC_TOKEN, (a,b) => !a && (b=expr(PREC_RETURN), b ? ['^',b] : ['^'])) // continue: ^
token('^^', PREC_TOKEN, (a,b) => !a && (b=expr(PREC_RETURN), b ? ['^^',b] : ['^^'])) // break: ^^

// @
token('@', PREC_TOKEN, (a,b) => !a && '@')

// a..b, ..b, a..
token('..', PREC_RANGE, a => ['..', a, expr(PREC_RANGE)])
token('..=', PREC_RANGE, a => ['..=', a, expr(PREC_RANGE)])

// a.b
// NOTE: we don't parse expression to avoid 0..1 recognizing as 0[.1]
// NOTE: for now we disable prop access since we don't have alias and just static index can be done via x[0]
// token('.', PREC_CALL, (a,b) => a && (b=skip(isId)) && ['.', a, b])

// *a
unary('*', PREC_STATE)

// a?b
// NOTE: unlike || && this operator is void
binary('?', PREC_IF, true)

// a?b:c
token('?', PREC_IF, (a, b, c) => (
  a && (b=expr(PREC_IF-1)) && skip(c => c === COLON) && (c=expr(PREC_IF-1), ['?:', a, b, c])
))
// a:b, c:d
// binary(':', PREC_LABEL, true)

// a[b], a[]
token('[', PREC_CALL,  (a,b) => a && (b=expr(0,CBRACK), b ? ['[]', a, b] : ['[]', a]))

// [a,b,c], []
token('[', PREC_TOKEN, (a,b) => !a && (b = expr(0,CBRACK), b ? ['[', b] : ['[']))

// (a,b,c), (a)
token('(', PREC_CALL, (a,b) => !a && (b = expr(0,CPAREN), b ? ['(', b] : ['(']))

// a(b,c,d), a()
token('(', PREC_CALL, (a,b) => a && (b = expr(0, CPAREN), b ? ['()', a, b] : ['()', a]))

// <a#b,c>
token('<', PREC_TOKEN, (a,b) => !a && (b = skip(c => c !== GT), skip(), b ? ['<>', b] : err('Empty import statement')))

// \comments
token('\\', PREC_TOKEN, (a, prec) => ( skip(c => c >= SPACE), skip(), a || expr(prec) || [';']))
