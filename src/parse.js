// parser converts syntax into AST/calltree
import parse, { lookup, skip, cur, idx, err, expr, token, unary, binary, nary, isId } from 'subscript/parse.js'

export default (src) => parse(src)

// char codes & precedences
const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, QUOTE=39, DQUOTE=34, PERIOD=46, BSLASH=92, _0=48, _9=57, COLON=58, HASH=35, AT=64, _X = 120, _B = 98, PLUS = 43, MINUS = 45,
PREC_SEMI=1, PREC_END=6, PREC_ASSIGN=5, PREC_FUNC=2, PREC_LOOP=2, PREC_SEQ=4, PREC_COND=3, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_EXP=14, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_TOKEN=20,
PREC_RANGE=12.5 // +a..-b, a**2..b**3, a*2..b*3, but not a+2..b+3

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
nary(',', PREC_SEQ, true)
nary(';', PREC_SEMI, true)
nary('||', PREC_SOME)
nary('&&', PREC_EVERY)

// binaries
binary('**', PREC_EXP, true)
binary('=', PREC_ASSIGN, true)
binary('+=', PREC_ASSIGN, true)
binary('-=', PREC_ASSIGN, true)

binary('+', PREC_SUM)
binary('-', PREC_SUM)
binary('*', PREC_MULT)
binary('/', PREC_MULT)
binary('%', PREC_MULT)
binary('|', PREC_OR)
binary('&', PREC_AND)
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

binary('<-', PREC_COMP ) // a <- b
binary('->', PREC_FUNC) // a,b->b,a
binary('>-', PREC_FUNC) // a,b>-c
binary('-<', PREC_LOOP) // a -< b

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
binary('?', PREC_COND)

// ?:
token('?', PREC_COND, (a, b, c) => a && (b=expr(2)) && (cur[idx]===':'&&idx++) && (c=expr(3), ['?', a, b, c]))

// a[b]
token('[', PREC_CALL,  a => a && ['[', a, expr(0,CBRACK)||err()])

// a[]
unary('[]', PREC_CALL, true)

// [a,b,c]
token('[', PREC_TOKEN, (a) => !a && ['[', expr(0,93)||''])
token(':', 1.1, (a, b) => (b=expr(1.1)||err(), [':',a,b]))

// (a,b,c), (a)
token('(', PREC_CALL, a => !a && ['(', expr(0,CPAREN)||err()])

// a(b,c,d), a()
token('(', PREC_CALL, (a,b) => a && ((b=expr(0, CPAREN)) ? ['(', a, b] : ['(', a]))

