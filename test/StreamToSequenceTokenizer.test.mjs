//@ts-check
import assert from "assert"
import pkg from "zunit"

import StreamToSequenceTokenizer from "../src/StreamToSequenceTokenizer.mjs"

const { describe, it, oit, beforeEach } = pkg

describe("StreamToSequenceTokenizer", () => {
  let parser
  beforeEach(() => {
    parser = new StreamToSequenceTokenizer()
  })
  it("works with an empty object", () => {
    const seq = Array.from(parser.iter("{}"))
    assert.deepEqual(seq, [Symbol.for("{"), Symbol.for("}")])
  })
  it("works with a minimal object", () => {
    const seq = Array.from(parser.iter(`{"test":1}`))
    assert.deepEqual(seq, [
      Symbol.for("{"),
      "test",
      Symbol.for(":"),
      1,
      Symbol.for("}"),
    ])
  })
  it("works with an object with multiple prop", () => {
    const seq = Array.from(parser.iter(`{"test":1, "test1":"xyz"}`))
    assert.deepEqual(seq, [
      Symbol.for("{"),
      "test",
      Symbol.for(":"),
      1,
      Symbol.for(","),
      "test1",
      Symbol.for(":"),
      "xyz",
      Symbol.for("}"),
    ])
  })
  it("works with an empty array", () => {
    const seq = Array.from(parser.iter("[]"))
    assert.deepEqual(seq, [Symbol.for("["), Symbol.for("]")])
  })
  it("works with a minimal array", () => {
    const seq = Array.from(parser.iter(`[1]`))
    assert.deepEqual(seq, [Symbol.for("["), 1, Symbol.for("]")])
  })
  it("works with an array with multiple items", () => {
    const seq = Array.from(parser.iter(`[1,"xyz"]`))
    assert.deepEqual(seq, [
      Symbol.for("["),
      1,
      Symbol.for(","),
      "xyz",
      Symbol.for("]"),
    ])
  })
  it("works with object nested into object (1)", () => {
    const seq = Array.from(parser.iter('{"test1":{"test2":1}}'))
    assert.deepEqual(seq, [
      Symbol.for("{"),
      "test1",
      Symbol.for(":"),
      Symbol.for("{"),
      "test2",
      Symbol.for(":"),
      1,
      Symbol.for("}"),
      Symbol.for("}"),
    ])
  })
})
