import t, { is, ok, same } from 'tst'
import parse from '../src/parse.js'
import analyze from '../src/analyze.js'

function wat(ir) {
  let {functions, exports} = ir
  return `(module
    ${Object.keys(functions).map(name => {
      let clauses = functions[name]
      if (clauses.length < 2) {
        let {args, body} = clauses[0]
        console.log(body)
        return `(func $${name} ${args.map(name => `(param $${name} f64)`).join(' ')})`
      }
      else {

      }
    })}
    ${Object.keys(exports).map(name => `(export "${name}" (${exports[name]==='function' ? 'func' : 'global'} $${name}))`)}
  )`
}

t.only('basics: no-end', t => {
  let ir = analyze(parse(`
    mult(a, b) = a * b.
  `))
  ok(ir.functions.mult)
  is(ir.functions.mult[0].body.length, 1)

  isCode(wat(ir), `
  (module
    (func $mult (param $a f64) (param $b f64)
    )
    (export "mult" (func $mult))
  )
  `)
})

t.todo('readme: audio-gain', t => {
  is(analyze(parse(`
    range = 0..1000;

    gain([left], volume ~= range) = [left * volume];
    gain([left, right], volume ~= range) = [left * volume, right * volume];
    //gain([..channels], volume ~= range) = [..channels * volume];

    gain.
  `)), hex`00 00 00`)
})

t('end operator', t => {
  // must throw if anything comes after . in body
  // throws if anything comes after . in
})



function cln (str) {
	if (Array.isArray(str)) str = String.raw.apply(String, arguments)

	return str.trim()

	//remove empty lines
	.replace(/^\s*\n/gm, '')

	//remove indentation/tabulation
	.replace(/^\s*/gm, '')

	//transform all \r to \n
	.replace(/[\n\r]+/g, '\n')

	//replace duble spaces/tabs to single ones
	.replace(/(\s)\s+/g, '$1')
}
function isCode (a, b) {
  return is(cln(a), cln(b))
}
