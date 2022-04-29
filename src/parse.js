// parser converts syntax into AST/calltree
import parse, { isId, lookup, skip, cur, idx, err, expr, token, unary, binary, nary } from 'subscript/parse.js'

export default (src) => parse(src)

const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, QUOTE=39, DQUOTE=34, PERIOD=46, BSLASH=92, _0=48, _9=57,
PREC_SEQ=1, PREC_END=1, PREC_ASSIGN=2, PREC_FUNC=2, PREC_LOOP=2, PREC_GROUP=3.14, PREC_COND=3, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_EXP=14, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_TOKEN=20


// extended id definition
parse.id = ()=>skip(c => isId(c) || c == 35 || c == 64).toLowerCase() // #, @ are parts of id

// FIXME:
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

// 'true', 20, a => a ? err() : ['',true],
// 'false', 20, a => a ? err() : ['',false],

const num = (a,fract) => a ? err() : ['float', (
  a = skip(c => c>=_0 && c<=_9),
  cur[idx]==='.' && (fract = skip(c => c>=_0 && c<=_9)) && (a += fract),
  (a=+a)!=a?err('Bad number', a) : a
)]
// .1
// '.',, a=>!a && num(),
// 0-9
for (let i = 0; i<=9; i++) lookup[_0+i] = num;


// comments
token('//', PREC_TOKEN, (a, prec) => (skip(c => c >= SPACE), a||expr(prec)))

// sequences
nary(',', PREC_GROUP)
nary(';', PREC_SEQ)
nary('||', PREC_SOME)
nary('&&', PREC_EVERY)

// binaries
binary('~', PREC_COMP )
binary('**', PREC_EXP, true)
binary('=', PREC_ASSIGN, true)

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

// a,b->b,a
binary('->', PREC_FUNC)
// a,b>-c
binary('>-', PREC_FUNC)
// a |: b
binary('|:', PREC_LOOP)


// unaries
unary('+', PREC_UNARY)
unary('-', PREC_UNARY)
unary('!', PREC_UNARY)
unary('~',  PREC_UNARY)
unary('++', PREC_UNARY)
unary('--', PREC_UNARY)
token('++', PREC_UNARY, a => a && ['-',['++',a],1])
token('--', PREC_UNARY, a => a && ['+',['--',a],1])

// topic reference: ^ a
unary('^', PREC_TOKEN)

// end token
unary('.', PREC_END, true)

// import
unary('@', PREC_TOKEN)

// a.b
token('.', PREC_CALL, (a,b) => a && (b=expr(PREC_CALL)) && ['.', a, b])

// a..b, ..b, a..
token('..', PREC_CALL, a => ['..', a || '', expr(PREC_CALL)])

// ...a
unary('...', PREC_UNARY)

// # "ab";
unary('#', PREC_ASSIGN)

// @ 'ab'
unary('@', PREC_ASSIGN)

// ?:
token('?', PREC_COND, (a, b, c) => a && (b=expr(2,58)) && (c=expr(3), ['?', a, b, c]))

// a[b]
token('[', PREC_CALL,  a => a && ['[', a, expr(0,CBRACK)||err()])

// [a,b,c]
token('[', PREC_TOKEN, (a) => !a && ['[', expr(0,93)||''])
token(':', 1.1, (a, b) => (b=expr(1.1)||err(), [':',a,b]))

// (a,b,c), (a)
token('(', PREC_CALL, a => !a && ['(', expr(0,CPAREN)||err()])

// a(b,c,d), a()
token('(', PREC_CALL, (a,b) => a && ((b=expr(0, CPAREN)) ? ['(', a, b] : ['(', a]))

