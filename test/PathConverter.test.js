//@ts-check
import assert from "assert"
import pkg from "zunit"

import PathConverter from "../src/PathConverter.js"

const { describe, it, oit, beforeEach } = pkg
describe("PathConverter", () => {
  let convert
  beforeEach(() => {
    convert = new PathConverter()
  })
  it("converts a empty path", () => {
    assert.equal(convert.pathToString([]), "")
    assert.deepEqual(convert.stringToPath(""), [])
  })

  it("converts a path", () => {
    assert.equal(convert.pathToString(["a", "b", "c"]), "a//b//c")
  })
  it("converts a path with a number", () => {
    assert.equal(convert.pathToString(["a", 5, "c"]), "a//@@A5//c")
    assert.equal(convert.pathToString([1000, 5, "c"]), "@@D1000//@@A5//c")
  })
  it("converts a string", () => {
    assert.deepEqual(convert.stringToPath("a//@@A5//c"), ["a", 5, "c"])
    assert.deepEqual(convert.stringToPath("@@D1000//@@A5//c"), [1000, 5, "c"])
  })
})
