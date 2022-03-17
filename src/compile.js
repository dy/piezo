// codegenerate WAT from IR
import analyze from "./analyze.js"

export default (tree) => {
  let prog = analyze(tree)
}
