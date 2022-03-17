// parser converts syntax into AST/calltree
import parse, { isId, set as token, lookup, skip, cur, idx, err, expr } from 'subscript/parse.js'

export default parse

const OPAREN=40, CPAREN=41, OBRACK=91, CBRACK=93, SPACE=32, DQUOTE=34, PERIOD=46, _0=48, _9=57,
PREC_SEQ=1, PREC_END=1.5, PREC_ASSIGN=2, PREC_FUNC=2, PREC_LOOP=2, PREC_COND=3, PREC_SOME=4, PREC_EVERY=5, PREC_OR=6, PREC_XOR=7, PREC_AND=8,
PREC_EQ=9, PREC_COMP=10, PREC_SHIFT=11, PREC_SUM=12, PREC_MULT=13, PREC_EXP=14, PREC_UNARY=15, PREC_POSTFIX=16, PREC_CALL=18, PREC_GROUP=19, PREC_TOKEN=20


// extended id definition
lookup[0] = ()=>skip(c => isId(c) || c == 35 || c == 64).toLowerCase() // #, @ are parts of id

const string = q => (qc, c, str='') => {
  qc&&err('Unexpected string') // must not follow another token
  skip()
  while (c=cur.charCodeAt(idx), c-q) {
    if (c === BSLASH) skip(), c=skip(), str += escape[c] || c
    else str += skip()
  }
  skip()
  return new String(str)
},
escape = {n:'\n', r:'\r', t:'\t', b:'\b', f:'\f', v:'\v'}
token('"', PREC_TOKEN, string(DQUOTE))

// 'true', 20, a => a ? err() : ['',true],
// 'false', 20, a => a ? err() : ['',false],

const num = (a,fract) => a ? err() : new Number((
  a = skip(c => c>=_0 && c<=_9),
  cur[idx]==='.' && (fract = skip(c => c>=_0 && c<=_9)) && (a += fract),
  (a=+a)!=a?err('Bad number', a) : a
))
// .1
// '.',, a=>!a && num(),
// 0-9
Array(10).fill(0).forEach((_,i)=>lookup[(''+i).charCodeAt(0)] = num)



// topic reference
token('^', PREC_TOKEN, a => ['^'])

// end token
token('.', PREC_END, a => ['.', a])

// comments
token('//', PREC_TOKEN, (a, prec) => (skip(c => c >= SPACE), a||expr(prec)))

// sequences
const sequence = (op, prec) => token(op, prec, (a, b) => a && (b=expr(prec)) && (a[0] === op && a[2] ? (a.push(b), a) : [op,a,b]))
sequence(',', PREC_SEQ)
sequence('||', PREC_SOME)
sequence('&&', PREC_EVERY)
// sequence(';', PREC_SEQ, (a, b) => a && (b=expr(prec, PERIOD)) && (a[0] === op && a[2] ? (a.push(b), a) : [op,a,b]))
sequence(';', PREC_SEQ)

// binaries
const binary = (op, prec, right=prec<0?(prec=-prec,.1):0) => token(op, prec, (a, b) => a && (b=expr(prec-right)) && ([op,a,b]))
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
binary('~=', PREC_COMP )
binary('**', -PREC_EXP)

binary('=', -PREC_ASSIGN)

// a,b->b,a
binary('->', PREC_FUNC)
// a,b>-c
binary('>-', PREC_FUNC)
// a ?.. b
binary('?..', PREC_LOOP)


// unaries
const unary = (op, prec) => token(op, prec, a => !a && (a=expr(prec-1)) && [op, a])
unary('+', PREC_UNARY)
unary('-', PREC_UNARY)
unary('!', PREC_UNARY)
unary('~',  PREC_UNARY)

// &a
unary('&', PREC_UNARY)

// # "ab";
unary('#', PREC_ASSIGN)

// increments
// ++a → [++, a], a++ → [-,[++,a],1]
token('++', PREC_UNARY, a => a ? ['-',['++',a],['',1]] : ['++', expr(PREC_UNARY-1)])
token('--', PREC_UNARY, a => a ? ['+',['--',a],['',1]] : ['--', expr(PREC_UNARY-1)])

// ?:
token('?', PREC_COND, (a, b, c) => a && (b=expr(2,58)) && (c=expr(3), ['?', a, b, c]))

// a[b]
token('[', PREC_CALL,  a => a && ['[', a, expr(0,CBRACK)||err()])

// [a,b,c]
token('[', PREC_TOKEN, (a) => !a && ['[', expr(0,93)||''])
token(':', 1.1, (a, b) => (b=expr(1.1)||err(), [':',a,b]))

// a.b
token('.', PREC_CALL, (a,b) => a && (b=expr(PREC_CALL)) && ['.',a,b])

// (a,b,c), (a)
token('(', PREC_CALL, a => !a && ['(', expr(0,CPAREN)||err()])

// a(b,c,d), a()
token('(', PREC_CALL, a => a && ['(', a, expr(0,CPAREN)||''])

// ranges
token('..', PREC_CALL, a => ['..', a || '', expr(PREC_CALL)])


