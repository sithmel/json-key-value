//@ts-check
import assert from "assert"
import pkg from "zunit"

import pathExpParse from "../../src/pathExp/parser.mjs"

const { describe, odescribe, it, oit, beforeEach } = pkg

describe("path exp parser", () => {
  it("parses simple string", () => {
    const matcher = pathExpParse(`
        'test'
      `)
    assert.equal(matcher.stringify(), "'test'")
  })
  it("parses string and number", () => {
    const matcher = pathExpParse(`'test' 4`)
    assert.equal(matcher.stringify(), "'test' 4")
  })
  it("parses string and number and slices", () => {
    const matcher = pathExpParse(`'test' 4 ..6`)
    assert.equal(matcher.stringify(), "'test' 4 ..6")
  })
  it("parses recursion 1", () => {
    const matcher = pathExpParse('"A"(*("C" "D"))')
    assert.equal(matcher.stringify(), "'A'(*('C' 'D'))")
  })
  it("parses recursion 1", () => {
    const matcher = pathExpParse('"A"("B"("C" "D") "E") "F"')
    assert.equal(matcher.stringify(), "'A'('B'('C' 'D') 'E') 'F'")
  })
  it("ignore comments", () => {
    const matcher = pathExpParse(`
      "A"(
        "B"(
          "C" # test comment 1
          "D"
        ) # test comment 2
        "E" 
      )
      "F"`)
    assert.equal(matcher.stringify(), "'A'('B'('C' 'D') 'E') 'F'")
  })
})
