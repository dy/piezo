import t, { is, ok, same, throws } from 'tst'
import parse from '../src/parse.js'


t('parse: common', t => {
  is(parse('1+1'), ['+', ['int',1], ['int',1]])
  is(parse('1.0+1.0'), ['+', ['flt',1], ['flt',1]])
  is(parse('a+b-c'), ['-',['+', 'a', 'b'],'c'])
  is(parse(`x([left], v)`), ['(','x',[',',['[','left'],'v']])
})

t('parse: identifiers', t => {
  // permit @#$_
  is(parse('Δx, _b#, c_c, $d0'), [',', 'δx', '_b#','c_c','$d0'])

  // disregard casing
  is(parse('A, Bc, d_E'), [',', 'a', 'bc','d_e'])

  is(parse('Ab_C_F#, $0, Δx'), [',', 'ab_c_f#', '$0', 'δx'])
  is(parse('default=1; eval=fn; else=0'), [';', ['=', 'default', ['int',1]], ['=', 'eval', 'fn'], ['=', 'else', ['int',0]]])
})

t('parse: numbers', t => {
  is(parse('16, 0x10, 0b010000'), [',',['int', 16], ['hex', 16], ['bin', 16]]);
  is(parse('16.0, .1, 1e+3, 2e-3'), [',', ['flt', 16], ['flt', 0.1], ['flt', 1e3], ['flt', 2e-3]]);
  is(parse('true=0b1; false=0b0'), [';', ['=', 'true', ['bin', 1]], ['=', 'false', ['bin', 0]]]);

  throws(() => parse('12.'), /Bad/)
  throws(() => parse('12e+'), /Bad/)
})

t('parse: type cast', t => {
  is(parse('1 / 3; 2 * 3.14'), [';', ['/', ['int', 1],['int', 3]], ['*', ['int', 2], ['flt', 3.14]]]);
  is(parse('3.0 | 0'), ['|', ['flt', 3], ['int', 0]]);
})

t('parse: units', t => {
  is(parse('1k = 1000; 1pi = 3.1415;'), [';', ['=', ['int', 1, 'k'], ['int', 1000]], ['=', ['int', 1, 'pi'], ['flt', 3.1415]], null])
  is(parse('1s = 44100; 1ms = 1s/1000;'), [';',['=',['int',1,'s'],['int',44100]], ['=', ['int',1,'ms'], ['/',['int',1,'s'],['int',1000]]], null], 'useful for sample indexes')
  is(parse('10.1k, 2pi;'),[';', [',', ['flt', 10.1, 'k'], ['int', 2, 'pi']], undefined], 'units deconstruct to numbers: 10100, 6.283')
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
  is(parse('x -< 0..10;'), [';',['-<', 'x', ['..', ['int',0], ['int',10]]],undefined], 'clamp(x, 0, 10)')
  is(parse('x -< ..10;'), [';',['-<', 'x', ['..',undefined,['int',10]]],undefined], 'min(x, 10)')
  is(parse('x -< 0..;'), [';',['-<', 'x', ['..',['int',0],undefined]],undefined], 'max(0, x)')
  is(parse('x -<= 0..10;'), [';',['-<=', 'x', ['..',['int',0],['int',10]]], undefined], 'x = clamp(x, 0, 10)')
})

t('parse: length operator', t => {
  is(parse('[a,b,c][]'), ['[]', ['[', [',','a','b','c']]])
  is(parse('(a,b,c)[]'), ['[]', ['(', [',','a','b','c']]])
  is(parse('"abc"[]'), ['[]', ['"', "abc"]])
  is(parse('(-a..+b)[]'), ['[]', ['(',['..', ['-','a'],['+','b']]]])
})

t('groups', t => {
  is(parse('a, b, c'), [',','a','b','c'], 'groups are syntactic sugar, not data type')
  is(parse('++(a, b, c)'), ['++',['(',[',','a','b','c']]], 'they apply operation to multiple elements: (a++, b++, c++)')
  is(parse('(a, (b, c)) == (a, b, c)'), ['==',['(',[',','a',['(',[',','b','c']]]],['(',[',','a','b','c']]], 'groups are always flat')
  is(parse('a,b,c = d,e,f'), ['=',[',','a','b','c'],[',','d','e','f']], 'assign: a=d, b=e, c=f')
  is(parse('a,b = b,a'), ['=', [',','a','b'], [',', 'b', 'a']], 'swap: temp=a; a=b; b=temp;')
  is(parse('(a,b) + (c,d)'), ['+',['(',[',','a','b']],['(',[',','c','d']]], 'operations: (a+c, b+d)')
  is(parse('(a,b).x'), ['.',['(',[',','a','b']],'x'], '(a.x, b.x);')
  is(parse('(a,b).x()'), ['(',['.',['(',[',','a','b']],'x'],undefined], '(a.x(), b.x());')
  is(parse('a,b,c = (d,e,f)'), ['=',[',','a','b','c'],['(',[',','d','e','f']]], 'a=d, b=e, c=f')
  is(parse('(a,b,c) = d'), ['=',['(',[',','a','b','c']],'d'], 'a=d, b=d, c=d')
  is(parse('a = b,c,d'), ['=','a',[',','b','c','d']], 'a=b, a=c, a=d')
})

t('parse:strings', t => {
  is(parse('hi="hello"'),['=','hi',['"','hello']], 'strings')
  is(parse('string="%hi world"'),['=','string',['"','%hi world']], 'interpolated string: "hello world"')
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
  is(parse('string <~ "l"'),['<~','string',['"','l']], 'rightIndexOf: -2')
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
  is(parse('list <~ item'), ['<~','list','item'],'rfind')
  is(parse('list + 2'), ['+','list',['int',2]],'math operators act on all members')
})

t('parse: errors', t => {
  let log = []
  try { parse('...x') } catch (e) { log.push('...') }
  is(log, ['...'])
})

t('parse: end operator precedence', t => {
  is(parse(`
    x() = 1+2;
  `), ['=', ['(', 'x'], [';',['+', ['int',1], ['int',2]]]])

  is(parse(`
    a,b,c;
  `), [';',[',','a','b','c']])

  is(parse(`
    x() = (1+2);
  `), ['=', ['(', 'x'], [';',['(', ['+', ['int',1], ['int',2]]]]])

  is(parse(`
    x() = (1+2;)
  `), ['=', ['(', 'x'], ['(',[';', ['+', ['int',1], ['int',2]]]]])

  is(parse(`
    x() = (1+2;);
  `), ['=', ['(', 'x'], [';',['(',[';',['+', ['int',1], ['int',2]]]]]])

  is(parse(`
    x() = (a?^b;c)
  `), ['=', ['(', 'x'], ['(',[';', ['?','a',['^','b']],'c']]])

  is(parse(`
    x() = (a?b.c)
  `), ['=', ['(', 'x'], ['(',['?','a',['.','b','c']]]])
})

t('parse: semicolon', t => {
  is(parse(`
      pi2 = pi*2.0;
      sampleRate = 44100;
  `), [';',['=', 'pi2', ['*', 'pi', ['float', 2]]], ['=', 'sampleRate', ['int', 44100]], null]);

  is(parse(`
    x() = 1+2;
  `), [';',['=', ['(', 'x'], ['+', ['int',1], ['int',2]]], undefined])

  is(parse(`
    a,b,c;
  `), [';',[',','a','b','c'], undefined])
})

t('parse: import', t => {
  is(parse(`@'math'`), ['@', ['\'','math']])
  is(parse(`@'math#a'`), ['@', ['\'','math#a']])
  is(parse(`@'math#a,b,c'`), ['@', ['\'','math#a,b,c']])
})

t('parse: sine gen', t => {
  let tree = parse(`
    sine(freq) = (
      *phase=0;
      phase += freq * pi2 / sampleRate;
      [sin(phase)].
  ).`);
  is(tree,
    ['=',
      [
        '(', 'sine', 'freq'
      ],
      ['.', ['(',
          [';',
            ['=',['*', 'phase'],['int',0]],
            ['+=', 'phase', ['/', ['*', 'freq', 'pi2'], 'sampleRate']],
            ['.',['[',['(', 'sin','phase']]]
          ]
        ]
      ]
    ]
  )
})

t('parse: audio-gain', t => {
  let tree = parse(`
    range = 0..1000;

    gain([left], volume <- range) = [left * volume];
    gain([left, right], volume <- range) = [left * volume, right * volume];
    //gain([..channels], volume <- range) = [..channels * volume];

    gain.
  `)
  is(tree, [';',
    ['=', 'range', ['..', ['int',0], ['int',1000]]],
    ['=', ['(', 'gain', [',', ['[', 'left'], ['<-', 'volume', 'range']]], ['[', ['*', 'left', 'volume']]],

    ['=', ['(', 'gain', [',', ['[', [',','left','right']], ['<-', 'volume', 'range']]], ['[', [',',['*', 'left', 'volume'],['*', 'right', 'volume']]]],
    ['.', 'gain']
  ])
})
