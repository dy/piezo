export default tree => {
  // language-level sections
  // `type` section is built on stage of WAT compiling
  // `memory`/`table` sections are covered by arrays
  //
  let ir = {
    func: [],
    export: [],
    import: [],
    global: [],
    data: [],
    range: [] // is that needed?
  }

  // [., ...statement] → [;, [., ...statement]]
  // if (tree[0] !== ';') tree = [';',tree]

  module[tree[0]](tree)

  return ir
}

const module = {
  ';': ([,...statements], ir) => {
    for (let statement of statements) {
      console.log(statement)
    }
  }
}

const func = {
  ';'(){}
}
