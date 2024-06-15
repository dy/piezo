// parser converts syntax into AST/calltree
import parse, { lookup, skip, next, cur, idx, err, expr, token, unary, binary, nary, id } from 'subscript/parse'

import 'subscript/feature/call.js'
import 'subscript/feature/access.js'
import 'subscript/feature/group.js'
import 'subscript/feature/mult.js'
import 'subscript/feature/add.js'
import 'subscript/feature/increment.js'
import 'subscript/feature/bitwise.js'
import 'subscript/feature/compare.js'
import 'subscript/feature/logic.js'
import 'subscript/feature/assign.js'
import 'subscript/feature/string.js'
// import 'subscript/feature/ternary.js'
import 'subscript/feature/comment.js'
import 'subscript/feature/pow.js'
import 'subscript/feature/array.js'

import { FLOAT, INT } from './const.js'

export default (str) => (
  parse(str)
)

// char codes
const OPAREN = 40, CPAREN = 41, OBRACK = 91, CBRACK = 93, SPACE = 32, QUOTE = 39, DQUOTE = 34, PERIOD = 46, BSLASH = 92, _0 = 48, _9 = 57, COLON = 58, HASH = 35, AT = 64, PLUS = 43, MINUS = 45, GT = 62

// precedences
const PREC_RETURN = 8,//4, // x ? ^a,b : y
  PREC_STATE = 8,//4, // FIXME: *a,b,c, d=4 is confusing group
  PREC_LOOP = 9,//5, // <| |>
  PREC_IF = 20,//8,    // a ? b=c;  a = b?c;
  PREC_CLAMP = 105,//19, // pre-arithmetical: a+b*c <? 10; BUT a < b<?c, a << b<?c
  PREC_RANGE = 115,//22, // +a .. -b, a**2 .. b**3, a*2 .. b*3; BUT a + 2..b + 3
  PREC_TOKEN = 280 // [a,b] etc

// make id support #@
const isId = parse.id = char => id(char) || char === HASH

const isNum = c => c >= _0 && c <= _9
const num = (a) => {
  if (a) err(); // abc 023 - wrong

  let n = next(isNum), sep = '', d = '', unit; // numerator, separator, denominator, unit

  let c = cur.charCodeAt(idx + 1)

  if (numTypes[cur[idx]] && (isNum(c) || c === PLUS || c === MINUS)) {
    sep = skip()
    if (c === PLUS || c === MINUS) d = skip(), d += (next(isNum) || err('Bad number ' + n + sep + d))
    else d = next(isNum)
    if (sep && !d) err('Bad number ' + n + sep + d)
  }

  if (!n && !d) err('Bad number')

  // subscript takes 0/nullish value as wrong token, so we must wrap 0 into token
  // can be useful after (hopefully)
  let node = (numTypes[sep])(n, d);

  // parse units, eg. 1s
  if (unit = next(c => !isNum(c) && isId(c))) node.push(unit)

  // parse unit combinations, eg. 1h2m3s
  if (isNum(cur.charCodeAt(idx))) node.push(num())

  return node
}
const numTypes = {
  '': (n, d) => [INT, +n],
  '.': (n, d) => [FLOAT, Number(n + '.' + d)],
  'e': (n, d) => [FLOAT, Number(n + 'e' + d)],
  'x': (n, d) => [INT, parseInt(d, 16)],
  'b': (n, d) => [INT, parseInt(d, 2)]
}
// 0-9
for (let i = _0; i <= _9; i++) lookup[i] = num;
// .1
lookup[PERIOD] = a => !a && num();


// binary('%%', PREC_MULT)

binary('<?', PREC_CLAMP) // a <? b
binary('<=?', PREC_CLAMP) // a <? b

// a[..] |> #
nary('|>', PREC_LOOP)


// a..b, ..b, a..
token('..', PREC_RANGE, a => (['..', a, expr(PREC_RANGE)]))

// returns
token('^', PREC_TOKEN, (a, b) => !a && (b = expr(PREC_RETURN), b ? ['^', b] : ['^'])) // continue: ./
token('^^', PREC_TOKEN, (a, b) => (!a && (b = expr(PREC_RETURN), b ? ['^^', b] : ['^^']))) // break: ../
token('^^^', PREC_TOKEN, (a, b) => !a && (b = expr(PREC_RETURN), b ? ['^^^', b] : ['^^^'])) // return: ../

// #
// token('#', PREC_TOKEN, (a, b) => !a && '#')

// a.b
// NOTE: we don't parse expression to avoid 0..1 recognizing as 0[.1]
// NOTE: for now we disable prop access since we don't have aliases and just static index can be done via x[0]
// token('.', PREC_CALL, (a,b) => a && (b=next(isId)) && ['.', a, b])

// *a
unary('*', PREC_STATE)

// a?b - returns b if a is true, else returns a
binary('?', PREC_IF, true)

// ?: - we use modified ternary for our cases
token('?', PREC_IF, (a, b, c) => a && (b = expr(PREC_IF - 0.5)) && next(c => c === COLON) && (c = expr(PREC_IF - 0.5), ['?', a, b, c]))
