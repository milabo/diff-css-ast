#!/usr/bin/env node
const fs = require('fs')
const postcss = require('postcss')

function extractRules (css) {
  const ast = postcss.parse(css)
  const rules = []
  ast.walkRules(rule => {
    const declarations = []
    rule.walkDecls(decl => {
      declarations.push({
        prop: decl.prop,
        value: decl.value
      })
    })
    rules.push({
      start: rule.source.start,
      selectors: rule.selectors,
      declarations: declarations
    })
  })
  return rules
}

function makeRuleLineMap (rules) {
  function makeLine (rule) {
    const decls = rule.declarations.map(x => x.prop + ':' + x.value).sort().join(';')
    return rule.selectors.sort().join(',') + '{' + decls + '}'
  }

  const map = new Map()
  rules.forEach(r => {
    map.set(makeLine(r), r)
  })
  return map
}

function loadAndExtractAsSet (path) {
  return makeRuleLineMap(extractRules(fs.readFileSync(path)))
}

function diff (pathA, pathB) {
  const ruleLinesA = loadAndExtractAsSet(pathA)
  const ruleLinesB = loadAndExtractAsSet(pathB)

  ruleLinesA.forEach((value, key) => {
    if (ruleLinesB.has(key)) {
      ruleLinesB.delete(key)
    } else {
      console.log('>>> ' + pathA + ' line:' + value.start.line + ' column:' + value.start.column)
      console.log(' - ' + key)
    }
  })
  ruleLinesB.forEach((value, key) => {
    console.log('<<< ' + pathB + ' line:' + value.start.line + ' column:' + value.start.column)
    console.log(' + ' + key)
  })
}

if (process.argv.length >= 4) {
  console.log(process.argv)
  diff(process.argv[2], process.argv[3])
} else {
  console.log('usage: diff-css-ast <file A> <file B>')
}
