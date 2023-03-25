import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'


t('parse: common', t => {
  is(parse('1+1'), ['+', ['int',1], ['int',1]])
  is(parse('1.0+1.0'), ['+', ['flt',1], ['flt',1]])
  is(parse('a+b-c'), ['-',['+', 'a', 'b'],'c'])
  is(parse(`x([left], v)`), ['()','x',[',',['[','left'],'v']])
})

t('parse: identifiers', t => {
  // permit @#$_
  is(parse('Δx, _b#, c_c, $d0'), [',', 'Δx', '_b#','c_c','$d0'])

  // disregard casing
  is(parse('A, Bc, d_E'), [',', 'A', 'Bc','d_E'])

  is(parse('Ab_C_F#, $0, Δx'), [',', 'Ab_C_F#', '$0', 'Δx'])
  is(parse('default=1; eval=fn; else=0'), [';', ['=', 'default', ['int',1]], ['=', 'eval', 'fn'], ['=', 'else', ['int',0]]])
})

t('parse: numbers', t => {
  is(parse('16, 0x10, 0b010000'), [',',['int', 16], ['hex', 16], ['bin', 16]]);
  is(parse('16.0, .1, 1e+3, 2e-3'), [',', ['flt', 16], ['flt', 0.1], ['flt', 1e3], ['flt', 2e-3]]);
  is(parse('true=0b1; false=0b0'), [';', ['=', 'true', ['bin', 1]], ['=', 'false', ['bin', 0]]]);

  // throws(() => parse('12.'), /Bad/)
  throws(() => parse('12e+'), /Bad/)
})

t('parse: type cast', t => {
  is(parse('1 / 3; 2 * 3.14'), [';', ['/', ['int', 1],['int', 3]], ['*', ['int', 2], ['flt', 3.14]]]);
  is(parse('3.0 | 0'), ['|', ['flt', 3], ['int', 0]]);
})

t('parse: units', t => {
  is(parse('1k = 1000; 1pi = 3.1415;'), [';', ['=', ['int', 1, 'k'], ['int', 1000]], ['=', ['int', 1, 'pi'], ['flt', 3.1415]]])
  is(parse('1s = 44100; 1ms = 1s/1000;'), [';',['=',['int',1,'s'],['int',44100]], ['=', ['int',1,'ms'], ['/',['int',1,'s'],['int',1000]]]], 'useful for sample indexes')
  is(parse('10.1k, 2pi;'),[';', [',', ['flt', 10.1, 'k'], ['int', 2, 'pi']]], 'units deconstruct to numbers: 10100, 6.283')
  is(parse('1h2m3.5s'), ['int', 1, 'h', ['int', 2, 'm', ['flt', 3.5, 's']]], 'unit combinations')
})

t('parse: ranges', t => {
  is(parse('1..10'), ['..',['int',1],['int',10]], 'basic range')
  is(parse('1.., ..10'), [',',['..',['int',1],,], ['..',,['int',10]]], 'open ranges')
  is(parse('10..1'), ['..',['int',10],['int',1]], 'reverse-direction range')
  is(parse('1.08..108.0'), ['..',['flt',1.08],['flt',108]], 'float range')
  is(parse('0>..10, 0..<10, 0>..<10'), [',',['>..', ['int',0], ['int',10]],['..<',['int',0],['int',10]],['>..<',['int',0],['int',10]]], 'non-inclusive ranges')
  is(parse('(x-1)..(x+1)'), ['..', ['(',['-','x',['int',1]]], ['(',['+','x',['int',1]]]], 'calculated ranges')
  is(parse('(-10..10)[]'), ['[]',['(', ['..',['-',['int',10]], ['int',10]]]], 'length (20)')
})

t('parse: standard operators', t => {
  is(parse('a + b - c * d / e % f ** g'), ['-', ['+', 'a', 'b'], ['%', ['/', ['*', 'c', 'd'], 'e'], ['**', 'f', 'g']]], 'arithmetical (** for pow)')
  is(parse('a && b || !c'), ['||', ['&&', 'a', 'b'], ['!', 'c']], 'logical')
  is(parse('a & b | c ^ ~d'), ['|', ['&', 'a', 'b'], ['^', 'c', ['~','d']]],  'int / binary ops')
  is(parse('a == b != c >= d <= e'), ['!=', ['==', 'a', 'b'], ['<=', ['>=', 'c', 'd'], 'e']], 'comparisons')
})

t('parse: clamp operator', t => {
  is(parse('x -< 0..10;'), [';',['-<', 'x', ['..', ['int',0], ['int',10]]]], 'clamp(x, 0, 10)')
  is(parse('x -< ..10;'), [';',['-<', 'x', ['..',undefined,['int',10]]]], 'min(x, 10)')
  is(parse('x -< 0..;'), [';',['-<', 'x', ['..',['int',0],undefined]]], 'max(0, x)')
  is(parse('x -<= 0..10;'), [';',['-<=', 'x', ['..',['int',0],['int',10]]]], 'x = clamp(x, 0, 10)')
})

t('parse: length operator', t => {
  is(parse('[a,b,c][]'), ['[]', ['[', [',','a','b','c']]])
  is(parse('(a,b,c)[]'), ['[]', ['(', [',','a','b','c']]])
  is(parse('"abc"[]'), ['[]', ['"', "abc"]])
  is(parse('(-a..+b)[]'), ['[]', ['(',['..', ['-','a'],['+','b']]]])
})

t('parse: groups', t => {
  is(parse('a, b, c'), [',','a','b','c'], 'groups are syntactic sugar, not data type')
  is(parse('++(a, b, c)'), ['++',['(',[',','a','b','c']]], 'they apply operation to multiple elements: (a++, b++, c++)')
  is(parse('(a, (b, c)) == (a, b, c)'), ['==',['(',[',','a',['(',[',','b','c']]]],['(',[',','a','b','c']]], 'groups are always flat')
  is(parse('a,b,c = d,e,f'), ['=',[',','a','b','c'],[',','d','e','f']], 'assign: a=d, b=e, c=f')
  is(parse('a,b = b,a'), ['=', [',','a','b'], [',', 'b', 'a']], 'swap: temp=a; a=b; b=temp;')
  is(parse('(a,b) + (c,d)'), ['+',['(',[',','a','b']],['(',[',','c','d']]], 'operations: (a+c, b+d)')
  is(parse('(a,b).x'), ['.',['(',[',','a','b']],'x'], '(a.x, b.x);')
  is(parse('(a,b).x()'), ['()',['.',['(',[',','a','b']],'x']], '(a.x(), b.x());')
  is(parse('a,b,c = (d,e,f)'), ['=',[',','a','b','c'],['(',[',','d','e','f']]], 'a=d, b=e, c=f')
  is(parse('(a,b,c) = d'), ['=',['(',[',','a','b','c']],'d'], 'a=d, b=d, c=d')
  is(parse('a = b,c,d'), ['=','a',[',','b','c','d']], 'a=b, a=c, a=d')
})

t('parse: strings', t => {
  is(parse('hi="hello"'),['=','hi',['"','hello']], 'strings')
  is(parse('string="{hi} world"'),['=','string',['"','{hi} world']], 'interpolated string: "hello world"')
  is(parse('"\u0020", "\x20"'),[',',['"','\u0020'],['"','\x20']], 'unicode or ascii codes')
  is(parse('string[1]; string.1'),[';',['[]','string',['int',1]],['.','string','1']], 'positive indexing from first element [0]: \'e\'')
  is(parse('string[-3]'),['[]','string',['-',['int',3]]],[], 'negative indexing from last element [-1]: \'r\'')
  is(parse('string[2..10]'),['[]','string',['..',['int',2],['int',10]]], 'substring')
  is(parse('string[1, 2..10, -1]'),['[]','string',[',',['int',1],['..',['int',2],['int',10]],['-',['int',1]]]], 'slice/pick multiple elements')
  is(parse('string[-1..0]'),['[]','string',['..',['-',['int',1]],['int',0]]], 'reverse')
  is(parse('string[]'),['[]','string'], 'length')
  is(parse('string == string'),['==','string','string'], 'comparison (==,!=,>,<)')
  is(parse('string + string'),['+','string','string'], 'concatenation: "hello worldhello world"')
  is(parse('string - string'),['-','string','string'], 'removes all occurences of the right string in the left string: ""')
  is(parse('string / string'),['/','string','string'], 'split: "a b" / " " = ["a", "b"]')
  is(parse('string * list'),['*','string','list'], 'join: " " * ["a", "b"] = "a b"')
  is(parse('string ~> "l"'),['~>','string',['"','l']], 'indexOf: 2')
  is(parse('string ~< "l"'),['~<','string',['"','l']], 'rightIndexOf: -2')
})

t('parse: lists', t => {
  is(parse('list = [1, 2, 3]'), ['=','list',['[',[',',['int',1],['int',2],['int',3]]]],'list from elements')
  is(parse('list = [l:2, r:4]'), ['=','list',['[',[',',[':','l',['int',2]], [':','r',['int',4]]]]],'list with aliases')
  is(parse('[0..10]'), ['[',['..',['int',0],['int',10]]],'list from range')
  is(parse('[0..8 | i -> i*2]'), ['[',['|', ['..',['int',0],['int',8]], ['->', 'i', ['*', 'i', ['int', 2]]]]],'list comprehension')
  is(parse('[2]list = list1'), ['=',['[',['int',2],'list'],'list1'], '(sub)list of fixed size')
  is(parse('list.0, list.1'), [',',['.','list','0'],['.','list','1']],'short index access notation')
  is(parse('list.l = 2'), ['=',['.','list','l'], ['int', 2]],'alias index access')
  is(parse('list[0]'), ['[]','list',['int',0]],'positive indexing from first element [0]: 2')
  is(parse('list[-2]=5'), ['=',['[]','list',['-',['int',2]]],['int',5]],'negative indexing from last element [-1]: list becomes [2,4,5,8]')
  is(parse('list[]'), ['[]','list'], 'length')
  is(parse('list[1..3, 5]'), ['[]','list',[',',['..',['int',1],['int',3]],['int',5]]], 'slice')
  is(parse('list[5..]'), ['[]','list',['..',['int',5],undefined]],'slice')
  is(parse('list[-1..0]'), ['[]','list',['..',['-',['int',1]],['int',0]]],'reverse')
  is(parse('list | x -> x * 2'), ['|','list',['->','x',['*','x',['int',2]]]],'iterate/map items')
  is(parse('list ~> item'), ['~>','list','item'],'find index of the item')
  is(parse('list ~< item'), ['~<','list','item'],'rfind')
  is(parse('list + 2'), ['+','list',['int',2]],'math operators act on all members')
})

t('parse: statements', t => {
  is(parse('foo()'), ['()','foo'], 'semi-colons at end of line are mandatory')
  is(parse('(c = a + b; c)'), ['(',[';',['=','c',['+','a','b']],'c']], 'parens define block, return last element')
  is(parse('(a=b+1; a,b,c)'), ['(',[';',['=','a',['+','b',['int',1]]],[',','a','b','c']]], 'block can return group')
  is(parse('(a ? ^b; c)'), ['(',[';',['?','a',['^','b']],'c']], 'return/break operator can preliminarily return value')
  is(parse('(foo(); bar();)'), ['(',[';',['()','foo'],['()','bar']]], 'semi-colon after last statement returns void')
})

t('parse: conditions', t => {
  is(parse(`sign = a < 0 ? -1 : +1`), ['=','sign',['?',['<','a',['int',0]], ['-',['int',1]], ['+',['int',1]]]], 'inline ternary')
  is(parse('a > b ? ++b'), ['?',['>','a','b'],['++','b']], 'if operator')
  is(parse('a > b ?: ++b'), ['?:', ['>','a','b'], ['++','b']], 'elvis operator (else if)')
  // FIXME: confusable with a > -b
  // is(parse('a,b,c >- x ? a : b : c'), ['?', ['>-', [',','a','b','c'], [':','a','b','c']]], 'switch operator')
  is(parse(`2+2 >= 4 ?        // multiline ternary
    a
  : "a" < "b" ?               // else if
    b
  : (c)`), ['?',
    ['>=', ['+',['int',2],['int',2]], ['int',4]],
    'a',
    ['?',
      ['<', ['"','a'],['"','b']],
      'b',
      ['(','c']
    ],
  ], 'multiline ternary')
})

t('parse: loops', t => {
  is(parse('s[] < 50 <| (s += ", hi")'),['<|',['<',['[]','s'],['int',50]],['(',['+=','s',['"',', hi']]]], 'inline loop: `while (s.length < 50) do (s += ", hi)"`')
  is(parse(`
  (i=0; ++i < 10 <| (             // multiline loop
    i < 3 ? ^^;                   // \`^^\` to break loop (can return value as ^^x)
    i < 5 ? ^;                    // \`^\` to continue loop (can return value as ^x)
  ))`), ['(',[';',
    ['=','i',['int',0]],
    ['<|',
      ['<',['++','i'],['int',10]],
      ['(',[';',['?',['<','i',['int',3]],['^^']],['?',['<','i',['int',5]],['^']]]]
    ]
  ]], 'multiline loop')
  is(parse('[++j < 10 <| j * 2]'),['[',['<|',['<',['++','j'],['int',10]],['*','j',['int',2]]]], 'list comprehension via loop')
})

t('parse: functions', () => {
  is(parse('double = n -> n*2'), ['=','double', ['->', 'n', ['*','n',['int',2]]]], 'inline function')
  is(parse(`triple = (n=1) -> (
    n == 0 ? ^n;                // preliminarily return n
    n*3                         // returns last value
  )`), ['=','triple',['->',['(',['=','n',['int',1]]], ['(',[';',['?',['==','n',['int',0]], ['^','n']],['*','n',['int',3]]]]]], 'multiline')
  is(parse('triple()'), ['()','triple'],                     '3')
  is(parse('triple(5)'), ['()','triple',['int',5]],                    '15')
  is(parse('triple(n: 10)'), ['()','triple',[':','n',['int',10]]],                '30. named argument.')
  is(parse('copy = triple'), ['=','copy','triple'],                'capture function')
  is(parse('copy(10)'), ['()','copy',['int',10]],                     'also 30')
  is(parse('clamp = (v -< 0..10) -> v'), ['=','clamp',['->',['(',['-<','v',['..',['int',0],['int',10]]]],'v']],    'clamp argument')
  is(parse('x = () -> 1,2,3'), ['=','x',['->',['('],[',',['int',1],['int',2],['int',3]]]],              'return group (multiple values)')
  is(parse('mul = ([]in, amp) -> in*amp'), ['=','mul',['->',['(',[',',['[','','in'],'amp']],['*','in','amp']]],  'list argument')
  is(parse('mul = ([8]in, amp) -> in*amp'), ['=','mul',['->',['(',[',',['[',['int',8],'in'],'amp']],['*','in','amp']]], 'sublist argument')
})

t('parse: stateful variables', t => {
  is(parse(`
    a = () -> ( *i=0; ++i );      // stateful variable persist value between fn calls
    a(), a();                     // 0, 1
  `), [';',
    ['=','a',['->',['('],['(',[';',['=',['*','i'],['int',0]],['++','i']]]]],
    [',',['()','a'],['()','a']]
  ])
  is(parse('*[4]i'), ['*',['[',['int',4],'i']], 'memory')
  is(parse(`b = () -> (                   //
    *[4]i;                      // memory of 4 items
    i.0 = i.1+1;                // read previous value
    i.0                         // return currrent value
  );`),[';',['=','b',['->',['('], [ '(', [';',
    ['*',['[',['int',4],'i']],
    ['=',['.','i','0'],['+',['.','i','1'],['int',1]]],
    ['.','i','0']
  ]]]]])
  is(parse('b(), b(), b();'),[';',[',',['()','b'],['()','b'],['()','b']]], '1, 2, 3')
})

t('parse: map', () => {
  is(parse('[a, b, c] | x -> a(x)'), ['|',['[',[',','a','b','c']],['->','x',['()','a','x']]],      'maps list to new list')
  is(parse('(a, b, c) | a -> a.x * 2'), ['|',['(',[',','a','b','c']],['->','a',['*',['.','a','x'],['int',2]]]],   'maps group items (syntactically)')
  is(parse(`
  10..1 | i -> (                // iteration over range (produces group)
    i < 3 ? ^^;                 // \`^^\` breaks iteration
    i < 5 ? ^;                  // \`^\` continues iteration
  );                            // returns group
  `), [';',['|',['..',['int',10],['int',1]],['->','i',['(',[';',
    ['?',['<','i',['int',3]], ['^^']],
    ['?',['<','i',['int',5]], ['^']]
  ]]]]])
  is(parse('[ 1..10 | x -> x * 2 ]'), ['[',['|',['..',['int',1],['int',10]],
    ['->','x',['*','x',['int',2]]]
  ]],     'list comprehension')
})

t('parse: fold', () => {
  is(parse('items |> (sum,x) -> sum+x'), ['|>','items',['->',['(',[',','sum','x']], ['+','sum','x']]],  'fold operator with reducer')
  is(parse('(a,b,c) |> (a,b) -> a + b'), ['|>',['(',[',','a','b','c']],['->',['(',[',','a','b']],['+','a','b']]],  'can be applied to groups (syntax sugar)')
  is(parse('[a,b,c] |> (a,b) -> a + b'), ['|>',['[',[',','a','b','c']],['->',['(',[',','a','b']],['+','a','b']]],  'can be applied to lists')
})

t('parse: import', () => {
  is(parse('@ \'./path/to/module\''), ['@',["'",'./path/to/module']],       'any file can be imported directly')
  is(parse('@ \'math\''), ['@',["'",'math']],                   'or defined via import-maps.json')
  is(parse('@ \'my-module#x,y,z\''), ['@',["'",'my-module#x,y,z']],        'import selected members')

  is(parse(`@'math'`), ['@', ['\'','math']])
  is(parse(`@'math#a'`), ['@', ['\'','math#a']])
  is(parse(`@'math#a,b,c'`), ['@', ['\'','math#a,b,c']])
})

t('parse: export', () => {
  is(parse('x, y, z.'),['.',[',','x','y','z']])
  is(parse('x=1;x.'),[';',['=','x',['int',1]],['.','x']])
  is(parse('x=1.'),['.',['=','x',['int',1]]])
  // throws(() => parse('x, y, z. y'), /export/i)
})

t('parse: triple dots error', t => {
  let log = []
  try { console.log(parse('...x')) } catch (e) { log.push('...') }
  is(log, ['...'])
})

t('parse: endings', t => {
  is(parse(`
    x() = 1+2;
  `), [';',['=', ['()', 'x'], ['+', ['int',1], ['int',2]]]], 'a')

  is(parse(`
    a,b,c;
  `), [';',[',','a','b','c']], 'b')

  is(parse(`
    x() = (1+2);
  `), [';',['=', ['()', 'x'], ['(', ['+', ['int',1], ['int',2]]]]], 'c')

  is(parse(`
    x() = (1+2;)
  `), ['=', ['()', 'x'], ['(',[';', ['+', ['int',1], ['int',2]]]]], 'd')

  is(parse(`
    x() = (1+2;);
  `), [';',['=', ['()', 'x'], ['(',[';',['+', ['int',1], ['int',2]]]]]], 'e')

  is(parse(`
    x() = (a?^b;c)
  `), ['=', ['()', 'x'], ['(',[';', ['?','a',['^','b']],'c']]], 'f')

  is(parse(`
    x() = (a?b.c)
  `), ['=', ['()', 'x'], ['(',['?','a',['.','b','c']]]], 'g')
})

t('parse: semicolon', t => {
  is(parse(`
      pi2 = pi*2.0;
      sampleRate = 44100;
  `), [';',
    ['=', 'pi2', ['*', 'pi', ['flt', 2]]],
    ['=', 'sampleRate', ['int', 44100]]
  ]);

  is(parse(`
    x() = 1+2;
  `), [';',['=', ['()', 'x'], ['+', ['int',1], ['int',2]]]])

  is(parse(`
    a,b,c;
  `), [';',[',','a','b','c']])
})

t('parse: sine gen', t => {
  let tree = parse(`
    sine(freq) = (
      *phase=0;
      phase += freq * pi2 / sampleRate;
      [sin(phase)]
  )`);
  is(tree,
    ['=',
      ['()', 'sine', 'freq'],
      ['(',
        [';',
          ['=',['*', 'phase'],['int',0]],
          ['+=', 'phase', ['/', ['*', 'freq', 'pi2'], 'sampleRate']],
          ['[',['()', 'sin','phase']]
        ]
      ]
    ]
  )
})

