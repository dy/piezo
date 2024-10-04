var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// node_modules/subscript/src/const.js
var SPACE = 32;

// node_modules/subscript/src/parse.js
var idx;
var cur;
var parse = (s) => (idx = 0, cur = s, s = expr(), cur[idx] ? err() : s || "");
var err = (msg = "Bad syntax", lines = cur.slice(0, idx).split("\n"), last = lines.pop()) => {
  let before = cur.slice(idx - 108, idx).split("\n").pop();
  let after = cur.slice(idx, idx + 108).split("\n").shift();
  throw EvalError(`${msg} at ${lines.length}:${last.length} \`${idx >= 108 ? "\u2026" : ""}${before}\u2503${after}\``, "font-weight: bold");
};
var next = (is, from = idx, l) => {
  while (l = is(cur.charCodeAt(idx))) idx += l;
  return cur.slice(from, idx);
};
var skip = (n = 1, from = idx) => (idx += n, cur.slice(from, idx));
var expr = (prec = 0, end) => {
  let cc, token2, newNode, fn;
  while ((cc = space()) && // till not end
  // FIXME: extra work is happening here, when lookup bails out due to lower precedence -
  // it makes extra `space` call for parent exprs on the same character to check precedence again
  (newNode = ((fn = lookup[cc]) && fn(token2, prec)) ?? // if operator with higher precedence isn't found
  (!token2 && next(parse.id)))) token2 = newNode;
  if (end) cc == end ? idx++ : err();
  return token2;
};
var space = (cc) => {
  while ((cc = cur.charCodeAt(idx)) <= SPACE) idx++;
  return cc;
};
var id = parse.id = (c) => c >= 48 && c <= 57 || // 0..9
c >= 65 && c <= 90 || // A...Z
c >= 97 && c <= 122 || // a...z
c == 36 || c == 95 || // $, _,
c >= 192 && c != 215 && c != 247;
var lookup = [];
var token = (op2, prec = SPACE, map, c = op2.charCodeAt(0), l = op2.length, prev2 = lookup[c], word = op2.toUpperCase() !== op2) => lookup[c] = (a, curPrec, curOp, from = idx) => (curOp ? op2 == curOp : (l < 2 || cur.substr(idx, l) == op2) && (curOp = op2)) && curPrec < prec && // matches precedence AFTER operator matched
!(word && parse.id(cur.charCodeAt(idx + l))) && // finished word, not part of bigger word
(idx += l, map(a) || (idx = from, !prev2 && err())) || prev2?.(a, curPrec, curOp);
var binary = (op2, prec, right = false) => token(op2, prec, (a, b) => a && (b = expr(prec - (right ? 0.5 : 0))) && [op2, a, b]);
var unary = (op2, prec, post) => token(op2, prec, (a) => post ? a && [op2, a] : !a && (a = expr(prec - 0.5)) && [op2, a]);
var nary = (op2, prec, skips) => {
  token(
    op2,
    prec,
    (a, b) => (b = expr(prec), a?.[0] !== op2 && (a = [op2, a]), // if beginning of sequence - init node
    b?.[0] === op2 ? a.push(...b.slice(1)) : a.push(b), // comments can return same-token expr
    a)
  );
};
var group = (op2, prec) => token(op2[0], prec, (a) => !a && [op2, expr(0, op2.charCodeAt(1))]);
var access = (op2, prec) => token(op2[0], prec, (a) => a && [op2[0], a, expr(0, op2.charCodeAt(1))]);
var parse_default = parse;

// src/parse.js
var INT = "int";
var FLOAT = "flt";
var parse_default2 = parse_default;
var SPACE2 = 32;
var QUOTE = 39;
var DQUOTE = 34;
var PERIOD = 46;
var BSLASH = 92;
var _0 = 48;
var _1 = 49;
var _8 = 56;
var _9 = 57;
var _A = 65;
var _F = 70;
var _a = 97;
var _f = 102;
var _E = 69;
var _e = 101;
var _b = 98;
var _o = 111;
var _x = 120;
var COLON = 58;
var HASH = 35;
var PREC_SEMI = 1;
var PREC_RETURN = 4;
var PREC_SEQ = 6;
var PREC_IF = 8;
var PREC_PIPE = 8;
var PREC_ASSIGN = 8.25;
var PREC_LOR = 11;
var PREC_LAND = 12;
var PREC_BOR = 13;
var PREC_XOR = 14;
var PREC_BAND = 15;
var PREC_EQ = 16;
var PREC_COMP = 17;
var PREC_SHIFT = 18;
var PREC_CLAMP = 19;
var PREC_ADD = 20;
var PREC_RANGE = 22;
var PREC_MULT = 23;
var PREC_POW = 24;
var PREC_UNARY = 26;
var PREC_CALL = 27;
var PREC_TOKEN = 28;
var isId = parse_default.id = (char) => id(char) || char === HASH;
var isNum = (c) => c >= _0 && c <= _9;
var num = (a) => {
  if (a) err();
  let n, t = INT, unit, node;
  n = next((c) => c === _0 || c === _x || c === _o || c === _b);
  if (n === "0x") n = parseInt(next((c) => isNum(c) || c >= _a && c <= _f || c >= _A && c <= _F), 16);
  else if (n === "0o") n = parseInt(next((c) => c >= _0 && c <= _8), 8);
  else if (n === "0b") n = parseInt(next((c) => c === _1 || c === _0), 2);
  else {
    n += next(isNum);
    if (cur.charCodeAt(idx) === PERIOD && isNum(cur.charCodeAt(idx + 1))) n += skip() + next(isNum), t = FLOAT;
    if (cur.charCodeAt(idx) === _E || cur.charCodeAt(idx) === _e) n += skip(2) + next(isNum);
    n = +n;
    if (n != n) err(`Bad number ${n}`);
  }
  node = [t, n];
  if (unit = next((c) => !isNum(c) && isId(c))) node.push(unit);
  if (isNum(cur.charCodeAt(idx))) node.push(num());
  return node;
};
lookup[PERIOD] = (a) => !a && num();
for (let i = _0; i <= _9; i++) lookup[i] = num;
var escape = { n: "\n", r: "\r", t: "	", b: "\b", f: "\f", v: "\v" };
var string = (q) => (qc, c, str3 = "") => {
  qc && err("Unexpected string");
  skip();
  while (c = cur.charCodeAt(idx), c - q) {
    if (c === BSLASH) skip(), c = skip(), str3 += escape[c] || c;
    else str3 += skip();
  }
  skip() || err("Bad string");
  return [, str3];
};
lookup[DQUOTE] = string(DQUOTE);
lookup[QUOTE] = string(QUOTE);
access("()", PREC_CALL);
access("[]", PREC_CALL);
group("()", PREC_CALL);
group("[]", PREC_TOKEN);
nary(",", PREC_SEQ, true);
nary(";", PREC_SEMI, true);
binary("*", PREC_MULT);
binary("/", PREC_MULT);
binary("%", PREC_MULT);
unary("*", PREC_UNARY);
binary("+", PREC_ADD);
binary("-", PREC_ADD);
unary("+", PREC_UNARY);
unary("-", PREC_UNARY);
token("++", PREC_UNARY, (a) => a ? ["++", a] : ["+=", expr(PREC_UNARY - 1), [INT, 1]]);
token("--", PREC_UNARY, (a) => a ? ["--", a] : ["-=", expr(PREC_UNARY - 1), [INT, 1]]);
unary("~", PREC_UNARY);
binary("~", PREC_CLAMP);
binary("|", PREC_BOR);
binary("&", PREC_BAND);
binary("^", PREC_XOR);
binary("||", PREC_LOR);
binary("&&", PREC_LAND);
unary("!", PREC_UNARY);
binary("=", PREC_ASSIGN, true);
binary("*=", PREC_ASSIGN, true);
binary("/=", PREC_ASSIGN, true);
binary("%=", PREC_ASSIGN, true);
binary("+=", PREC_ASSIGN, true);
binary("-=", PREC_ASSIGN, true);
binary("~=", PREC_ASSIGN, true);
binary("==", PREC_EQ);
binary("!=", PREC_EQ);
binary(">", PREC_COMP);
binary("<", PREC_COMP);
binary(">=", PREC_COMP);
binary("<=", PREC_COMP);
binary(">>", PREC_SHIFT);
binary("<<", PREC_SHIFT);
binary(">>>", PREC_SHIFT);
binary("<<<", PREC_SHIFT);
binary(">>=", PREC_SHIFT);
binary("<<=", PREC_SHIFT);
binary(">>>=", PREC_SHIFT);
binary("<<<=", PREC_SHIFT);
binary("**", PREC_POW, true);
binary("%%", PREC_MULT, true);
binary("~<", PREC_CLAMP);
binary("~/", PREC_CLAMP);
binary("~*", PREC_CLAMP);
binary("~//", PREC_CLAMP);
binary("~**", PREC_CLAMP);
nary("|>", PREC_PIPE);
token("..", PREC_RANGE, (a) => ["..", a, expr(PREC_RANGE)]);
token("./", PREC_TOKEN, (a, b) => !a && (b = expr(PREC_RETURN), b ? ["./", b] : ["./"]));
token("../", PREC_TOKEN, (a, b) => !a && (b = expr(PREC_RETURN), b ? ["../", b] : ["../"]));
token("/", PREC_TOKEN, (a, b) => !a && (b = expr(PREC_RETURN), b ? ["/", b] : ["/"]));
unary("^", PREC_RETURN);
binary("?", PREC_IF, true);
token("?", PREC_IF, (a, b, c) => a && (b = expr(PREC_IF - 0.5)) && next((c2) => c2 === COLON) && (c = expr(PREC_IF - 0.5), ["?:", a, b, c]));
token(";;", PREC_TOKEN, (a, prec) => (next((c) => c >= SPACE2), a || expr(prec) || []));

// node_modules/watr/src/encode.js
var encode_exports = {};
__export(encode_exports, {
  f32: () => f32,
  f64: () => f64,
  i16: () => i16,
  i32: () => i32,
  i64: () => i64,
  i8: () => i8,
  uleb: () => uleb
});
var uleb = (n, buffer = []) => {
  if (typeof n === "string") n = i32.parse(n);
  let byte = n & 127;
  n = n >>> 7;
  if (n === 0) {
    buffer.push(byte);
    return buffer;
  } else {
    buffer.push(byte | 128);
    return uleb(n, buffer);
  }
};
function i32(n, buffer = []) {
  if (typeof n === "string") n = i32.parse(n);
  while (true) {
    const byte = Number(n & 127);
    n >>= 7;
    if (n === 0 && (byte & 64) === 0 || n === -1 && (byte & 64) !== 0) {
      buffer.push(byte);
      break;
    }
    buffer.push(byte | 128);
  }
  return buffer;
}
var i8 = i32;
var i16 = i32;
i32.parse = (n) => parseInt(n.replaceAll("_", ""));
function i64(n, buffer = []) {
  if (typeof n === "string") n = i64.parse(n);
  while (true) {
    const byte = Number(n & 0x7Fn);
    n >>= 7n;
    if (n === 0n && (byte & 64) === 0 || n === -1n && (byte & 64) !== 0) {
      buffer.push(byte);
      break;
    }
    buffer.push(byte | 128);
  }
  return buffer;
}
i64.parse = (n) => {
  n = n.replaceAll("_", "");
  n = n[0] === "-" ? -BigInt(n.slice(1)) : BigInt(n);
  byteView.setBigInt64(0, n);
  return n = byteView.getBigInt64(0);
};
var byteView = new DataView(new BigInt64Array(1).buffer);
var F32_SIGN = 2147483648;
var F32_NAN = 2139095040;
function f32(input, value, idx2) {
  if (~(idx2 = input.indexOf("nan:"))) {
    value = i32.parse(input.slice(idx2 + 4));
    value |= F32_NAN;
    if (input[0] === "-") value |= F32_SIGN;
    byteView.setInt32(0, value);
  } else {
    value = typeof input === "string" ? f32.parse(input) : input;
    byteView.setFloat32(0, value);
  }
  return [
    byteView.getUint8(3),
    byteView.getUint8(2),
    byteView.getUint8(1),
    byteView.getUint8(0)
  ];
}
var F64_SIGN = 0x8000000000000000n;
var F64_NAN = 0x7ff0000000000000n;
function f64(input, value, idx2) {
  if (~(idx2 = input.indexOf("nan:"))) {
    value = i64.parse(input.slice(idx2 + 4));
    value |= F64_NAN;
    if (input[0] === "-") value |= F64_SIGN;
    byteView.setBigInt64(0, value);
  } else {
    value = typeof input === "string" ? f64.parse(input) : input;
    byteView.setFloat64(0, value);
  }
  return [
    byteView.getUint8(7),
    byteView.getUint8(6),
    byteView.getUint8(5),
    byteView.getUint8(4),
    byteView.getUint8(3),
    byteView.getUint8(2),
    byteView.getUint8(1),
    byteView.getUint8(0)
  ];
}
f32.parse = f64.parse = (input) => {
  if (input.includes("nan")) return input[0] === "-" ? NaN : NaN;
  if (input.includes("inf")) return input[0] === "-" ? -Infinity : Infinity;
  input = input.replaceAll("_", "");
  if (input.includes("0x")) {
    let [sig, exp] = input.split(/p/i), [dec, fract] = sig.split("."), sign = dec[0] === "-" ? -1 : 1;
    sig = parseInt(dec) * sign + (fract ? parseInt(fract, 16) / 16 ** fract.length : 0);
    return sign * (exp ? sig * 2 ** parseInt(exp, 10) : sig);
  }
  return parseFloat(input);
};

// node_modules/watr/src/const.js
var OP = [
  "unreachable",
  "nop",
  "block",
  "loop",
  "if",
  "else",
  "then",
  ,
  ,
  ,
  ,
  "end",
  "br",
  "br_if",
  "br_table",
  "return",
  "call",
  "call_indirect",
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  "drop",
  "select",
  ,
  ,
  ,
  ,
  "local.get",
  "local.set",
  "local.tee",
  "global.get",
  "global.set",
  ,
  ,
  ,
  "i32.load",
  "i64.load",
  "f32.load",
  "f64.load",
  "i32.load8_s",
  "i32.load8_u",
  "i32.load16_s",
  "i32.load16_u",
  "i64.load8_s",
  "i64.load8_u",
  "i64.load16_s",
  "i64.load16_u",
  "i64.load32_s",
  "i64.load32_u",
  "i32.store",
  "i64.store",
  "f32.store",
  "f64.store",
  "i32.store8",
  "i32.store16",
  "i64.store8",
  "i64.store16",
  "i64.store32",
  "memory.size",
  "memory.grow",
  "i32.const",
  "i64.const",
  "f32.const",
  "f64.const",
  "i32.eqz",
  "i32.eq",
  "i32.ne",
  "i32.lt_s",
  "i32.lt_u",
  "i32.gt_s",
  "i32.gt_u",
  "i32.le_s",
  "i32.le_u",
  "i32.ge_s",
  "i32.ge_u",
  "i64.eqz",
  "i64.eq",
  "i64.ne",
  "i64.lt_s",
  "i64.lt_u",
  "i64.gt_s",
  "i64.gt_u",
  "i64.le_s",
  "i64.le_u",
  "i64.ge_s",
  "i64.ge_u",
  "f32.eq",
  "f32.ne",
  "f32.lt",
  "f32.gt",
  "f32.le",
  "f32.ge",
  "f64.eq",
  "f64.ne",
  "f64.lt",
  "f64.gt",
  "f64.le",
  "f64.ge",
  "i32.clz",
  "i32.ctz",
  "i32.popcnt",
  "i32.add",
  "i32.sub",
  "i32.mul",
  "i32.div_s",
  "i32.div_u",
  "i32.rem_s",
  "i32.rem_u",
  "i32.and",
  "i32.or",
  "i32.xor",
  "i32.shl",
  "i32.shr_s",
  "i32.shr_u",
  "i32.rotl",
  "i32.rotr",
  "i64.clz",
  "i64.ctz",
  "i64.popcnt",
  "i64.add",
  "i64.sub",
  "i64.mul",
  "i64.div_s",
  "i64.div_u",
  "i64.rem_s",
  "i64.rem_u",
  "i64.and",
  "i64.or",
  "i64.xor",
  "i64.shl",
  "i64.shr_s",
  "i64.shr_u",
  "i64.rotl",
  "i64.rotr",
  "f32.abs",
  "f32.neg",
  "f32.ceil",
  "f32.floor",
  "f32.trunc",
  "f32.nearest",
  "f32.sqrt",
  "f32.add",
  "f32.sub",
  "f32.mul",
  "f32.div",
  "f32.min",
  "f32.max",
  "f32.copysign",
  "f64.abs",
  "f64.neg",
  "f64.ceil",
  "f64.floor",
  "f64.trunc",
  "f64.nearest",
  "f64.sqrt",
  "f64.add",
  "f64.sub",
  "f64.mul",
  "f64.div",
  "f64.min",
  "f64.max",
  "f64.copysign",
  "i32.wrap_i64",
  "i32.trunc_f32_s",
  "i32.trunc_f32_u",
  "i32.trunc_f64_s",
  "i32.trunc_f64_u",
  "i64.extend_i32_s",
  "i64.extend_i32_u",
  "i64.trunc_f32_s",
  "i64.trunc_f32_u",
  "i64.trunc_f64_s",
  "i64.trunc_f64_u",
  "f32.convert_i32_s",
  "f32.convert_i32_u",
  "f32.convert_i64_s",
  "f32.convert_i64_u",
  "f32.demote_f64",
  "f64.convert_i32_s",
  "f64.convert_i32_u",
  "f64.convert_i64_s",
  "f64.convert_i64_u",
  "f64.promote_f32",
  "i32.reinterpret_f32",
  "i64.reinterpret_f64",
  "f32.reinterpret_i32",
  "f64.reinterpret_i64",
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  ,
  "memory.init",
  "data.drop",
  "memory.copy",
  "memory.fill",
  "table.init",
  "elem.drop",
  "table.copy",
  ,
  // ref: https://github.com/WebAssembly/simd/blob/master/proposals/simd/BinarySIMD.md
  "v128.load",
  "v128.load8x8_s",
  "v128.load8x8_u",
  "v128.load16x4_s",
  "v128.load16x4_u",
  "v128.load32x2_s",
  "v128.load32x2_u",
  "v128.load8_splat",
  "v128.load16_splat",
  "v128.load32_splat",
  "v128.load64_splat",
  "v128.store",
  "v128.const",
  "i8x16.shuffle",
  "i8x16.swizzle",
  "i8x16.splat",
  "i16x8.splat",
  "i32x4.splat",
  "i64x2.splat",
  "f32x4.splat",
  "f64x2.splat",
  "i8x16.extract_lane_s",
  "i8x16.extract_lane_u",
  "i8x16.replace_lane",
  "i16x8.extract_lane_s",
  "i16x8.extract_lane_u",
  "i16x8.replace_lane",
  "i32x4.extract_lane",
  "i32x4.replace_lane",
  "i64x2.extract_lane",
  "i64x2.replace_lane",
  "f32x4.extract_lane",
  "f32x4.replace_lane",
  "f64x2.extract_lane",
  "f64x2.replace_lane",
  "i8x16.eq",
  "i8x16.ne",
  "i8x16.lt_s",
  "i8x16.lt_u",
  "i8x16.gt_s",
  "i8x16.gt_u",
  "i8x16.le_s",
  "i8x16.le_u",
  "i8x16.ge_s",
  "i8x16.ge_u",
  "i16x8.eq",
  "i16x8.ne",
  "i16x8.lt_s",
  "i16x8.lt_u",
  "i16x8.gt_s",
  "i16x8.gt_u",
  "i16x8.le_s",
  "i16x8.le_u",
  "i16x8.ge_s",
  "i16x8.ge_u",
  "i32x4.eq",
  "i32x4.ne",
  "i32x4.lt_s",
  "i32x4.lt_u",
  "i32x4.gt_s",
  "i32x4.gt_u",
  "i32x4.le_s",
  "i32x4.le_u",
  "i32x4.ge_s",
  "i32x4.ge_u",
  "f32x4.eq",
  "f32x4.ne",
  "f32x4.lt",
  "f32x4.gt",
  "f32x4.le",
  "f32x4.ge",
  "f64x2.eq",
  "f64x2.ne",
  "f64x2.lt",
  "f64x2.gt",
  "f64x2.le",
  "f64x2.ge",
  "v128.not",
  "v128.and",
  "v128.andnot",
  "v128.or",
  "v128.xor",
  "v128.bitselect",
  "v128.any_true",
  "v128.load8_lane",
  "v128.load16_lane",
  "v128.load32_lane",
  "v128.load64_lane",
  "v128.store8_lane",
  "v128.store16_lane",
  "v128.store32_lane",
  "v128.store64_lane",
  "v128.load32_zero",
  "v128.load64_zero",
  "f32x4.demote_f64x2_zero",
  "f64x2.promote_low_f32x4",
  "i8x16.abs",
  "i8x16.neg",
  "i8x16.popcnt",
  "i8x16.all_true",
  "i8x16.bitmask",
  "i8x16.narrow_i16x8_s",
  "i8x16.narrow_i16x8_u",
  "f32x4.ceil",
  "f32x4.floor",
  "f32x4.trunc",
  "f32x4.nearest",
  "i8x16.shl",
  "i8x16.shr_s",
  "i8x16.shr_u",
  "i8x16.add",
  "i8x16.add_sat_s",
  "i8x16.add_sat_u",
  "i8x16.sub",
  "i8x16.sub_sat_s",
  "i8x16.sub_sat_u",
  "f64x2.ceil",
  "f64x2.floor",
  "i8x16.min_s",
  "i8x16.min_u",
  "i8x16.max_s",
  "i8x16.max_u",
  "f64x2.trunc",
  "i8x16.avgr_u",
  "i16x8.extadd_pairwise_i8x16_s",
  "i16x8.extadd_pairwise_i8x16_u",
  "i32x4.extadd_pairwise_i16x8_s",
  "i32x4.extadd_pairwise_i16x8_u",
  "i16x8.abs",
  "i16x8.neg",
  "i16x8.q15mulr_sat_s",
  "i16x8.all_true",
  "i16x8.bitmask",
  "i16x8.narrow_i32x4_s",
  "i16x8.narrow_i32x4_u",
  "i16x8.extend_low_i8x16_s",
  "i16x8.extend_high_i8x16_s",
  "i16x8.extend_low_i8x16_u",
  "i16x8.extend_high_i8x16_u",
  "i16x8.shl",
  "i16x8.shr_s",
  "i16x8.shr_u",
  "i16x8.add",
  "i16x8.add_sat_s",
  "i16x8.add_sat_u",
  "i16x8.sub",
  "i16x8.sub_sat_s",
  "i16x8.sub_sat_u",
  "f64x2.nearest",
  "i16x8.mul",
  "i16x8.min_s",
  "i16x8.min_u",
  "i16x8.max_s",
  "i16x8.max_u",
  ,
  "i16x8.avgr_u",
  "i16x8.extmul_low_i8x16_s",
  "i16x8.extmul_high_i8x16_s",
  "i16x8.extmul_low_i8x16_u",
  "i16x8.extmul_high_i8x16_u",
  "i32x4.abs",
  "i32x4.neg",
  ,
  "i32x4.all_true",
  "i32x4.bitmask",
  ,
  ,
  "i32x4.extend_low_i16x8_s",
  "i32x4.extend_high_i16x8_s",
  "i32x4.extend_low_i16x8_u",
  "i32x4.extend_high_i16x8_u",
  "i32x4.shl",
  "i32x4.shr_s",
  "i32x4.shr_u",
  "i32x4.add",
  ,
  ,
  "i32x4.sub",
  ,
  ,
  ,
  "i32x4.mul",
  "i32x4.min_s",
  "i32x4.min_u",
  "i32x4.max_s",
  "i32x4.max_u",
  "i32x4.dot_i16x8_s",
  ,
  "i32x4.extmul_low_i16x8_s",
  "i32x4.extmul_high_i16x8_s",
  "i32x4.extmul_low_i16x8_u",
  "i32x4.extmul_high_i16x8_u",
  "i64x2.abs",
  "i64x2.neg",
  ,
  "i64x2.all_true",
  "i64x2.bitmask",
  ,
  ,
  "i64x2.extend_low_i32x4_s",
  "i64x2.extend_high_i32x4_s",
  "i64x2.extend_low_i32x4_u",
  "i64x2.extend_high_i32x4_u",
  "i64x2.shl",
  "i64x2.shr_s",
  "i64x2.shr_u",
  "i64x2.add",
  ,
  ,
  "i64x2.sub",
  ,
  ,
  ,
  "i64x2.mul",
  "i64x2.eq",
  "i64x2.ne",
  "i64x2.lt_s",
  "i64x2.gt_s",
  "i64x2.le_s",
  "i64x2.ge_s",
  "i64x2.extmul_low_i32x4_s",
  "i64x2.extmul_high_i32x4_s",
  "i64x2.extmul_low_i32x4_u",
  "i64x2.extmul_high_i32x4_u",
  "f32x4.abs",
  "f32x4.neg",
  ,
  "f32x4.sqrt",
  "f32x4.add",
  "f32x4.sub",
  "f32x4.mul",
  "f32x4.div",
  "f32x4.min",
  "f32x4.max",
  "f32x4.pmin",
  "f32x4.pmax",
  "f64x2.abs",
  "f64x2.neg",
  ,
  "f64x2.sqrt",
  "f64x2.add",
  "f64x2.sub",
  "f64x2.mul",
  "f64x2.div",
  "f64x2.min",
  "f64x2.max",
  "f64x2.pmin",
  "f64x2.pmax",
  "i32x4.trunc_sat_f32x4_s",
  "i32x4.trunc_sat_f32x4_u",
  "f32x4.convert_i32x4_s",
  "f32x4.convert_i32x4_u",
  "i32x4.trunc_sat_f64x2_s_zero",
  "i32x4.trunc_sat_f64x2_u_zero",
  "f64x2.convert_low_i32x4_s",
  "f64x2.convert_low_i32x4_u"
];
var SECTION = { type: 1, import: 2, func: 3, table: 4, memory: 5, global: 6, export: 7, start: 8, elem: 9, code: 10, data: 11 };
var TYPE = { i32: 127, i64: 126, f32: 125, f64: 124, void: 64, func: 96, funcref: 112, v128: 123 };
var KIND = { func: 0, table: 1, memory: 2, global: 3 };
var ALIGN = {
  "i32.load": 4,
  "i64.load": 8,
  "f32.load": 4,
  "f64.load": 8,
  "i32.load8_s": 1,
  "i32.load8_u": 1,
  "i32.load16_s": 2,
  "i32.load16_u": 2,
  "i64.load8_s": 1,
  "i64.load8_u": 1,
  "i64.load16_s": 2,
  "i64.load16_u": 2,
  "i64.load32_s": 4,
  "i64.load32_u": 4,
  "i32.store": 4,
  "i64.store": 8,
  "f32.store": 4,
  "f64.store": 8,
  "i32.store8": 1,
  "i32.store16": 2,
  "i64.store8": 1,
  "i64.store16": 2,
  "i64.store32": 4,
  "v128.load": 16,
  "v128.load8x8_s": 8,
  "v128.load8x8_u": 8,
  "v128.load16x4_s": 8,
  "v128.load16x4_u": 8,
  "v128.load32x2_s": 8,
  "v128.load32x2_u": 8,
  "v128.load8_splat": 1,
  "v128.load16_splat": 2,
  "v128.load32_splat": 4,
  "v128.load64_splat": 8,
  "v128.store": 16,
  "v128.load": 16,
  "v128.load8_lane": 1,
  "v128.load16_lane": 2,
  "v128.load32_lane": 4,
  "v128.load64_lane": 8,
  "v128.store8_lane": 1,
  "v128.store16_lane": 2,
  "v128.store32_lane": 4,
  "v128.store64_lane": 8,
  "v128.load32_zero": 4,
  "v128.load64_zero": 8
};

// node_modules/watr/src/parse.js
var OPAREN = 40;
var CPAREN = 41;
var SPACE3 = 32;
var DQUOTE2 = 34;
var SEMIC = 59;
var parse_default3 = (str3) => {
  let i = 0, level = [], buf = "";
  const commit = () => buf && (level.push(buf), buf = "");
  const parseLevel = () => {
    for (let c, root; i < str3.length; ) {
      c = str3.charCodeAt(i);
      if (c === DQUOTE2) commit(), buf = str3.slice(i++, i = str3.indexOf('"', i) + 1), commit();
      else if (c === OPAREN) {
        if (str3.charCodeAt(i + 1) === SEMIC) i = str3.indexOf(";)", i) + 2;
        else commit(), i++, (root = level).push(level = []), parseLevel(), level = root;
      } else if (c === SEMIC) i = str3.indexOf("\n", i) + 1 || str3.length;
      else if (c <= SPACE3) commit(), i++;
      else if (c === CPAREN) return commit(), i++;
      else buf += str3[i++];
    }
    commit();
  };
  parseLevel();
  return level.length > 1 ? level : level[0];
};

// node_modules/watr/src/util.js
var err2 = (text) => {
  throw Error(text);
};

// node_modules/watr/src/compile.js
var compile_default = (nodes) => {
  if (typeof nodes === "string") nodes = parse_default3(nodes);
  let sections = {
    type: [],
    import: [],
    func: [],
    table: [],
    memory: [],
    global: [],
    export: [],
    start: [],
    elem: [],
    code: [],
    data: []
  }, binary2 = [
    0,
    97,
    115,
    109,
    // magic
    1,
    0,
    0,
    0
    // version
  ];
  if (typeof nodes[0] === "string" && nodes[0] !== "module") nodes = [nodes];
  nodes = nodes.map((node) => {
    if (node[2]?.[0] === "import") {
      let [kind, name, imp, ...args] = node;
      return [...imp, [kind, name, ...args]];
    } else if (node[1]?.[0] === "import") {
      let [kind, imp, ...args] = node;
      return [...imp, [kind, ...args]];
    }
    return node;
  });
  let order = ["type", "import", "table", "memory", "global", "func", "export", "start", "elem", "data"], postcall = [];
  for (let name of order) {
    let remaining = [];
    for (let node of nodes) {
      node[0] === name ? postcall.push(build[name](node, sections)) : remaining.push(node);
    }
    nodes = remaining;
  }
  for (let cb of postcall) cb?.();
  for (let name in sections) {
    let items = sections[name];
    if (items.importc) items = items.slice(items.importc);
    if (!items.length) continue;
    let sectionCode = SECTION[name], bytes = [];
    if (sectionCode !== 8) bytes.push(items.length);
    for (let item of items) bytes.push(...item);
    binary2.push(sectionCode, ...uleb(bytes.length), ...bytes);
  }
  return new Uint8Array(binary2);
};
var build = {
  // (type $name? (func (param $x i32) (param i64 i32) (result i32 i64)))
  // signature part is identical to function
  // FIXME: handle non-function types
  type([, typeName, [kind, ...sig]], ctx) {
    if (kind !== "func") err2(`Unknown type kind '${kind}'`);
    const [idx2] = consumeType(sig, ctx);
    if (typeName) ctx.type[typeName] = idx2;
  },
  // (func $name? ...params result ...body)
  func([, ...body], ctx) {
    let locals2 = [], blocks = [];
    if (body[0]?.[0] === "$") ctx.func[body.shift()] = ctx.func.length;
    if (body[0]?.[0] === "export") build.export([...body.shift(), ["func", ctx.func.length]], ctx);
    let [typeIdx, params, result] = consumeType(body, ctx);
    ctx.func.push([typeIdx]);
    while (body[0]?.[0] === "local") {
      let [, ...types] = body.shift(), name;
      if (types[0][0] === "$")
        params[name = types.shift()] ? err2("Ambiguous name " + name) : locals2[name] = params.length + locals2.length;
      locals2.push(...types.map((t) => TYPE[t]));
    }
    let locTypes = locals2.reduce((a, type2) => (type2 == a[a.length - 1] ? a[a.length - 2]++ : a.push(1, type2), a), []);
    const consume = (nodes, out = []) => {
      if (!nodes?.length) return out;
      let op2 = nodes.shift(), opCode, args = nodes, immed, id2, group2;
      if (group2 = Array.isArray(op2)) {
        args = [...op2];
        opCode = OP.indexOf(op2 = args.shift());
      } else opCode = OP.indexOf(op2);
      if (opCode >= 268) {
        opCode -= 268;
        immed = [253, ...uleb(opCode)];
        if (opCode <= 11) {
          const o = consumeParams(args);
          immed.push(Math.log2(o.align ?? ALIGN[op2]), ...uleb(o.offset ?? 0));
        } else if (opCode >= 84 && opCode <= 93) {
          const o = consumeParams(args);
          immed.push(Math.log2(o.align ?? ALIGN[op2]), ...uleb(o.offset ?? 0));
          if (opCode <= 91) immed.push(...uleb(args.shift()));
        } else if (opCode === 13) {
          for (let i = 0; i < 16; i++) immed.push(i32.parse(args.shift()));
        } else if (opCode === 12) {
          args.unshift(op2);
          immed = consumeConst(args, ctx);
        } else if (opCode >= 21 && opCode <= 34) {
          immed.push(...uleb(args.shift()));
        }
        opCode = null;
      } else if (opCode >= 252) {
        immed = [252, ...uleb(opCode -= 252)];
        if (!(opCode & 2)) immed.push(...uleb(args.shift()));
        else immed.push(0);
        if (!(opCode & 1)) immed.push(0);
        opCode = null;
      } else if (opCode >= 69) {
      } else if (opCode >= 40 && opCode <= 62) {
        let o = consumeParams(args);
        immed = [Math.log2(o.align ?? ALIGN[op2]), ...uleb(o.offset ?? 0)];
      } else if (opCode >= 65 && opCode <= 68) {
        immed = encode_exports[op2.split(".")[0]](args.shift());
      } else if (opCode >= 32 && opCode <= 34) {
        immed = uleb(args[0]?.[0] === "$" ? params[id2 = args.shift()] || locals2[id2] : args.shift());
      } else if (opCode == 35 || opCode == 36) {
        immed = uleb(args[0]?.[0] === "$" ? ctx.global[args.shift()] : args.shift());
      } else if (opCode == 16) {
        let fnName = args.shift();
        immed = uleb(id2 = fnName[0] === "$" ? ctx.func[fnName] ?? err2("Unknown function `" + fnName + "`") : fnName);
      } else if (opCode == 17) {
        let typeId = args.shift()[1];
        typeId = typeId[0] === "$" ? ctx.type[typeId] : typeId;
        immed = uleb(typeId), immed.push(0);
      } else if (opCode == 63 || opCode == 64) {
        immed = [0];
      } else if (opCode === 2 || opCode === 3 || opCode === 4) {
        blocks.push(opCode);
        if (opCode < 4 && args[0]?.[0] === "$") blocks[args.shift()] = blocks.length;
        if (args[0]?.[0] === "result" && args[0].length < 3) {
          let [, type2] = args.shift();
          immed = [TYPE[type2]];
        } else if (args[0]?.[0] === "result" || args[0]?.[0] === "param") {
          let [typeId] = consumeType(args, ctx);
          immed = [typeId];
        } else {
          immed = [TYPE.void];
        }
        if (group2) {
          nodes.unshift("end");
          if (opCode < 4) while (args.length) nodes.unshift(args.pop());
          else if (args.length < 3) nodes.unshift(args.pop());
          else {
            nodes.unshift(args.pop());
            if (nodes[0][0] !== "else") nodes.unshift("else");
            else if (nodes[0].length < 2) nodes.shift();
            nodes.unshift(args.pop());
          }
        }
      } else if (opCode === 5) {
        if (group2) while (args.length) nodes.unshift(args.pop());
      } else if (opCode === 6) {
        opCode = null;
      } else if (opCode == 11) blocks.pop();
      else if (opCode == 12 || opCode == 13) {
        immed = uleb(args[0]?.[0] === "$" ? blocks.length - blocks[args.shift()] : args.shift());
      } else if (opCode == 14) {
        immed = [];
        while (!Array.isArray(args[0])) id2 = args.shift(), immed.push(...uleb(id2[0][0] === "$" ? blocks.length - blocks[id2] : id2));
        immed.unshift(...uleb(immed.length - 1));
      } else if (opCode < 0) err2(`Unknown instruction \`${op2}\``);
      if (group2) {
        while (args.length) consume(args, out);
      }
      if (opCode) out.push(opCode);
      if (immed) out.push(...immed);
    };
    return () => {
      const bytes = [];
      while (body.length) consume(body, bytes);
      ctx.code.push([...uleb(bytes.length + 2 + locTypes.length), ...uleb(locTypes.length >> 1), ...locTypes, ...bytes, 11]);
    };
  },
  // (memory min max shared)
  // (memory $name min max shared)
  // (memory (export "mem") 5)
  memory([, ...parts], ctx) {
    if (parts[0][0] === "$") ctx.memory[parts.shift()] = ctx.memory.length;
    if (parts[0][0] === "export") build.export([...parts.shift(), ["memory", ctx.memory.length]], ctx);
    ctx.memory.push(range(parts));
  },
  // (global i32 (i32.const 42))
  // (global $id i32 (i32.const 42))
  // (global $id (mut i32) (i32.const 42))
  global([, ...args], ctx) {
    let name = args[0][0] === "$" && args.shift();
    if (name) ctx.global[name] = ctx.global.length;
    let [type2, [...init]] = args, mut = type2[0] === "mut" ? 1 : 0;
    ctx.global.push([TYPE[mut ? type2[1] : type2], mut, ...consumeConst(init, ctx), 11]);
  },
  // (table 1 2? funcref)
  // (table $name 1 2? funcref)
  table([, ...args], ctx) {
    let name = args[0][0] === "$" && args.shift();
    if (name) ctx.table[name] = ctx.table.length;
    let lims = range(args);
    ctx.table.push([TYPE[args.pop()], ...lims]);
  },
  // (elem (i32.const 0) $f1 $f2), (elem (global.get 0) $f1 $f2)
  elem([, [...offset], ...elems], ctx) {
    const tableIdx = 0;
    ctx.elem.push([tableIdx, ...consumeConst(offset, ctx), 11, ...uleb(elems.length), ...elems.flatMap((el) => uleb(el[0] === "$" ? ctx.func[el] : el))]);
  },
  //  (export "name" (kind $name|idx))
  export([, name, [kind, idx2]], ctx) {
    if (idx2[0] === "$") idx2 = ctx[kind][idx2];
    ctx.export.push([...str2(name), KIND[kind], ...uleb(idx2)]);
  },
  // (import "math" "add" (func $add (param i32 i32 externref) (result i32)))
  // (import "js" "mem" (memory 1))
  // (import "js" "mem" (memory $name 1))
  // (import "js" "v" (global $name (mut f64)))
  import([, mod, field, ref], ctx) {
    let details, [kind, ...parts] = ref, name = parts[0]?.[0] === "$" && parts.shift();
    if (kind === "func") {
      if (name) ctx.func[name] = ctx.func.length;
      let [typeIdx] = consumeType(parts, ctx);
      ctx.func.push(details = uleb(typeIdx));
      ctx.func.importc = (ctx.func.importc || 0) + 1;
    } else if (kind === "memory") {
      if (name) ctx.memory[name] = ctx.memory.length;
      details = range(parts);
    } else if (kind === "global") {
      if (name) ctx.global[name] = ctx.global.length;
      let [type2] = parts, mut = type2[0] === "mut" ? 1 : 0;
      details = [TYPE[mut ? type2[1] : type2], mut];
      ctx.global.push(details);
      ctx.global.importc = (ctx.global.importc || 0) + 1;
    } else throw Error("Unimplemented " + kind);
    ctx.import.push([...str2(mod), ...str2(field), KIND[kind], ...details]);
  },
  // (data (i32.const 0) "\aa" "\bb"?)
  // (data (offset (i32.const 0)) (memory ref) "\aa" "\bb"?)
  // (data (global.get $x) "\aa" "\bb"?)
  data([, ...inits], ctx) {
    let offset, mem2;
    if (inits[0]?.[0] === "offset") [, offset] = inits.shift();
    if (inits[0]?.[0] === "memory") [, mem2] = inits.shift();
    if (inits[0]?.[0] === "offset") [, offset] = inits.shift();
    if (!offset && !mem2) offset = inits.shift();
    if (!offset) offset = ["i32.const", 0];
    ctx.data.push([0, ...consumeConst([...offset], ctx), 11, ...str2(inits.map((i) => i[0] === '"' ? i.slice(1, -1) : i).join(""))]);
  },
  // (start $main)
  start([, name], ctx) {
    if (!ctx.start.length) ctx.start.push([name[0] === "$" ? ctx.func[name] : name]);
  }
};
var consumeConst = (node, ctx) => {
  let op2 = node.shift(), [type2, cmd] = op2.split(".");
  if (type2 === "global") return [35, ...uleb(node[0][0] === "$" ? ctx.global[node[0]] : node[0])];
  if (type2 === "v128") return [253, 12, ...v128(node)];
  if (cmd === "const") return [65 + ["i32", "i64", "f32", "f64"].indexOf(type2), ...encode_exports[type2](node[0])];
  return [
    ...consumeConst(node.shift(), ctx),
    ...consumeConst(node.shift(), ctx),
    OP.indexOf(op2)
  ];
};
var v128 = (args) => {
  let [t, n] = args.shift().split("x"), stride = t.slice(1) >>> 3;
  n = +n;
  if (t[0] === "i") {
    let arr2 = n === 16 ? new Uint8Array(16) : n === 8 ? new Uint16Array(8) : n === 4 ? new Uint32Array(4) : new BigInt64Array(2);
    for (let i = 0; i < n; i++) {
      arr2[i] = encode_exports[t].parse(args.shift());
    }
    return new Uint8Array(arr2.buffer);
  }
  let arr = new Uint8Array(16);
  for (let i = 0; i < n; i++) {
    arr.set(encode_exports[t](args.shift()), i * stride);
  }
  return arr;
};
var escape2 = { n: 10, r: 13, t: 9, v: 1, "\\": 92 };
var str2 = (str3) => {
  str3 = str3[0] === '"' ? str3.slice(1, -1) : str3;
  let res = [], i = 0, c, BSLASH2 = 92;
  for (; i < str3.length; ) {
    c = str3.charCodeAt(i++);
    res.push(c === BSLASH2 ? escape2[str3[i++]] || parseInt(str3.slice(i - 1, ++i), 16) : c);
  }
  res.unshift(...uleb(res.length));
  return res;
};
var range = ([min, max, shared]) => isNaN(parseInt(max)) ? [0, ...uleb(min)] : [shared === "shared" ? 3 : 1, ...uleb(min), ...uleb(max)];
var consumeType = (nodes, ctx) => {
  let params = [], result = [], idx2, bytes;
  while (nodes[0]?.[0] === "param") {
    let [, ...types] = nodes.shift();
    if (types[0]?.[0] === "$") params[types.shift()] = params.length;
    params.push(...types.map((t) => TYPE[t]));
  }
  if (nodes[0]?.[0] === "result") result = nodes.shift().slice(1).map((t) => TYPE[t]);
  bytes = [TYPE.func, ...uleb(params.length), ...params, ...uleb(result.length), ...result];
  idx2 = ctx.type.findIndex((t) => t.every((byte, i) => byte === bytes[i]));
  if (idx2 < 0) idx2 = ctx.type.push(bytes) - 1;
  return [idx2, params, result];
};
var consumeParams = (args) => {
  let params = {}, param;
  while (args[0]?.includes("=")) param = args.shift().split("="), params[param[0]] = Number(param[1]);
  return params;
};

// node_modules/watr/src/print.js
var indent = "";
var newline = "\n";
function print(tree, options = {}) {
  if (typeof tree === "string") tree = parse_default3(tree);
  ({ indent = "  ", newline = "\n" } = options);
  indent ||= "", newline ||= "";
  return typeof tree[0] === "string" ? printNode(tree) : tree.map((node) => printNode(node)).join(newline);
}
var INLINE = [
  "param",
  "local",
  "drop",
  "f32.const",
  "f64.const",
  "i32.const",
  "i64.const",
  "local.get",
  "global.get",
  "memory.size",
  "result",
  "export",
  "unreachable",
  "nop"
];
function printNode(node, level = 0) {
  if (!Array.isArray(node)) return node + "";
  let content = node[0];
  for (let i = 1; i < node.length; i++) {
    if (Array.isArray(node[i])) {
      if (INLINE.includes(node[i][0]) && (!Array.isArray(node[i - 1]) || INLINE.includes(node[i - 1][0]))) {
        if (!Array.isArray(node[i - 1])) content += ` `;
      } else {
        content += newline;
        if (node[i]) content += indent.repeat(level + 1);
      }
      content += printNode(node[i], level + 1);
    } else {
      content += ` `;
      content += node[i];
    }
  }
  return `(${content})`;
}

// src/util.js
function err3(msg) {
  throw Error(msg || "Bad syntax");
}
function pretty(str3) {
  return print(str3 + "", { indent: "  ", newline: "\n" });
}
function ids(node, set2 = /* @__PURE__ */ new Set()) {
  if (node?.ids) return node.ids;
  if (typeof node === "string") set2.add(node);
  else if (Array.isArray(node)) {
    if (node[0] === INT || node[0] === FLOAT) return;
    if (node[0] === "=" && node[1][0] === "(") return set2.add(node[1][1]), set2;
    for (let i = 1; i < node.length; i++) ids(node[i], set2);
    node.ids = set2;
  }
  return set2;
}
function intersect(set1, set2) {
  for (const item of set1) if (set2.has(item)) return true;
  return false;
}
function stringify(tree) {
  if (typeof tree === "string") return tree;
  let [op2, a, ...args] = tree;
  if (op2 === INT || op2 === FLOAT) return a + args.join("");
  return `${stringify(a)} ${op2} ${args.length ? stringify(args[0]) : ""}`;
}
function u82s(uint8Array) {
  let result = "";
  for (const byte of uint8Array) {
    const asciiChar = String.fromCharCode(byte);
    if (asciiChar === '"' || asciiChar === "\\") {
      result += "\\" + asciiChar;
    } else if (byte >= 32 && byte <= 126) {
      result += asciiChar;
    } else {
      result += `\\${byte.toString(16).padStart(2, "0")}`;
    }
  }
  return result;
}

// src/precompile.js
var units;
var prev;
function precompile(node) {
  prev = { units };
  units = {};
  const result = expr2(node);
  ({ units } = prev);
  return result;
}
function expr2(node) {
  if (Array.isArray(node)) {
    return expr2[node[0]] ? expr2[node[0]](node) : node;
  }
  return node;
}
function applyUnits(n, unit, ext) {
  if (unit) n = expr2(["*", [FLOAT, n], units[unit] || err3(`Unknown unit \`${unit}\``)]);
  if (ext) n = expr2(["+", n, applyUnits(...ext.slice(1))]);
  return n;
}
Object.assign(expr2, {
  [FLOAT]([, n, unit, ext]) {
    if (unit) return applyUnits(n, unit, ext);
    return [FLOAT, n];
  },
  [INT]([, n, unit, ext]) {
    if (unit) return applyUnits(n, unit, ext);
    return [INT, n];
  },
  ";"([, ...list]) {
    return [";", ...list.filter((s, i) => !i || s).map((s) => expr2(s))];
  },
  ","(node) {
    return node.flatMap((a, i) => {
      if (!i || !a) return [a];
      a = expr2(a);
      return [a];
    });
  },
  "./"([, a]) {
    return ["./", expr2(a)];
  },
  "../"([, a]) {
    return ["../", expr2(a)];
  },
  "()"([, a]) {
    a = expr2(a);
    if (!a || !a.length) return;
    if (a[0] === "()") return a;
    if (typeof a[1] === "number") return a;
    if (a[1] === "..") return a;
    if (a[0] === ",") return a;
    return a;
  },
  // f(a,b,c)
  "("([, name, args]) {
    args = !args ? [,] : args[0] === "," ? args : [",", args];
    return ["(", name, args];
  },
  // [1,2,3]
  "[]"([, inits]) {
    inits = expr2(inits);
    inits = !inits ? [,] : inits[0] === "," ? inits : [",", inits];
    inits = inits.flatMap((el, i) => {
      if (!i) return [el];
      if (el[0] === ".." && typeof el[1][1] === "number" && typeof el[2][1] === "number" && Math.abs(el[2][1] - el[1][1]) < 108) {
        let from = el[1][1], to = el[2][1], step = 1, els = [];
        if (from === -Infinity) for (let i2 = 0; i2 < to; i2 += step) els.push([FLOAT, 0]);
        else if (from < to) for (let i2 = from; i2 < to; i2 += step) els.push([FLOAT, i2]);
        else for (let i2 = from; i2 > to; i2 -= step) els.push([FLOAT, i2]);
        return els;
      }
      return [el];
    });
    return ["[]", inits];
  },
  ".."([, a, b]) {
    if (!a && !b) return ["..", [FLOAT, -Infinity], [FLOAT, Infinity]];
    if (!a) return ["..", [FLOAT, -Infinity], expr2(b)];
    if (!b) return ["..", expr2(a), [FLOAT, Infinity]];
    a = expr2(a), b = expr2(b);
    return ["..", a, b];
  },
  "|>"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return ["|>", a, b];
  },
  // a[0]
  "["([, a, b]) {
    a = expr2(a);
    if (!b) return ["[", a];
    b = expr2(b);
    return unroll("[", a, b) || ["[", a, b];
  },
  "="([, a, b]) {
    b = expr2(b);
    if (a[0] === "(") {
      b = !b ? [";"] : b[0] === ";" ? b : [";", b];
      let [, name, args] = a;
      args = !args ? [,] : args[0] === "," ? args : [",", args];
      return ["=", ["(", name, args], b];
    }
    if ((a[0] === INT || a[0] === FLOAT) && a[2]) {
      let [, n, unit] = a;
      units[unit] = expr2(["/", b, [FLOAT, n]]);
      return;
    }
    if (a[0] === "*") {
      return ["=", a, b];
    }
    a = expr2(a);
    if (a[0] === "," && intersect(ids(a), ids(b))) {
      const n = a.length - 1;
      return [
        ";",
        unroll("=", [",", ...Array.from({ length: n }, (b2, i) => `t:${i}`)], b),
        unroll("=", a, [",", ...Array.from({ length: n }, (a2, i) => `t:${i}`)])
      ];
    }
    if (a[0] === "[]") {
      let [, arr, idx2] = a;
      idx2 = expr2(idx2);
      a = ["[]", arr, idx2];
    }
    return unroll("=", a, b) || ["=", a, b];
  },
  "+="([, a, b]) {
    return expr2(["=", a, ["+", a, b]]);
  },
  "-="([, a, b]) {
    return expr2(["=", a, ["-", a, b]]);
  },
  "*="([, a, b]) {
    return expr2(["=", a, ["*", a, b]]);
  },
  "/="([, a, b]) {
    return expr2(["=", a, ["/", a, b]]);
  },
  "%="([, a, b]) {
    return expr2(["=", a, ["%", a, b]]);
  },
  "**="([, a, b]) {
    return expr2(["=", a, ["**", a, b]]);
  },
  "~="([, a, b]) {
    return expr2(["=", a, ["~", a, b]]);
  },
  "+"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("+", a, b) || (typeof b[1] === "number" && typeof a[1] === "number" ? [a[0] === INT && b[0] === INT ? INT : FLOAT, a[1] + b[1]] : b[1] === 0 ? a : a[1] === 0 ? b : ["+", a, b]);
  },
  "-"([, a, b]) {
    if (!b) {
      a = expr2(a);
      if (typeof a[1] === "number") return [a[0], -a[1]];
      return ["-", a];
    }
    a = expr2(a), b = expr2(b);
    return unroll("-", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [a[0] === INT && b[0] === INT ? INT : FLOAT, a[1] - b[1]] : a[1] === 0 ? ["-", b] : b[1] === 0 ? a : ["-", a, b]);
  },
  "*"([, a, b]) {
    if (!b) return ["*", expr2(a)];
    a = expr2(a);
    b = expr2(b);
    return unroll("*", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [FLOAT, a[1] * b[1]] : a[1] === 0 || b[1] === 0 ? [FLOAT, 0] : b[1] === 1 ? a : a[1] === 1 ? b : ["*", a, b]);
  },
  "/"([, a, b]) {
    if (!b) return ["/", expr2(a)];
    a = expr2(a), b = expr2(b);
    return unroll("/", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [FLOAT, a[1] / b[1]] : a[1] === 0 ? [FLOAT, 0] : (
      // 0 / x
      b[1] === 1 ? a : (
        // x / 1
        ["/", a, b]
      )
    ));
  },
  "%"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("%", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [FLOAT, a[1] % b[1]] : ["%", a, b]);
  },
  "%%"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("%%", a, b) || // FIXME
    // (typeof a[1] === 'number' && typeof b[1] === 'number') ? [FLOAT, a[1] %% b[1]] :
    ["%%", a, b];
  },
  "**"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("**", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [FLOAT, a[1] ** b[1]] : b[1] === 0 ? [FLOAT, 1] : a[1] === 1 ? [FLOAT, 1] : b[1] === 1 ? a : b[1] === -1 ? ["/", [FLOAT, 1], b] : typeof b[1] === "number" && b[1] < 0 ? ["/", [FLOAT, 1], expr2(["**", a, [FLOAT, Math.abs(b[1])]])] : (
      // a ** 3 -> a*a*a
      typeof a === "string" && typeof b[1] === "number" && b[1] % 1 === 0 && b[1] <= 3 ? Array(b[1]).fill(a).reduce((prev2, a2) => ["*", a2, prev2]) : ["**", a, b]
    ));
  },
  "//"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("//", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [FLOAT, Math.floor(a[1] / b[1])] : a[1] === 0 ? [FLOAT, 0] : (
      // 0 // x
      b[1] === 1 ? a : (
        // x // 1
        ["//", a, b]
      )
    ));
  },
  "!"([, a]) {
    a = expr2(a);
    return unroll("!", a) || (typeof a[1] === "number" ? [INT, !a[1]] : ["!", a]);
  },
  "&"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("&", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [INT, a[1] & b[1]] : (
      // a & 0 -> 0
      a[1] === 0 || b[1] === 0 ? [INT, 0] : ["&", a, b]
    ));
  },
  "|"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("|", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [INT, a[1] | b[1]] : (
      // FIXME: a | 0 -> asInt(a)
      // (a[1] === 0 || b[1] === 0) ? ['|', b, a] :
      ["|", a, b]
    ));
  },
  "^"([, a, b]) {
    if (!b) return ["^", expr2(a)];
    a = expr2(a), b = expr2(b);
    return unroll("^", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [INT, a[1] ^ b[1]] : ["^", a, b]);
  },
  "<<"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("<<", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [INT, a[1] << b[1]] : ["<<", a, b]);
  },
  ">>"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll(">>", a, b) || (typeof a[1] === "number" && typeof b[1] === "number" ? [INT, a[1] >> b[1]] : [">>", a, b]);
  },
  "~"([, a, b]) {
    if (!b) {
      a = expr2(a);
      return unroll("~", a) || (typeof a[1] === "number" ? [INT, ~a[1]] : ["~", a]);
    }
    a = expr2(a), b = expr2(b);
    return unroll("~", a, b) || ["~", a, b];
  },
  ">"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll(">", a, b) || [">", a, b];
  },
  ">="([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll(">=", a, b) || [">=", a, b];
  },
  "<"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("<", a, b) || ["<", a, b];
  },
  "<="([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("<=", a, b) || ["<=", a, b];
  },
  "=="([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("==", a, b) || ["==", a, b];
  },
  "!="([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("!=", a, b) || ["!=", a, b];
  },
  "&&"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("&&", a, b) || // 0 && b
    (a[1] === 0 ? a : (
      // a && 0
      b[1] === 0 ? b : (
        // 1 && b
        typeof a[1] === "number" && a[1] ? b : (
          // a && 1
          typeof b[1] === "number" && b[1] ? a : ["&&", a, b]
        )
      )
    ));
  },
  "||"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("||", a, b) || // 0 || b
    (a[1] === 0 ? b : (
      // a || 0
      b[1] === 0 ? a : (
        // 1 || b
        typeof a[1] === "number" && a[1] ? b : (
          // a || 1
          typeof b[1] === "number" && b[1] ? a : ["||", a, b]
        )
      )
    ));
  },
  "?"([, a, b]) {
    a = expr2(a), b = expr2(b);
    return unroll("?", a, b) || ["?", a, b];
  },
  "?:"([, a, b, c]) {
    a = expr2(a);
    return a[1] === 0 ? expr2(c) : typeof a[1] === "number" && a[1] ? expr2(b) : ["?:", a, expr2(b), expr2(c)];
  }
});
function unroll(op2, a, b) {
  if (!b) {
    if (a[0] === ",") {
      const [, ...as] = a;
      return [",", ...as.map((a2) => [op2, expr2(a2)])];
    }
    return;
  }
  if (a[0] === ",") {
    const [, ...as] = a;
    if (b[0] === ",") {
      const [, ...bs] = b;
      if (as.length !== bs.length) err3(`Mismatching number of elements in \`${op2}\` operation`);
      return [
        ",",
        ...Array.from({ length: Math.max(as.length, bs.length) }, (_, i) => [op2, expr2(as[i] || bs[i]), expr2(bs[i] || as[i])])
      ];
    }
    return b = expr2(b), [",", ...as.map((a2) => [op2, expr2(a2), b])];
  }
  if (b[0] === ",") {
    const [, ...bs] = b;
    return a = expr2(a), [",", ...bs.map((b2) => [op2, a, expr2(b2)])];
  }
}

// src/stdlib.js
var std = {
  // signed min/max (better be called i32.max_s)
  "i32.smax": "(func $i32.smax (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.ge_s (local.get 0) (local.get 1))))",
  "i32.smin": "(func $i32.smin (param i32 i32) (result i32) (select (local.get 0) (local.get 1) (i32.le_s (local.get 0) (local.get 1))))",
  "i32.dup": "(func $i32.dup (param i32) (result i32) (local.get 0)(local.get 0))",
  // just for reference - easier to just `f64.ne x x` directly
  "f64.isnan": "(func $f64.isnan (param f64) (result i32) (f64.ne (local.get 0) (local.get 0)))",
  // a ** b generic case
  // ref: https://github.com/jdh8/metallic/blob/master/src/math/double/pow.c
  "f64.pow": `(func $f64.pow(param f64 f64)(result f64)(local f64 i64 i64 i64 f64 f64 f64 f64 f64 f64)(local.set 2(f64.const 0x1p+0))(block(br_if 0(f64.eq(local.get 1)(f64.const 0x0p+0)))(local.set 3(i64.const 0))(block(br_if 0(i64.gt_s(i64.reinterpret_f64(local.get 0))(i64.const -1)))(br_if 0(f64.ne(f64.nearest(local.get 1))(local.get 1)))(local.set 3(i64.shl(i64.extend_i32_u(f64.ne(f64.nearest(local.tee 2(f64.mul(local.get 1)(f64.const 0x1p-1))))(local.get 2)))(i64.const 63)))(local.set 0(f64.neg(local.get 0))))(local.set 2(f64.const 0x1p+0))(block(br_if 0(f64.eq(local.get 0)(f64.const 0x1p+0)))(block(br_if 0(f64.ne(local.get 0)(f64.const 0x0p+0)))(local.set 2(select(f64.const inf)(f64.const 0x0p+0)(i64.lt_s(i64.reinterpret_f64(local.get 1))(i64.const 0))))(br 1))(block(br_if 0(f64.ne(f64.abs(local.get 0))(f64.const inf)))(local.set 2(select(f64.const 0x0p+0)(f64.const inf)(i64.lt_s(i64.reinterpret_f64(local.get 1))(i64.const 0))))(br 1))(block(br_if 0(i64.ge_s(local.tee 4(i64.reinterpret_f64(local.get 0)))(i64.const 0)))(local.set 2(f64.const nan))(br 1))(block(br_if 0(f64.ne(f64.abs(local.get 1))(f64.const inf)))(local.set 2(select(f64.const inf)(f64.const 0x0p+0)(i32.eq(i32.wrap_i64(i64.shr_u(i64.reinterpret_f64(local.get 1))(i64.const 63)))(f64.lt(local.get 0)(f64.const 0x1p+0)))))(br 1))(block(br_if 0(i64.gt_u(local.get 4)(i64.const 4503599627370495)))(local.set 4(i64.sub(i64.shl(local.get 4)(local.tee 5(i64.add(i64.clz(local.get 4))(i64.const -11))))(i64.shl(local.get 5)(i64.const 52)))))(local.set 2(f64.const inf))(br_if 0(f64.gt(local.tee 1(f64.add(local.tee 10(f64.mul(local.tee 6(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.get 1))(i64.const -4294967296))))(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(f64.add(f64.add(local.tee 7(f64.mul(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(f64.add(local.tee 11(f64.mul(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.tee 9(f64.div(local.tee 7(f64.add(f64.reinterpret_i64(i64.sub(local.get 4)(i64.and(local.tee 5(i64.add(local.get 4)(i64.const -4604544271217802189)))(i64.const -4503599627370496))))(f64.const -0x1p+0)))(local.tee 8(f64.add(local.get 7)(f64.const 0x1p+1))))))(i64.const -134217728))))(local.tee 0(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(f64.add(f64.add(local.tee 10(f64.mul(local.get 0)(local.get 0)))(local.tee 8(f64.add(f64.mul(local.tee 7(f64.div(f64.sub(f64.sub(local.get 7)(f64.mul(local.get 0)(local.tee 11(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.get 8))(i64.const -4294967296))))))(f64.mul(local.get 0)(f64.add(local.get 7)(f64.sub(f64.const 0x1p+1)(local.get 11)))))(local.get 8)))(f64.add(local.get 9)(local.get 0)))(f64.mul(f64.mul(local.tee 0(f64.mul(local.get 9)(local.get 9)))(local.get 0))(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(f64.add(f64.mul(local.get 0)(f64.const 0x1.91a4911cbce5ap-3))(f64.const 0x1.97a897f8e6cap-3))(local.get 0))(f64.const 0x1.d8a9d6a7940bp-3))(local.get 0))(f64.const 0x1.1745bc213e72fp-2))(local.get 0))(f64.const 0x1.5555557cccac1p-2))(local.get 0))(f64.const 0x1.b6db6db6b8d5fp-2))(local.get 0))(f64.const 0x1.3333333333385p-1))))))(f64.const 0x1.8p+1)))(i64.const -67108864))))))(local.tee 9(f64.add(f64.mul(local.get 7)(local.get 0))(f64.mul(local.get 9)(f64.add(local.get 8)(f64.add(local.get 10)(f64.sub(f64.const 0x1.8p+1)(local.get 0)))))))))(i64.const -4294967296))))(f64.const 0x1.ec709dc4p-1)))(local.tee 9(f64.add(f64.mul(local.get 0)(f64.const -0x1.7f00a2d80faabp-35))(f64.mul(f64.add(local.get 9)(f64.sub(local.get 11)(local.get 0)))(f64.const 0x1.ec709dc3a03fdp-1)))))(local.tee 8(f64.convert_i64_s(i64.shr_s(local.get 5)(i64.const 52))))))(i64.const -2097152))))))(local.tee 0(f64.add(f64.mul(f64.sub(local.get 1)(local.get 6))(local.get 0))(f64.mul(f64.add(local.get 9)(f64.add(local.get 7)(f64.sub(local.get 8)(local.get 0))))(local.get 1))))))(f64.const 0x1p+10)))(local.set 9(f64.sub(local.get 1)(local.get 10)))(block(br_if 0(f64.ne(local.get 1)(f64.const 0x1p+10)))(br_if 1(f64.lt(local.get 9)(local.get 0))))(local.set 2(f64.const 0x0p+0))(br_if 0(f64.lt(local.get 1)(f64.const -0x1.0ccp+10)))(block(br_if 0(f64.ne(local.get 1)(f64.const -0x1.0ccp+10)))(br_if 1(f64.gt(local.get 9)(local.get 0))))(local.set 4(i64.reinterpret_f64(f64.add(f64.add(local.tee 8(f64.mul(local.tee 7(f64.reinterpret_i64(i64.and(i64.reinterpret_f64(local.tee 2(f64.sub(local.get 1)(local.tee 9(f64.nearest(local.get 1))))))(i64.const -4294967296))))(f64.const 0x1.62e42ffp-1)))(f64.add(local.tee 2(f64.add(f64.mul(local.get 2)(f64.const -0x1.718432a1b0e26p-35))(f64.mul(f64.add(local.get 0)(f64.sub(local.get 10)(f64.add(local.get 9)(local.get 7))))(f64.const 0x1.62e42ffp-1))))(f64.div(f64.mul(local.tee 0(f64.add(local.get 8)(local.get 2)))(local.tee 2(f64.sub(local.get 0)(f64.mul(local.tee 2(f64.mul(local.get 0)(local.get 0)))(f64.add(f64.mul(local.get 2)(f64.add(f64.mul(local.get 2)(f64.add(f64.mul(local.get 2)(f64.add(f64.mul(local.get 2)(f64.const 0x1.63f2a09c94b4cp-25))(f64.const -0x1.bbd53273e8fb7p-20)))(f64.const 0x1.1566ab5c2ba0dp-14)))(f64.const -0x1.6c16c16c0ac3cp-9)))(f64.const 0x1.5555555555553p-3))))))(f64.sub(f64.const 0x1p+1)(local.get 2)))))(f64.const 0x1p+0))))(block(block(br_if 0(i32.eqz(f64.lt(f64.abs(local.get 9))(f64.const 0x1p+63))))(local.set 5(i64.trunc_f64_s(local.get 9)))(br 1))(local.set 5(i64.const -9223372036854775808)))(local.set 2(select(f64.mul(f64.reinterpret_i64(i64.add(local.tee 4(i64.add(i64.shl(local.get 5)(i64.const 52))(local.get 4)))(i64.const 4593671619917905920)))(f64.const 0x1p-1020))(f64.reinterpret_i64(local.get 4))(f64.lt(local.get 1)(f64.const -0x1.fep+9)))))(local.set 2(f64.reinterpret_i64(i64.or(local.get 3)(i64.reinterpret_f64(local.get 2))))))(local.get 2))`,
  // a %% b, also used to access buffer
  "i32.modwrap": `(func $i32.modwrap (param i32 i32) (result i32) (local $rem i32)
    (local.set $rem (i32.rem_s (local.get 0) (local.get 1)))
    (if (result i32) (i32.and (local.get $rem) (i32.const 0x80000000))
      (then (i32.add (local.get 1) (local.get $rem)))
      (else (local.get $rem)
    )
  ))`,
  "f64.modwrap": `(func $f64.modwrap (param f64 f64) (result f64) (local $rem f64)
    (local.set $rem (call $f64.rem (local.get 0) (local.get 1)))
    (if (result f64) (f64.lt (local.get $rem) (f64.const 0))
      (then (f64.add (local.get 1) (local.get $rem)))
      (else (local.get $rem))
    )
  )`,
  // divident % divisor => dividend - divisor * floor(dividend / divisor)
  "f64.rem": `(func $f64.rem (param f64 f64) (result f64)
    (f64.sub (local.get 0) (f64.mul (f64.floor (f64.div (local.get 0) (local.get 1))) (local.get 1)))
  )`,
  // increase available memory to N bytes, grow if necessary; returns ptr to allocated block
  "malloc": `(func $malloc (param i32) (result i32) (local i32 i32)
(local.set 1 (global.get $__mem))
(global.set $__mem (i32.add (global.get $__mem) (local.get 0)))
(local.set 2 (i32.shl (memory.size) (i32.const 16)) )
(if (i32.ge_u (global.get $__mem) (local.get 2)) (then
(memory.grow (i32.add (i32.shr_u (i32.sub (global.get $__mem) (local.get 2))(i32.sub (i32.const 1)) (i32.const 16)) (i32.const 1)) )(drop)
))
(local.get 1)
)`,
  // fill mem area at $offset with range values $from, $to via $step param; returns ptr to address after range
  "range": `
    (func $range.dsc (param i32 f64 f64 f64) (result i32)
      (loop
        (if (f64.gt (local.get 1)(local.get 2))
        (then
          (f64.store (local.get 0) (local.get 1))
          (local.set 0 (i32.add (local.get 0) (i32.const 8)))
          (local.set 1 (f64.sub (local.get 1) (local.get 3)))
          (br 1)
          )
        )
      )
      (local.get 0)
    )`,
  // create reference to mem address (in bytes) with length (# of f64 items) - doesn't allocate memory, just creates ref
  "arr.ref": `(func $arr.ref (param i32 i32) (result f64)
(f64.reinterpret_i64 (i64.or
(i64.reinterpret_f64 (f64.convert_i32_u (local.get 0)))
(i64.extend_i32_u (i32.and (i32.const 0x00ffffff) (local.get 1)))))
(return))`,
  // reads array address from ref (likely not needed to use since can be just converted float to int)
  // address is float number truncated to int
  "arr.adr": `(func $arr.adr (param f64) (result i32) (i32.trunc_f64_u (local.get 0)) (return))`,
  // reads array length as last 24 bits of f64 number
  "arr.len": `(func $arr.len (param f64) (result i32) (i32.wrap_i64 (i64.and (i64.const 0x0000000000ffffff) (i64.reinterpret_f64 (local.get 0)))))`,
  // arr.set(ref, pos, val): writes $val into array, $idx is position in array (not mem address). Returns array ref (for chaining).
  // FIXME: throw if setting value < length
  "arr.set": `(func $arr.set (param f64 i32 f64) (result f64)
(if (i32.lt_s (local.get 1) (i32.const 0)) (then (local.set 1 (call $i32.modwrap (local.get 1) (call $arr.len (local.get 0))))))
(f64.store (i32.add (i32.trunc_f64_u (local.get 0)) (i32.shl (local.get 1) (i32.const 3))) (local.get 2))
(local.get 0)
(return))
`,
  // same as arr.set, but returns assigned value
  "arr.tee": `(func $arr.tee (param f64 i32 f64) (result f64) (call $arr.set (local.get 0)(local.get 1)(local.get 2))(drop) (return (local.get 2)))`,
  // arr.get(ref, pos): reads value at position from array
  "arr.get": `(func $arr.get (param f64 i32) (result f64)
(if (i32.lt_s (local.get 1) (i32.const 0)) (then (local.set 1 (call $i32.modwrap (local.get 1) (call $arr.len (local.get 0))))))
(f64.load (i32.add (i32.trunc_f64_u (local.get 0)) (i32.shl (local.get 1) (i32.const 3))))
)`,
  math: `(global pi f64 (f64.const 3.141592653589793))`
};
var stdlib_default = std;

// src/build.js
var i322 = {
  const: (a) => op(`(i32.const ${a})`, "i32"),
  load: (a) => op(`(i32.load ${a})`, "i32"),
  store: (a, v) => op(`(i32.store ${a} ${v})`),
  add: (a, b) => op(`(i32.add ${a} ${b})`, "i32"),
  sub: (a, b) => op(`(i32.sub ${a} ${b})`, "i32"),
  eqz: (a) => op(`(i32.eqz ${a})`, "i32")
};
var f642 = {
  const: (a) => op(`(f64.const ${a})`, "f64"),
  load: (a) => op(`(f64.load ${a})`, "f64"),
  store: (a, v) => op(`(f64.store ${a} ${v})`),
  add: (a, b) => op(`(f64.add ${a} ${b})`, "f64"),
  sub: (a, b) => op(`(f64.sub ${a} ${b})`, "f64"),
  lt: (a, b) => op(`(f64.lt ${a} ${b})`, "i32")
};
function cond(i, a, b) {
  let result = a.type ? `(result ${a.type.join(" ")})` : ``;
  return op(`(if ${result} ${i} (then ${a}) ${b ? `(else ${b})` : ``})`, a.type);
}
function loop(body) {
  return op(`(loop ${body})`);
}
function op(str3 = "", type2) {
  str3 = new String(str3);
  if (!type2) type2 = [];
  else if (typeof type2 === "string") type2 = [type2];
  return Object.assign(str3, { type: type2 });
}
function get(name) {
  if (!func && name[0] !== "_" || globals[name]) return globals[name] ||= { type: "f64" }, op(`(global.get $${name})`, globals[name].type);
  if (locals[name].static) return op(`(global.get $${locals[name].static})`, locals[name].type);
  return locals[name] ||= { type: "f64" }, op(`(local.get $${name})`, locals[name].type);
}
function set(name, init = "") {
  if (!func && name[0] !== "_" || !initing && globals[name]) return globals[name] ||= { type: init.type || "f64" }, op(`(global.set $${name} ${init})`);
  if (locals[name].static) return op(`(global.set $${locals[name].static} ${init})`);
  return locals[name] ||= { type: init.type || "f64" }, op(`(local.set $${name} ${init})`);
}
function tee(name, init = "") {
  if (!func && name[0] !== "_" || !initing && globals[name]) return globals[name] ||= { type: init.type || "f64" }, op(`(global.set $${name} ${init})(global.get $${name})`, init.type);
  if (locals[name].static) return op(`(global.set $${locals[name].static} ${init})(global.get $${locals[name].static})`, locals[name].type);
  return locals[name] ||= { type: init.type || "f64" }, op(`(local.tee $${name} ${init})`, init.type);
}
function call(name, ...args) {
  if (!funcs[name]) err3(`Unknown function call '${name}'`);
  return op(`(call $${name} ${args.join(" ")})`, funcs[name].type);
}
function include(name) {
  if (!stdlib_default[name]) err3("Unknown include `" + name + "`");
  let code = stdlib_default[name];
  let type2 = code.match(/\(result\s+([^\)]+)\)/i)?.[1].trim().split(/\s+/);
  if (!funcs[name]) defineFn(name, code, type2);
}
function defineFn(name, body, type2) {
  if (funcs[name]) err3(`Redefine func \`${name}\``);
  funcs[name] = new String(body);
  funcs[name].type = type2;
}
function uptype(a, b) {
  if (a.length < b.length) a.length = b.length;
  for (let i = 0, l = b.length; i < l; i++)
    if (a[i] !== b[i]) a[i] = "f64";
}
function type(opStr, type2) {
  let dif = type2.findIndex((t, i) => opStr.type[i] != t);
  if (dif < 0) return opStr;
  if (dif >= opStr.type.length - 1) {
    opStr = float(opStr);
    for (let i = opStr.type.length; i < type2.length; i++) opStr += `(${type2[i]}.const nan)`;
    return op(opStr, type2);
  } else {
    err3("Unimplemented return type mismatch");
  }
}
function float(opStr) {
  if (opStr.type[0] === "f64") return opStr;
  if (opStr == RETURN) return opStr;
  if (opStr.startsWith("(i32.const")) return op(opStr.replace("(i32.const", "(f64.const"), "f64");
  return op(`(f64.convert_i32_s ${opStr})`, "f64");
}
function int(opStr) {
  if (opStr.type[0] === "i32") return opStr;
  if (opStr == RETURN) return opStr;
  return op(`(i32.trunc_f64_s ${opStr})`, "i32");
}
function pick(count, input) {
  if (input.type.length === 1) {
    if (count === 1) return input;
    const name = `dup:${input.type[0]}`;
    locals[name] ||= { type: input.type[0] };
    return op(
      `(local.set $${name} ${input})${`(local.get $${name})`.repeat(count)}`,
      Array(count).fill(input.type[0])
    );
  }
  if (input.type.length === count) return input;
  if (count < input.type.length) return op(input + `(drop)`.repeat(input.type.length - count), input.type.slice(0, count));
  if (count > input.type.length) err3("Picking more members than available");
}
var isConstExpr = (a) => (
  //(typeof a === 'string' && globals[a]) ||
  a[0] === INT || a[0] === FLOAT
);

// src/compile.js
var imports;
var globals;
var locals;
var funcs;
var func;
var initing;
var exports;
var datas;
var mem;
var returns;
var defers;
var depth;
var RETURN = `%return%`;
var MAX_MEMORY = 2048;
var HEAP_SIZE = 1024;
function compile(node, config = {}) {
  if (typeof node === "string") node = parse_default2(node);
  node = precompile(node);
  console.log("compile", node);
  let prevCtx = { imports, globals, locals, funcs, func, exports, datas, mem, returns, defers, depth };
  globals = {};
  locals = {};
  imports = [];
  funcs = {};
  exports = {};
  returns = null;
  defers = null;
  func = null;
  mem = false;
  depth = 0;
  datas = {};
  let init = expr3(node, true).trim(), code = ``;
  const lastNode = node[0] === ";" ? node[node.length - 1] : node;
  for (let id2 of ids(lastNode)) if (!id2.includes(":")) exports[id2] = globals[id2] || funcs[id2] || err3("Unknown export member `" + id2 + `'`);
  if (Object.keys(imports).length) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Imports
`;
    for (let name in imports)
      code += `(import "${imports[name][0]}" "${imports[name][1]}" ${imports[name][2]})
`;
    code += `
`;
  }
  if (mem !== false) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Memory
`;
    if (config.memory) {
      code += `(import "imports" "memory" (memory ${Math.ceil(mem / 65536)} ${MAX_MEMORY}))
`;
    }
    code += `(memory (export "memory") ${Math.ceil(mem / 65536)} ${MAX_MEMORY})
(global $__mem (mut i32) (i32.const ${mem}))

`;
  }
  for (let data in datas) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Data
`;
    break;
  }
  for (let data in datas) {
    code += `(data (i32.const ${data}) "${datas[data]}")
`;
  }
  for (let data in datas) {
    code += `
`;
    break;
  }
  for (let name in globals) if (!name.includes(":")) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Globals
`;
    break;
  }
  for (let name in globals)
    if (!globals[name].import) code += `(global $${name} (mut ${globals[name].type}) ${globals[name].init || `(${globals[name].type}.const 0)`})
`;
  code += `
`;
  for (let name in funcs) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Functions
`;
    break;
  }
  for (let name in funcs) {
    code += pretty(funcs[name]) + "\n\n";
  }
  if (init) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Init
` + pretty(`(func $module:start
    ${Object.keys(locals).map((name) => `(local $${name} ${locals[name].type})`).join("")}
    ${init}
    (return))`) + `
(start $module:start)

`;
  }
  for (let name in exports) {
    code += `;;;;;;;;;;;;;;;;;;;;;;;;;;;; Exports
`;
    break;
  }
  for (let name in exports) {
    code += `(export "${name}" (${funcs[name] ? "func" : "global"} $${name}))
`;
  }
  console.groupCollapsed();
  console.log(code);
  console.groupEnd();
  ({ imports, globals, funcs, func, locals, exports, datas, mem, returns, defers, depth } = prevCtx);
  if (config?.target === "wasm")
    code = compile_default(code);
  return code;
}
function expr3(statement, out = true) {
  if (!statement) return op();
  if (typeof statement === "string") {
    locals[statement] ||= { type: "f64" };
    return out ? get(statement) : op();
  }
  if (statement.expr) return statement.expr;
  if (statement[0] in expr3) return statement.expr = expr3[statement[0]](statement, out) || op();
  err3(`Unknown operation ${statement}`);
}
Object.assign(expr3, {
  // number primitives: 1.0, 2 etc.
  [FLOAT]([, a], out) {
    return out && f642.const(a);
  },
  [INT]([, a], out) {
    return out && i322.const(a);
  },
  '"'([, str3], out) {
    if (!out) return;
    datas[mem] = [...new TextEncoder().encode(str3)];
    const result = call("arr.ref", mem, str3.length);
    mem += str3.length << 3;
    return result;
  },
  // a; b; c;
  ";"([, ...statements], out) {
    let last = statements.length - 1;
    let list = statements.map((s, i) => (initing = !i, expr3(s, i == last ? out : false)));
    return op(list.join("\n"), list[last]?.type);
  },
  ","([, ...statements], out) {
    let list = [];
    for (let s of statements) list.push(expr3(s, out));
    list = list.filter(Boolean);
    return op(
      list.join("\n"),
      out && list.flatMap((op2) => op2.type)
    );
  },
  // a()
  "("([, name, [, ...args]], out) {
    if (!funcs[name]) err3("Unknown function call: " + name);
    if (out) return call(name, args.map((arg) => float(expr3(arg))));
    return op(call(name, args.map((arg) => float(expr3(arg)))) + `(drop)`.repeat(!out && funcs[name].type.length));
  },
  // [1,2,3]
  "[]"([, [, ...inits]], out) {
    mem ||= 0;
    if (!inits.length) return out && op(f642.const(0), "f64");
    depth++;
    if (function isPrimitive(inits2) {
      return inits2.every((x) => !x || (typeof x[1] === "number" || x[0] === "[" && isPrimitive(x.slice(1))));
    }(inits)) {
      const f64s = new Float64Array(inits.map((x) => x ? x[1] : 0));
      const offset = mem;
      mem += f64s.length << 3;
      datas[offset] = u82s(new Uint8Array(f64s.buffer));
      depth--;
      if (func) {
        let tmp = `arr:${depth}`;
        locals[tmp] = { type: "i32" };
        return include("malloc"), include("arr.ref"), op(
          set(tmp, call("malloc", i322.const(f64s.length << 3))) + `(memory.copy ${get(tmp)} ${i322.const(offset)} ${i322.const(f64s.length << 3)})` + call("arr.ref", get(tmp), i322.const(f64s.length)),
          "f64"
        );
      } else {
        return include("arr.ref"), out && call("arr.ref", i322.const(offset), i322.const(f64s.length));
      }
    }
    let start = `arr.start:${depth}`, ptr = `arr.ptr:${depth}`;
    locals[start] = { type: "i32" };
    locals[ptr] = { type: "i32" };
    include("malloc");
    let str3 = set(ptr, tee(start, call("malloc", i322.const(HEAP_SIZE))));
    for (let init of inits) {
      if (init[0] === "..") {
        let [, min, max] = init;
        if (max[1] === Infinity) err3(`Arrays cannot be constructed from right-open ranges`);
        if (min[1] === -Infinity && typeof max[1] === "number") {
          if (max[1] < 0) err3(`Bad array range`);
          str3 += set(ptr, i322.add(get(ptr), i322.const(max[1] << 3)));
        } else {
          let i = `range.i:${depth}`, to = `range.end:${depth}`;
          locals[i] = locals[to] = { type: "f64" };
          str3 += set(i, float(expr3(min))) + set(to, float(expr3(max)));
          str3 += loop(
            cond(
              f642.lt(get(i), get(to)),
              f642.store(get(ptr), get(i)) + set(ptr, i322.add(get(ptr), i322.const(8))) + set(i, f642.add(get(i), f642.const(1))) + `(br 1)`
            )
          );
        }
      } else if (init[0] === "|>") {
        str3 += expr3(init);
      } else str3 += f642.store(i322.sub(tee(ptr, i322.add(get(ptr), i322.const(8))), i322.const(8)), float(expr3(init)));
    }
    include("malloc"), include("arr.ref");
    str3 += `(global.set $__mem ${get(ptr)})`;
    depth--;
    if (out) return op(str3 + call("arr.ref", `${get(start)} (i32.shr_u (i32.sub ${get(ptr)} ${get(start)}) ${i322.const(3)})
`), "f64", { buf: true });
    return op(str3);
  },
  // a[b] or a[]
  "["([, a, b], out) {
    include("arr.len"), include("i32.modwrap");
    if (!out) return op(expr3(a, false) + expr3(b, false));
    if (!b) return call("arr.len", expr3(a));
    if (typeof b[1] === "number") {
      if (b[1] >= 0) return f642.load(i322.add(`(i32.trunc_f64_u ${expr3(a)})`, i322.const(b[1] << 3)));
    }
    return include("arr.get"), call("arr.get", expr3(a), int(expr3(b)));
  },
  "="([, a, b], out) {
    if (a[0] === "[") {
      let [, name, idx2] = a;
      include("arr.len"), include("arr.set"), include("arr.tee"), include("i32.modwrap");
      return call("arr." + (out ? "tee" : "set"), expr3(name), int(expr3(idx2)), float(expr3(b)));
    }
    if (a[0] === "(") {
      let [, name, [, ...args]] = a, body = b, inits = [], result = "", dfn = [], code;
      if (func) err3("Declaring local function `" + name + "`: not allowed");
      if (funcs[name]) err3("Redefining function `" + name + "`: not allowed");
      let rootLocals = locals;
      func = name, locals = {}, returns = Object.assign([], { type: [] }), defers = [];
      args = args.map((arg) => {
        let name2, init;
        if (typeof arg === "string") name2 = arg;
        else if (arg[0] === "=") [, name2, init] = arg, inits.push(["?", ["!=", name2, name2], ["=", name2, init]]);
        else if (arg[0] === "~") [, name2, init] = arg, inits.push(["~=", name2, arg[2]]);
        else err3("Unknown function argument");
        locals[name2] = { arg: true, type: "f64" };
        dfn.push(`(param $${name2} f64)`);
        return name2;
      });
      b.splice(1, 0, ...inits);
      body = expr3(b);
      uptype(returns.type, body.type);
      let btype = body.type;
      for (let r of returns) {
        if (defers.length) r = op(`${type(r, returns.type)}(br $func)`, returns.type);
        else r = op(`(return ${type(r, returns.type)})`, returns.type);
        body = body.replace(RETURN, r);
      }
      body = type(op(body, btype), returns.type);
      if (returns.type.length) result = `(result ${returns.type.join(" ")})`;
      if (defers.length) body = op(`(block $func ${result} ${body})`, body.type);
      let initState;
      defineFn(
        name,
        `(func $${name} ${dfn.join("")} ${result}` + Object.entries(locals).filter(([k, v]) => !v.arg && !v.static).map(([k, v]) => `(local $${k} ${v.type})`).join(" ") + (body ? `
${body}` : ``) + (defers.length ? `
${defers.join(" ")}` : ``) + // defers have 0 stack, so result is from body
        `)`,
        body.type
      );
      locals = rootLocals;
      func = returns = defers = null;
      return initState;
    }
    if (a[0] === "*") {
      [, a] = a;
      locals[a] ||= { static: `${func}.${a}`, type: "f64" };
      if (isConstExpr(b)) {
        globals[`${func}.${a}`] = { type: "f64", init: float(expr3(b)) };
        return;
      }
      globals[`${func}.${a}`] = { type: "f64", init: op("(f64.const nan)") };
      return expr3(["?", ["!=", a, a], ["=", a, b]], out);
    }
    if (typeof a === "string") {
      if (globals[a]?.func) err3(`Redefining function '${a}' is not allowed`);
      if (!func && isConstExpr(b)) {
        globals[a] = { type: "f64", init: float(expr3(b)) };
        return;
      }
      locals[a] ||= { type: "f64" };
      const bop = expr3(b);
      return (out ? tee : set)(a, float(bop));
    }
    err3(`Unknown assignment left value \`${stringify(a)}\``);
  },
  // a |> b
  "|>"([, a, b], out) {
    if (a[0] === "..") {
      depth++;
      const [, min, max] = a;
      const minop = expr3(min), maxop = expr3(max);
      const cur2 = "_", idx2 = `idx:${depth}`, end = `end:${depth}`, bop = expr3(b, out);
      locals[cur2] = locals[idx2] = locals[end] = { type: "f64" };
      const str3 = `;; |>:${depth}
` + set(idx2, float(expr3(min))) + set(end, float(expr3(max))) + loop(
        cond(
          f642.lt(get(idx2), get(end)),
          set(cur2, get(idx2)) + bop + // FIXME: if bop returns result - gotta save it to heap
          set(idx2, f642.add(get(idx2), f642.const(1))) + `(br 1)`
        )
      );
      depth--;
      return op(str3);
    } else {
      console.log(a, b);
      err3("loop over list: unimplemented");
    }
    depth--;
    return op(str, "f64", { dynamic: true });
  },
  "-"([, a, b], out) {
    if (!b) {
      let res = expr3(a, out);
      if (!out) return res;
      if (res.type.length > 1) err3("Group negation: unimplemented");
      if (res.type[0] === "i32") return op(`(i32.sub (i32.const 0) ${res})`, "i32");
      return op(`(f64.neg ${res})`, "f64");
    }
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type.length > 1 || bop.type.length > 1) err3("Group subtraction: unimplemented");
    if (aop.type[0] === "i32" && bop.type[0] === "i32") return op(`(i32.sub ${aop} ${bop})`, "i32");
    return op(`(f64.sub ${float(aop)} ${float(bop)})`, "f64");
  },
  "+"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type[0] == "i32" && bop.type[0] == "i32") return op(`(i32.add ${aop} ${bop})`, "i32");
    return op(`(f64.add ${float(aop)} ${float(bop)})`, "f64");
  },
  "*"([, a, b], out) {
    if (!b) {
      locals[a] ||= { static: `${func}.${a}`, type: "f64" };
      globals[`${func}.${a}`] = { type: "f64", init: op("(f64.const nan)") };
      return expr3(a, out);
    }
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type.length > 1 || bop.type.length > 1) {
      err3("Complex group multiplication is not supported");
    }
    return op(`(f64.mul ${float(aop)} ${float(bop)})`, "f64");
  },
  "/"([, a, b], out) {
    if (!b) {
      if (!func) err3("Global return");
      let aop2 = expr3(a);
      returns.push(aop2);
      if (!returns.type) returns.type = [...aop2.type];
      else uptype(returns.type, aop2.type);
      return op(RETURN, aop2.type);
    }
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    return op(`(f64.div ${float(aop)} ${float(bop)})`, "f64");
  },
  "**"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (b[1] === 0.5) return op(`(f64.sqrt ${float(aop)})`, "f64");
    return include("f64.pow"), call("f64.pow", float(aop), float(bop));
  },
  "%"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (b[1] === Infinity) return aop;
    if (aop.type[0] === "i32" && bop.type[0] === "i32") op(`(i32.rem_s ${aop} ${bop})`, "i32");
    return include("f64.rem"), call("f64.rem", float(aop), float(bop));
  },
  "%%"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type[0] === "i32" && bop.type[0] === "i32") return include("i32.modwrap"), call("i32.modwrap", aop, bop);
    return include("f64.modwrap"), include("f64.rem"), call("f64.modwrap", float(aop), float(bop));
  },
  "++"([, a], out) {
    if (!out) return expr3(["=", a, ["+", a, [INT, 1]]], false);
    if (a[0] === "[") return expr3(["-", ["=", a, ["+", a, [INT, 1]]], [INT, 1]]);
    if (typeof a !== "string") err3("Invalid left hand-side expression in prefix operation");
    let aop = expr3(a);
    return op(`${aop}${set(a, expr3(["+", a, [INT, 1]]))}`, aop.type[0]);
  },
  "--"([, a], out) {
    if (!out) return expr3(["=", a, ["-", a, [INT, 1]]], false);
    if (a[0] === "[") return expr3(["+", ["=", a, ["-", a, [INT, 1]]], [INT, 1]]);
    if (typeof a !== "string") err3("Invalid left hand-side expression in prefix operation");
    let aop = expr3(a);
    return op(`${aop}${set(a, expr3(["-", a, [INT, 1]]))}`, aop.type[0]);
  },
  "!"([, a], out) {
    let aop = expr3(a, out);
    if (!out) return op(aop);
    if (aop.type.length > 1) err3("Group inversion: unimplemented");
    if (aop.type[0] === "i32") return op(`(if (result i32) (i32.eqz ${aop}) (then (i32.const 1)) (else (i32.const 0)))`, "i32");
    return op(`(if (result i32) (f64.eq ${aop} (f64.const 0)) (then (i32.const 1)) (else (i32.const 0)))`, "i32");
  },
  "|"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (b[1] === 0) return int(aop);
    return op(`(i32.or ${int(aop)} ${int(bop)})`, "i32");
  },
  "&"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.and ${int(aop)} ${int(bop)})`, `i32`);
  },
  "^"([, a, b], out) {
    if (!b) {
      let aop2 = expr3(a, false);
      if (!defers) err3("Bad defer");
      defers.push(aop2);
      return;
    }
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.xor ${int(aop)} ${int(bop)})`, `i32`);
  },
  "<<"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.shl ${int(aop)} ${int(bop)})`, `i32`);
  },
  ">>"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.shr_s ${int(aop)} ${int(bop)})`, `i32`);
  },
  "<<<"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.rotl ${int(aop)} ${int(bop)})`, `i32`);
  },
  ">>>"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    return op(`(i32.rotr ${int(aop)} ${int(bop)})`, `i32`);
  },
  // comparisons
  "<"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type[0] === "i32" && bop.type[0] === "i32") return op(`(i32.lt_s ${aop} ${bop})`, "i32");
    return op(`(f64.lt ${float(aop)} ${float(bop)})`, "i32");
  },
  "<="([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type[0] === "i32" && bop.type[0] === "i32") return op(`(i32.le_s ${aop} ${bop})`, "i32");
    return op(`(f64.le ${float(aop)} ${float(bop)})`, "i32");
  },
  ">"([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type[0] === "i32" && bop.type[0] === "i32") return op(`(i32.gt_s ${aop} ${bop})`, "i32");
    return op(`(f64.gt ${float(aop)} ${float(bop)})`, "i32");
  },
  ">="([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type[0] === "i32" && bop.type[0] === "i32") return op(`(i32.ge_s ${aop} ${bop})`, "i32");
    return op(`(f64.ge ${float(aop)} ${float(bop)})`, "i32");
  },
  "=="([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type[0] === "i32" && bop.type[0] === "i32") return op(`(i32.eq_s ${aop} ${bop})`, "i32");
    return op(`(f64.eq ${float(aop)} ${float(bop)})`, "i32");
  },
  "!="([, a, b], out) {
    let aop = expr3(a, out), bop = expr3(b, out);
    if (!out) return op(aop + bop);
    if (aop.type[0] === "i32" && bop.type[0] === "i32") return op(`(i32.ne_s ${aop} ${bop})`, "i32");
    return op(`(f64.ne ${float(aop)} ${float(bop)})`, "i32");
  },
  // logical - we put value twice to the stack and then just drop if not needed
  "||"([, a, b], out) {
    let aop = expr3(a), bop = expr3(b, out);
    if (!out) return op(`(if ${aop.type[0] == "i32" ? aop : `(f64.ne ${aop} (f64.const 0))`} (else ${bop}))`);
    if (aop.type[0] == "f64") return op(`${pick(2, aop)}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then) (else (drop) ${float(bop)}))`, "f64");
    if (bop.type[0] == "i32") return op(`${pick(2, aop)}(if (param i32) (result i32) (then) (else (drop) ${bop}))`, "i32");
    return op(`${pick(2, aop)}(if (param i32) (result f64) (then (f64.convert_i32_s)) (else (drop) ${bop}))`, "f64");
  },
  "&&"([, a, b], out) {
    let aop = expr3(a), bop = expr3(b, out);
    if (!out) return op(`(if ${aop.type[0] == "i32" ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${bop}))`);
    if (aop.type[0] == "f64") return op(`${pick(2, aop)}(if (param f64) (result f64) (f64.ne (f64.const 0)) (then (drop) ${float(bop)}))`, "f64");
    if (bop.type[0] == "i32") return op(`${pick(2, aop)}(if (param i32) (result i32) (then (drop) ${bop}))`, "i32");
    return op(`${pick(2, aop)}(if (param i32) (result f64) (then (drop) ${bop})) (else (f64.convert_i32_s))`, "f64");
  },
  // a ? b; - differs from a && b so that it returns 0 if condition doesn't meet
  "?"([, a, b], out) {
    let aop = expr3(a), bop = expr3(b, out);
    if (aop.type.length > 1) err3("Group condition is not supported yet.");
    if (!out) return op(`(if ${aop.type[0] == "i32" ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${bop}))`);
    return op(`(if (result ${bop.type[0]}) ${aop.type[0] == "i32" ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${bop.type[0] === "i32" ? bop : float(bop)} ) (else (${bop.type[0]}.const 0)))`, bop.type);
  },
  "?:"([, a, b, c], out) {
    let aop = expr3(a), bop = expr3(b, out), cop = expr3(c, out);
    if (aop.type.length > 1) err3("Group condition is not supported yet.");
    if (bop.type[0] === "i32" && cop.type[0] === "i32") return op(`(if ${out ? `(result i32)` : ``} ${aop.type[0] == "i32" ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${bop} ) (else ${cop}))`, out ? "i32" : []);
    return op(`(if ${out ? `(result f64)` : ``} ${aop.type[0] == "i32" ? aop : `(f64.ne ${aop} (f64.const 0))`} (then ${float(bop)} ) (else ${float(cop)}))`, out ? "f64" : []);
  },
  // a ~ range - clamp a to indicated range
  "~"([, a, b], out) {
    if (!b) {
      return out && op(`(i32.xor (i32.const -1) ${int(expr3(a))})`, "i32");
    }
    if (b[0] !== "..") err3("Non-range passed as right side of clamp operator");
    let [, min, max] = b, aop = expr3(a), minop = min && expr3(min, out), maxop = max && expr3(max, out);
    if (!out) return op(minop + maxop);
    if (!max) {
      if (aop.type[0] === "i32" && minop.type[0] === "i32") return include("i32.smax"), call("i32.max", aop, minop);
      return op(`(f64.max ${float(aop)} ${float(minop)})`, "f64");
    }
    if (!min) {
      if (aop.type[0] === "i32" && maxop.type[0] === "i32") return include("i32.smin"), call("i32.min", aop, maxop);
      return op(`(f64.min ${float(aop)} ${float(maxop)})`, "f64");
    }
    if (aop.type == "i32" && minop.type == "i32" && maxop.type == "i32") {
      return include("i32.smax"), include("i32.smin"), call("i32.smax", call("i32.smin", aop, maxop), minop);
    }
    return op(`(f64.max (f64.min ${float(aop)} ${float(maxop)}) ${float(minop)})`, "f64");
  }
  // <math#sin>, <path/to/lib>
  // '<>'([, path], out) {
  //   if (locals) err('Import must be in global scope')
  //   path = path.trim();
  //   if (path[0] === "'" || path[0] === '"') path = path.slice(1, -1);
  //   let url = new URL('import:' + path)
  //   let { hash, pathname } = url
  //   let lib = config.imports?.[pathname]
  //   if (!lib) err(`Unknown import entry '${pathname}'`)
  //   // FIXME: include directive into syntax tree
  //   // let src = fetchSource(pathname)
  //   // let include = parse(src)
  //   // node.splice(node.indexOf(impNode), 1, null, include)
  //   let members = hash ? hash.slice(1).split(',') : Object.keys(lib)
  //   for (let member of members) {
  //     const val = lib[member]
  //     if (typeof val === 'number') {
  //       // FIXME: here can be mutable global object
  //       globals[member] = { var: true, import: true, type: 'f64' }
  //       imports.push([pathname, member, `(global $${member} f64)`])
  //     }
  //     else if (typeof val === 'function') {
  //       // FIXME: function may return multiple values, but how to detect that?
  //       imports.push([pathname, member, `(func $${member} ${val.length ? `(param${` f64`.repeat(val.length)})` : ''} (result f64))`])
  //       globals[member] = { func: true, import: true, type: 'i32' }
  //     }
  //   }
  //   // we return nothing since member is marked as imported
  //   return ''
  // },
  // a,b,c . x?
  // '.'([, a, b]) {
  //   // a.0 - index access - doesn't require modwrap
  //   let idx = isNaN(Number(b)) ? err('Alias access is unimplemented') : Number(b)
  //   return op(`(f64.load (i32.add ${int(expr(a))} (i32.const ${idx << 3})))`, 'f64')
  // },
});

// index.js
var piezo_default = compile;
export {
  compile,
  piezo_default as default,
  parse_default2 as parse,
  precompile
};
