import t, { is, ok, same, throws } from 'tst'
import desugar, {unbracket, flatten} from '../src/desugar.js'

t('desugar: unbracket', () => {
  is(unbracket('x'), 'x')
  is(unbracket(['x']), ['x'])
  is(unbracket(['*','x','y']), ['*','x','y'])
  is(unbracket(['(',['*','x','y']]), ['*','x','y'])
  is(unbracket(['(',['*',['(','x'],'y']]), ['*','x','y'])
  is(unbracket(['+','a',['(',['*',['(','x'],'y']]]), ['+','a',['*','x','y']])
})

t('desugar: flatten', () => {
  is(flatten([',','a',[',','b','c']]), [',','a','b','c'])
  is(flatten(unbracket(['(',[',','a',['(',[',','b','c']]]])), [',','a','b','c'])
})

t.todo('desugar: deconstruct', () => {
  is(desugar(['=', 'a','b']), ['=','a','b'])
  // a, b, c;                      // groups are syntactic sugar, not tuple data type
  // (a, b, c)++;                  // they apply operation to multiple elements: (a++, b++, c++)
  // (a, (b, c)) == a, b, c;       // groups are always flat
  // (a, (b, c)) = a, b, c;       // groups are always flat
  is(desugar(
    ['=',['(',[',','a',['(',[',','b','c']]]], [',','c','b','a']]),
    [',',['=','~0','c'],['=','~1','b'],['=','~2','a'],['=','a','~0'],['=','b','~1'],['=','c','~2']]
  )
  // a,b,c = d,e,f;                // assign: a=d, b=e, c=f
  // a,b = b,a;                    // swap: temp=a; a=b; b=temp;
  // (a,b) + (c,d);                // operations: (a+c, b+d)
  // (a,b).x;                      // (a.x, b.x);
  // (a,b).x();                    // (a.x(), b.x());
  // a,b,c = (d,e,f);              // a=d; b=e; c=f
  // (a,b,c) = d;                  // a=d, b=d; c=d
  // a = b,c,d;                    // a=b, a=c, a=d
  // a = b, c = d;                 // a = b, a = c cnote difference with JS
  // b -< (a,b,c);
})