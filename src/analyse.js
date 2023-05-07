// analyser converts AST into IR, able to be compiled after
// it exposes normalized form with static info / scopes
// independent of particular compiler/memory layout, so that can be compiled to any target after
import parse from './parse.js';
import stdlib from './stdlib.js';
import {PTR, FLOAT, INT, RANGE, STR, FUNC,NAN} from './const.js';

// detect variables & types, simplify tree for easier compilation
export default function analyze(node) {
  if (typeof node === 'string') node = parse(node)
  if (typeof node === 'string') return [null, node]

  // scope defines current variables
  let scope = Object.create(null)

  // process/analyze node within defined scope
  function expr(node, tmpScope) {
    if (!node || typeof node === 'number') return node

    let parent, result;
    if (tmpScope) parent = scope, scope = tmpScope;
    else if (typeof node === 'string') scope[node]||={}, result = node
    else if (node[0] in expr) result = expr[node[0]](node)
    else result = node.map((it,id)=>!id ? it : expr(it))

    if (parent) scope = parent
    return result
  }

  // Create temp variable within the scope
  function temp(name, init) {
    let idx = ''
    while (Object.hasOwnProperty.call(scope, name + idx)) idx = (idx || 0) + 1;
    scope[name + idx] = desc(init, scope)
    return ['=', name + idx, init]
  }

  // each expression takes input node (considering current scope), returns output node with defined scope on it
  Object.assign(expr, {
    // a;b;c
    ';'(node) { return node.map((it,id)=>!id?it:expr(it)).filter(Boolean) },
    // *a or a*b
    '*'([,a,b]) {
      // a*b;
      if (b) return ['*',expr(a),expr(b)]
      // *a;
      if (typeof a === 'string') {
        if (Object.hasOwnProperty.call(scope, a)) err('Redefining stateful variable ' + a)
        scope[a] = {stateful:true}
        return a
      }
    },
    // a+=b -> a=a+1
    '+='([,a,b]){ return a = expr(a), b = expr(b), ['=',a,['+',a,b]]},

    // a&&b -> tmp=a; tmp ? b : tmp
    '&&'([,a,b]) { let lhs = temp('lhs',expr(a)); return [';',lhs,['?:',lhs[1],expr(b),lhs]] },
    // a||b -> tmp=a; tmp ? tmp : a
    '||'([,a,b]) { let lhs = temp('lhs',expr(a)); return [';',lhs,['?:',lhs[1],lhs,expr(b)]] },

    // a=b; a,b=b,c; a = () -> b
    '='([,left,right]) {
      // (a,b,c) = (d,e,f)
      if (left[0]==='(') left = left[1]
      if (right[0]==='(') right = right[1]

      // =a,b,c    =a|b|c    =expr
      // right = expr(right)

      // a = b,  a,b=1,2, [x]a =
      // a = ...
      if (typeof left === 'string') {
        if (right[0] === ',') err('Assigning multiple values to a single value ' + left, right)
        right = expr(right)
        let rDesc = desc(right, scope)
        if (!scope[left]) scope[left] = rDesc
        else {
          scope[left].mutable = true
          if (!scope[left].type) Object.assign(scope[left], rDesc)
          // FIXME: figure out if we should permit changing type
          // else if (scope[left].type !== rDesc.type) err('Changing value type from `' + scope[left].type + '` to ' + '`' + rDesc.type + '`')
        }
        return ['=',left,right]
      }

      // x(a,b) - define function: brings arg initializers to fn body keeping only arg names
      if (left[0] === '()') {
        let [,name,args] = left
        if (!scope[name]) scope[name] = {type: FUNC}
        else err('Redefining function `' + name + '`')

        let parent = scope
        scope = Object.create(scope)

        let inits = [';'], body = Object.assign(['('], {
          scope,
          result:null // result type
        })

        // retrieve initializers from args
        if (args) {
          if (args[0]==='(') [,args]=args;
          args = !args ? [] : args[0] === ',' ? args.slice(1) : [args];
          args = args.map(arg => {
            let name, init
            // x(a,b)
            if (typeof arg === 'string') name = arg
            // x(a=1,b=2), x(a=(1;2))
            else if (arg[0]==='=') [,name,init] = arg, inits.push(['&&',['==',name,[NAN]],['=',name,init]])
            // x(x-<2)
            else if (arg[0]==='-<') [,name,init] = arg, inits.push(['-<=',name,init])

            // we enforce fn args to be always float, since NaNs can only be floats
            ;(scope[name] = {type:FLOAT}).arg = true
            return name
          })
        }
        body.push(expr(inits))
        let content = expr(right[0]==='(' ? right[1] : right)
        body[1].push(...(content[0] === ';' ? content.slice(1) : [content]))
        body.result = desc(body[0] === ';' ? body[body.length - 1] : body, scope) // detect result type
        scope = parent
        return ['=',['()',name, [',',...args]], body]
      }

      // *a = ..., *(a,b,c) = ...
      if (left[0] === '*' && left.length < 3) return ['=',expr(left),expr(right)]

      // (a,b) = ...
      if (left[0] === ',') {
        // desugar here
        if (left.length !== right.length) err('Unequal number of members in right/left sides of assignment', left)
        let [,...ls]=left, [,...rs]=right;
        // FIXME: narrow down that complexity assignments: not always `tmp/` is necessary
        // FIXME: add callsite id to that tmp variable
        // FIXME: make sure left side contains only names or props
        let temp = ls.map((id,i) => ['=',`tmp/${id}`, rs[i]])
        let untemp = ls.map((id,i) => ['=',expr(ls[i]),`tmp/${id}`]) // catch left ids into current scope
        return expr(['(',[';',...temp,[',',...untemp]]])
      }

      // x[i] = ...
      if (left[0] === '[]') {
        let [,obj,prop] = left
        return ['=', ['[]',expr(obj),expr(prop)], expr(right)]
      }
      // x.1 = ...
      if (left[0] === '.') {
        let [,obj,idx] = left
        // FIXME: recognize alias like x.first, x.last
        return ['=', ['.',expr(obj),idx], expr(right)]
      }

      err('Invalid left-hand side assignment `' + left + '`', left)
    },

    '('([,body]) {
      // create a new scope for parens
      let parent = scope
      scope = Object.create(scope)

      // FIXME: note that internal scope may get lost here (hope not)
      while (body[0]==='(' && body.length == 2) body = body[1]
      body = ['(',expr(body)]
      body.scope = scope
      scope = parent
      return body
    },
    // (args) -> (body), - syntax sugar
    '->'([,args,body]) {
      let parent = scope
      scope = Object.create(scope)

      let init = [';'], out = Object.assign(['->'], {
        scope,
        result:null // result type
      })
      if (args) {
        if (args[0]==='(') [,args]=args;
        args = !args ? [] : args[0] === ',' ? args.slice(1) : [args];
        // (a,b)->, (a=1,b=2)->, (a=(1;2))->
        for (let arg of args) {
          if (typeof arg === 'string') scope[arg]={arg:true, type:FLOAT}, out.args.push(arg)
          else if (arg[0] === '=') scope[arg[1]]={arg:true, type:FLOAT}, init.push(arg), out.args.push(arg[1])
          else if (arg[0] === '-<') scope[arg[1]]={arg:true, type:FLOAT}, init.push(arg), out.args.push(arg[1])
          // FIXME: array arguments
          else err('Bad arguments syntax', body)
        }
      }

      out.push(expr(init), body = expr(body[0]==='(' ? body[1] : body))
      out.result = desc(body[0] === ';' ? body[body.length - 1] : body, scope) // detect result type
      scope = parent
      return out
    },

    // a | b, a | x -> y
    '|'([,a,b]) {
      // arg | (x,i) -> body,  immediate function gets converted into loop
      if (b[0] === '->') {
        let fn = expr(b), [argName, idxName] = fn.args, pipeVars, pipeArg, pipeIdx, pipeLen

        // FIXME: arguments must be simple here

        // FIXME: modify pipe/args and idx depending on stack callsite, to avoid name conflict in nested pipes
        // a | (x,idx) -> body   becomes    arg = a; i = 0; i < arg[] <| (idx=i; x = arg[i]; i++; body)
        let parent = scope
        scope = fn.scope;

        // pipe temp vars with resolved names
        [[,pipeArg], [,pipeIdx], [,pipeLen]] = pipeVars = [
          temp('pipe/arg',a),// ['=','pipe/arg',a],
          temp('pipe/idx',['int',0]),// ['=','pipe/idx',['int',0]],
          temp('pipe/len',['[]','pipe/arg'])// ['=','pipe/len',['[]','pipe/arg']],
        ]

        let out = ['(',expr([';',
          ...pipeVars,
          ['<|',
            ['<',pipeIdx,pipeLen],
            [';',
              argName && ['=',argName,['[]',pipeArg,pipeIdx]],
              idxName && ['=',idxName,pipeIdx],
              ['++',pipeIdx],
              fn[2] // write only body
            ]
          ]
        ])]
        out.scope = scope
        scope = parent
        return out;
      }
      // a | b,   binary OR
      else return ['|',expr(a),expr(b)]
    },
    // cond <| body
    '<|'([,cond,body]) {
      return ['<|', expr(cond), expr(body[0]!='('?['(',body]:body)]
    },

    // @ 'math#sin', @ 'path/to/lib'
    '@'([,path]) {
      // FIXME: if (scope.length > 1) err('Import must be the first node')
      if (Object.getPrototypeOf(scope)) err('Import must be in global scope')
      if (Array.isArray(path)) path[0] === "'" ? path = path[1] : err('Bad path `' + path + '`')
      let url = new URL('import:'+path)
      let {hash, pathname} = url

      // FIXME: include directive into syntax tree
      // let src = fetchSource(pathname)
      // let include = parse(src)
      // node.splice(node.indexOf(impNode), 1, null, include)

      let lib = stdlib[pathname], members = hash ? hash.slice(1).split(',') : Object.keys(lib)
      for (let member of members) {
        scope[member] = { import: pathname, type: lib[member][1] }
      }
      // we return nothing since member is marked as imported
    },

    // a,b,c . x?
    '.'([,a,b], skip=false) {
      // a.b
      if (b) err('prop access is unimplemented ' + a + b, a)

      // a.
      if (Object.getPrototypeOf(scope)) err('Export must be in global scope')
      // FIXME: if (expNode !== node && expNode !== node[node.length-1]) err('Export must be the last node');

      if (!skip) a = expr(a)

      if (typeof a === 'string') scope[a].export=true

      // a=b
      else if (a[0]==='=') {
        let [,l,r] = a
        if (l[0]==='(') [,l]=l; if (r[0]==='(') [,r]=r; // unbracket
        // a=...;
        if (typeof l === 'string') scope[l].export = true
        // a()=;
        else if (l[0]==='()') scope[l[1]].export = true
        else err('Unknown export expression `' + a + '`')
      }

      // a,b  or  a=1,b=2
      else if (a[0]===',') {
        a.slice(1).forEach(a => expr['.'](['.',a], true))
      }
      // TODO (a) or (a,b,c)
      else if (a[0]==='(') {
        let members = a[1][0]===';'?a[1][a[1].length-1]:a[1]
        if (members[0]!==',') members = [',',members]
        members.slice(1).forEach(a => expr['.'](['.',a], true))
      }
      else err('Unknown expr ' + a[0], a)

      // we get rid of '.' for compiler, since all vars are marked as exported
      return a
    },

    // [1,2,[3,4]]
    '['([,init]) {
      if (!init) init = [',']
      // flatten & make sure output is list
      if (init[0]!==',') init = [',',init]
      let members = [',']
      for (let m of init.slice(1)) {
        m = expr(m)
        m[0] === '[' ? members.push(...m[1].slice(1)) : members.push(m)
      }
      return ['[',members]
    },

    // a(), a(x,y)
    '()'([,name,args]) {
      args = !args ? [','] : args[0]===',' ? args : [',',args]
      return ['()',name,args]
    }
  })

  // evaluate
  node = expr(node)

  // (a) -> (a);, to provide global scope
  if (node[0] !== ';') node = [';',node]

  // mark all global vars
  for (let n in scope) scope[n].global = true
  node.scope ||= scope

  return node
}


/**
 * get descriptor of a node or variable: includes type and other info
 * {
 *   type,   - value type - INT, FLOAT, RANGE, PTR (Array)
 *   static?, - if value can be statically precalculated (like prop values)
 *   min?, max?, - range value limits (descriptors)
 *   multiple? - if result of node is multiple items, like sequence or array.
 * }
**/
export function desc(node, scope) {
  if (!node) err('Bad node')
  if (typeof node === 'string') return scope[node] || err('Cannot get descriptor of node', node)
  if (typeof node === 'number') return

  if (node._desc) return node._desc // cached descriptor

  let [op, a, b, c] = node
  if (op === INT || op === FLOAT || op === NAN) return { type: op, static: true}

  // use node scope
  let prevScope = node.scope || scope
  scope = node.scope || scope

  let aDesc = a&&desc(a,scope), bDesc = b&&desc(b,scope), cDesc = c&&desc(c,scope),
      s = (cDesc||aDesc)?.static && bDesc?.static

  const opDesc = {
    '*'() {
      if (aDesc.type === FLOAT || bDesc.type === FLOAT) return {type:FLOAT, static:s}
      return {type:INT, static:s}
    },
    '+'() {
      if (!b) return {...aDesc}
      return {...opDesc['*']()}
    },
    '-'() { return {...opDesc['+']()} },
    '++'() { return {...opDesc['+']()} },
    '--'() { return {...opDesc['+']()} },
    '/'() {
      // FIXME: detect possiblt int type result
      // return (desc(a, scope).type === INT && desc(b, scope).type === INT) ? {type:INT} : {type:FLOAT}
      return {type:FLOAT, static:s}
    },
    '='() { return bDesc },
    '&&'() { return bDesc },
    '||'() { return bDesc },
    '=='() { return {type:INT, static:s} },
    '-<'() {
      // FIXME: detect range type better (range is separate type)
      if (bDesc.type === RANGE) {
        return aDesc.type === INT && (!bDesc.min || bDesc.min.type === INT) && (!bDesc.max || bDesc.max.type === INT) ? {static:s, type:INT} : {static:s, type:FLOAT}
      }
      err('Right part of clamp operator is not range', node)
    },
    '?:'() {
      return bDesc.type === INT && cDesc.type === INT ? {static:s, type:INT} : {static:s, type:FLOAT}
    },
    '..'() {
      return {type: RANGE, min: a && aDesc, max: b && bDesc, static:s }
    },
    '['() { return {type:PTR} },
    // '->'() { return {type:FUNC} },
    '[]'() {
      return !b ? {type:INT} : {type:FLOAT} // FIXME: array can include other than float values
    },
    '|'() {
      if (aDesc.type === PTR) return {...aDesc}
      console.log('todo - detect type from |',a, b)
    },
    ';'() { return {...desc(node[node.length - 1], scope)} },
    ','() { return {...desc(node[node.length - 1], scope), multiple:true} },
    '<|'() { return {...bDesc, multiple: true}; },
    '('() { return aDesc },
  }

  if (opDesc[op]) {
    if (node.length < 2) return {}; // artifacts like [,] or [;]
    let desc = node._desc = opDesc[op]()
    scope = prevScope // recover scope
    return desc
  }

  err('Unknown descriptor of ' + op, node)
}

export function err(msg, node={}) {
  // Promise.resolve().then(() => {
    throw Error((msg || 'Bad syntax') + ' `' + node.toString() + '`' )
  // })
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
