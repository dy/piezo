// analyser converts AST into IR, able to be compiled after
import parse from './parse.js';
import stdlib from './stdlib.js';
import {PTR, FLOAT, INT, RANGE, STR, FUNC} from './const.js';

// detect variables & types, analyze internal scopes
export default function analyze(node) {
  if (typeof node === 'string') node = parse(node)

  // scopes are arrays with defined variables on them
  // nested scopes inherit parent scopes, so variables are available by prototype chain
  // array stores [opName, ...bodyStatements]

  // global entry
  let scope = Object.assign([null],{
    vars:Object.create(null)
  })

  if (typeof node === 'string') return [null, node]
  if (node[0] !== ';') node = [';',node]

  expr[node[0]](node, scope)

  // mark all global vars
  for (let n in scope.vars) scope.vars[n].global = true

  return scope
}

const expr = {
  // a;b;c
  ';'([,...statements], scope) {
    let result
    for (let statement of statements) {
      // ;;
      if (!statement) continue
      // a;b; - will be initialized after
      if (typeof statement === 'string') scope.push(statement), scope.vars[statement]||={}
      // a ... b;
      else if (statement[0] in expr) {
        // if internal op returns null - exclude statement for compiler
        if (result = expr[statement[0]](statement, scope)) result[0]===';'?scope.push(...result.slice(1)):scope.push(result)
      }
      else err('Unknown operator `' + statement[0] + '`', statement)
    }
    // FIXME: there's something fishy going on, need streamlining, writing to scope must be a unique thing, not in ; operator
    // NOTE: statements are written to current scope, so we return nothing
  },
  // a,b,c;
  ','([,...members], scope) {
    for (let member of members) {
      // a,b,c
      if (typeof member === 'string') scope.vars[member]||={}
      // a=1,b=2,...
      else if (member[0]==='=') expr['='](member, scope)
      // else err(`Unknown member ${member}`)
    }
    return [',',...members]
  },
  'int'(node){return node},
  'flt'(node){return node},
  // a=b; a,b=b,c; a = () -> b
  '='([,left,right], scope) {
    if (left[0]==='(') left = left[1]
    if (right[0]==='(') right = right[1]

    // =a,b,c    =a|b|c    =expr
    if (Array.isArray(right)) {
      right = right[0] in expr ? expr[right[0]](right, scope) : err('Unknown operation ' + right[0], right)
    }

    // a = b,  a,b=1,2, [x]a =
    // a = ...
    if (typeof left === 'string') {
      let {type} = desc(right, scope.vars)
      if (!scope.vars[left]) scope.vars[left] = {type}
      else {
        scope.vars[left].mutable = true
        if (!scope.vars[left].type) scope.vars[left].type = type
        else if (scope.vars[left].type !== type) err('Changing value type from `' + scope.vars[left].type + '` to ' + '`' + type + '`')
      }
    }
    // (a,b) = ...
    else if (left[0] === ',') {
      // desugar here
      if (left.length !== right.length) err('Unequal number of members in right/left sides of assignment', left)
      let [,...ls]=left, [,...rs]=right;
      // FIXME: narrow down that complexity assignments: not always `tmp/` is necessary
      let count = Object.keys(scope.vars).length
      ls.forEach((id,i) => scope.vars[`tmp${count}/${id}`] = {...(scope.vars[id] = desc(rs[i], scope.vars))} )
      let tmps = ls.map((id,i) => ['=',`tmp${count}/${id}`, rs[i]])
      let untmps = ls.map((id,i) => ['=',ls[i],`tmp${count}/${id}`])
      return [';',[',',...tmps],[',',...untmps]]
    }
    // [size]a = ...
    else if (left[0] === '[' && left.length > 1) {
      let [,size,name]=left
      let sizeType = desc(size, scope.vars).type
      // bad size value error: it must be int
      if (sizeType !== INT) err('Array size is not integer', left)
      scope.vars[name] = {type:PTR, size}
    }
    // *a = ...
    else if (left[0] === '*' && left.length < 3) {
      // *a = ...
      if (typeof left[1] === 'string') (scope.vars[left[1]] = desc(right, scope.vars)).stateful=true
      // *(a,b,c) = ...
      else if (left[1][0] === '(') throw 'Unimplemented'
      else err('Bad syntax `*' + left[1] + '`', left)
    }
    else err('Invalid left-hand side assignment `' + left + '`', left)
    return ['=', left, right]
  },
  // *a or a*b
  '*'([,a,b], scope) {
    // a*b;
    if (b) return ['*',a,b]
    // *a;
    scope.vars[a] = {type:null, stateful:true}
    return ['*',a]
  },
  // +a or a+b
  '+'([,a,b], scope){
    // +a
    if (!b) return ['+', a]
    return ['+',a,b]
  },
  // -a or a-b
  '-'([,a,b], scope){
    // -a
    if (!b) return ['-', a]
    return ['-',a,b]
  },
  '/'([,a,b], scope) {
    return ['/',a,b]
  },
  '-<'(node){return node},
  // a+=b -> a=a+1
  '+='([,left,right], scope){
    let node = ['=',left,['+',left,right]]
    return expr['='](node, scope)
  },
  // @ 'math#sin', @ 'path/to/lib'
  '@'(impNode, scope) {
    if (scope.length > 1) err('Import must be the first node')
    if (scope[0]) err('Import must be in global scope')
    let [,path] = impNode
    if (Array.isArray(path)) path[0] === "'" ? path = path[1] : err('Bad path `' + path + '`')
    let url = new URL('import:'+path)
    let {hash, pathname} = url

    // FIXME: include directive into syntax tree
    // let src = fetchSource(pathname)
    // let include = parse(src)
    // node.splice(node.indexOf(impNode), 1, null, include)

    let lib = stdlib[pathname], members = hash ? hash.slice(1).split(',') : Object.keys(lib)
    for (let member of members) {
      scope.vars[member] = { import: true, type: lib[member][1] }
    }

    return ['@', pathname, members]
  },
  // a,b,c . x
  '.'(expNode, scope) {
    if (scope[0]) err('Export must be in global scope')
    // if (expNode !== node && expNode !== node[node.length-1]) err('Export must be the last node');

    let [,a,b] = expNode

    // a.b
    if (b) throw 'prop access is unimplemented'

    // a.
    if (typeof a === 'string') return (scope.vars[a]||={}).export=true, null

    let result = expr[a[0]]?.(a, scope) // apply analyzer to expression if required

    // save exports
    if (a[0]==='=') {
      let [,l,r] = a
      if (l[0]==='(') [,l]=l; if (r[0]==='(') [,r]=r; // unbracket

      // a=...;
      if (typeof l === 'string') scope.vars[l].export = true
      // a,b=...;
      else if (l[0] === ',') l.slice(1).map(member => {
        scope.vars[member].export = true
      })
      // [2]a = ...
      else if (l[0]==='[') scope.vars[l[2]].export = true
      else err('Unknown export expression `' + a + '`')
    }
    // a,b or a=1,b=2
    else if (a[0]===',') a.slice(1).forEach(item => {
      if (typeof item === 'string') scope.vars[item].export = true
      // a=1,b=2
      else if (item[0] === '=') scope.vars[item[1]].export = true
    })
    return result
  },
  // args -> body
  '->'([,args,body], scope) {
    scope = Object.assign(['->'],{
      vars: Object.create(scope.vars)
    })

    const init = [';']
    if (args) {
      if (args[0]==='(') [,args]=args;
      if (body[0]==='(') [,body]=body;
      if (!args) args = [',']
      else if (args[0] !== ',') args = [',',args]
      // (a,b)->, (a=1,b=2)->, (a=(1;2))->
      for (let arg of args.slice(1)) {
        if (typeof arg === 'string') scope.vars[arg]={arg:true, type:FLOAT}
        else if (arg[0] === '=') scope.vars[arg[1]]={arg:true, type:FLOAT}, init.push(args)
        else if (arg[0] === '-<') scope.vars[arg[1]]={arg:true, type:FLOAT}, init.push(arg)
        else err('Bad arguments syntax', body)
      }
    }

    // args init is handled as regular instructions - it can clarify types after
    expr[';'](init, scope)
    expr[';'](body[0]===';'?body:[';',body[0]==='('?body[1]:body], scope)

    // returned scope has directly list of instructions
    return scope
  },
  '('([,body],scope) {
    scope = Object.assign(['('],{ vars: Object.create(scope.vars) })

    // args init is handled as regular instructions - it can clarify types after
    expr[';'](body[0]===';'?body:[';',body[0]==='('?body[1]:body], scope)

    return scope
  },
  // sin()
  '()'([,name,args], scope) {
    return ['()',name,args]
  },
  // a[]
  '[]'([,a,b]) {
    return ['[]',a,b]
  },
  // [1,2,3]
  '['(node) { return node },
  // a..b
  '..'(node) { return node },
  // a | b, a | x -> y
  '|'([,a,b],scope) {
    let aType = desc(a, scope.vars).type, bType = desc(b, scope.vars).type
    // arg | x -> body,  immediate function gets converted into loop
    if (b[0] === '->') {
      // a | x -> body   becomes    (a = arg; i = 0; i < arg[] <| (x = arg[i]; body))
      let func = expr['->'](b,scope), argName = Object.keys(func.vars)[0]
      // FIXME: modify pipe/args and idx depending on stack callsite, to avoid name conflict in nested pipes
      return expr['('](['(',[';',
        ['=','pipe/arg',a],
        ['=','pipe/idx',['int',0]],
        ['<|',
          ['<','pipe/idx',['int',aType.size]],
          // we gotta pass function arguments to scope
          [';',['=',argName,['[]','pipe/arg','pipe/idx']], ...func.slice(1)]
        ]
      ]], scope)
    }
    // a | filter,   non-immediate function gets called
    else if (bType === FUNC) {

    }
    // a | b,   binary OR
    else {

    }
  },
  // cond <| body
  '<|'([,cond,body],scope) {
    scope = Object.assign(['<|',cond],{
      vars: Object.create(scope.vars)
    })
    // body may have vars scope defined by pipe
    Object.assign(scope.vars, body.vars||{})

    // args init is handled as regular instructions - it can clarify types after
    expr[';'](body[0]===';'?body:[';',body[0]==='('?body[1]:body], scope)

    return ['<|',cond,scope]
  }
}

// get descriptor of a node or variable: includes type and other info
export function desc(node, vars) {
  if (!node) return null // null means type will be detected later?
  if (typeof node === 'string') return vars[node]
  let [op, a, b] = node
  if (op === 'int') return {type:INT}
  if (op === 'flt') return {type:FLOAT}
  if (op === '+' || op === '*' || op === '-') return !b ? desc(a, vars) : (desc(a, vars).type === FLOAT || desc(b, vars).type === FLOAT) ? {type:FLOAT}: {type:INT}
  if (op === '/') return (desc(a, vars).type === INT && desc(b, vars).type === INT) ? {type:INT}: {type:FLOAT}
  if (op === '-<') return desc(a, vars).type === INT && desc(b[1], vars).type === INT && desc(b[2], vars).type === INT ? {type:INT} : {type:FLOAT}
  if (op === '[') return {type:PTR} // pointer is int
  if (op === '->') return {type:FUNC}
  if (op === '[]') return !b ? {type:INT} : {type:FLOAT} // FIXME: array can include other than float values
  if (op === '|') {
    let aDesc = desc(a, vars), bDesc = desc(b, vars)
    if (aDesc.type === PTR) return aDesc
    console.log('todo - detect type from |',a, b)
  }
  err('Cannot define type', node)
}

export function err(msg, node={}) {
  throw Error((msg || 'Bad syntax') + ' `' + node.toString() + '`' )
}

// fetch source file by path - uses import maps algorighm
// FIXME: can extend with importmap
const coreModules = {math:'./math.lino'}
function fetchSource (path) {
  let fullPath = import.meta.resolve(coreModules[path])
  let xhr = new XMLHttpRequest ()
  xhr.open ('GET', fullPath, false /* SYNCHRONOUS XHR FTW :) */)
  xhr.send (null)
  // result = (nodeRequire ('fs').readFileSync (path, { encoding: 'utf8' }))
  return xhr.responseText
}
