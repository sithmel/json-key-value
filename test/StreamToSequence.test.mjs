//@ts-check
import assert from "assert"
import pkg from "zunit"

import StreamToSequence from "../src/StreamToSequence.mjs"

const { odescribe, describe, it, oit, beforeEach } = pkg

describe("StreamToSequence", () => {
  let parser, encoder, parserIter
  beforeEach(() => {
    parser = new StreamToSequence()
    encoder = new TextEncoder()
    parserIter = (text) => Array.from(parser.iter(encoder.encode(text)))
  })
  it("can resume", () => {
    const seq = []
    for (const chunk of ['"t', "es", "t", '"'].map((t) => encoder.encode(t))) {
      for (const item of parser.iter(chunk)) {
        seq.push(item)
      }
    }
    assert.deepEqual(seq, [[[], "test"]])
    assert.equal(parser.isFinished(), true)
  })

  describe("strings", () => {
    it("works with a simple string", () => {
      const seq = parserIter('"test"')
      assert.deepEqual(seq, [[[], "test"]])
    })
    it("works with slashes", () => {
      const seq = parserIter('"hello\\nworld"')
      assert.deepEqual(seq, [[[], "hello\nworld"]])
    })
    it("works with unicode", () => {
      const seq = parserIter('"hell\\u006f"')
      assert.deepEqual(seq, [[[], "hello"]])
    })
  })
  describe("numbers", () => {
    it("does not work without trailing space ", () => {
      const seq = parserIter("100")
      assert.deepEqual(seq, [])
    })

    it("works with a number", () => {
      const seq = parserIter("100 ")
      assert.deepEqual(seq, [[[], 100]])
    })

    it("works with decimals", () => {
      const seq = parserIter("10.05 ")
      assert.deepEqual(seq, [[[], 10.05]])
    })

    it("works with exp", () => {
      const seq = parserIter("10e2 ")
      assert.deepEqual(seq, [[[], 1000]])
    })

    it("works with decimals exp", () => {
      const seq = parserIter("10.3e2 ")
      assert.deepEqual(seq, [[[], 1030]])
    })

    it("works with exp and sign", () => {
      const seq = parserIter("10e-1 ")
      assert.deepEqual(seq, [[[], 1]])
    })
  })
  describe("booleans and null", () => {
    it("works with true", () => {
      const seq = parserIter("true")
      assert.deepEqual(seq, [[[], true]])
    })
    it("works with false", () => {
      const seq = parserIter("false")
      assert.deepEqual(seq, [[[], false]])
    })
    it("works with null", () => {
      const seq = parserIter("null")
      assert.deepEqual(seq, [[[], null]])
    })
  })
  describe("object", () => {
    it("works with an empty object", () => {
      const seq = parserIter("{}")
      assert.deepEqual(seq, [[[], {}]])
      assert.equal(parser.isFinished(), true)
    })
    it("works with a minimal object", () => {
      const seq = parserIter(`{"test":1}`)
      assert.deepEqual(seq, [
        [[], {}],
        [["test"], 1],
      ])
      assert.equal(parser.isFinished(), true)
    })
    it("works with an object with multiple prop", () => {
      const seq = parserIter(`{"test":1, "test1":"xyz"}`)
      assert.deepEqual(seq, [
        [[], {}],
        [["test"], 1],
        [["test1"], "xyz"],
      ])
      assert.equal(parser.isFinished(), true)
    })
  })
  describe("array", () => {
    it("works with an empty array", () => {
      const seq = parserIter("[]")
      assert.deepEqual(seq, [[[], []]])
      assert.equal(parser.isFinished(), true)
    })
    it("works with a minimal array", () => {
      const seq = parserIter(`[1]`)
      assert.deepEqual(seq, [
        [[], []],
        [[0], 1],
      ])
      assert.equal(parser.isFinished(), true)
    })
    it("works with an array with multiple items", () => {
      const seq = parserIter(`[1,"xyz"]`)
      assert.deepEqual(seq, [
        [[], []],
        [[0], 1],
        [[1], "xyz"],
      ])
      assert.equal(parser.isFinished(), true)
    })
  })
  describe("nesting", () => {
    it("works with object nested into object (1)", () => {
      const seq = parserIter('{"test1":{"test2":1}}')
      assert.deepEqual(seq, [
        [[], {}],
        [["test1"], {}],
        [["test1", "test2"], 1],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into object (2)", () => {
      const seq = parserIter('{"test1":{"test2":1}, "test3":2}')
      assert.deepEqual(seq, [
        [[], {}],
        [["test1"], {}],
        [["test1", "test2"], 1],
        [["test3"], 2],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (1)", () => {
      const seq = parserIter('[{"test1":1}, {"test2":2}]')
      assert.deepEqual(seq, [
        [[], []],
        [[0], {}],
        [[0, "test1"], 1],
        [[1], {}],
        [[1, "test2"], 2],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (2)", () => {
      const seq = parserIter('[{"test1":[1, "xyz"]}, {"test2":2}]')
      assert.deepEqual(seq, [
        [[], []],
        [[0], {}],
        [[0, "test1"], []],
        [[0, "test1", 0], 1],
        [[0, "test1", 1], "xyz"],
        [[1], {}],
        [[1, "test2"], 2],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (3)", () => {
      const seq = parserIter("[[1, 2, 3], [4, 5, 6]]")
      assert.deepEqual(seq, [
        [[], []],
        [[0], []],
        [[0, 0], 1],
        [[0, 1], 2],
        [[0, 2], 3],
        [[1], []],
        [[1, 0], 4],
        [[1, 1], 5],
        [[1, 2], 6],
      ])
      assert.equal(parser.isFinished(), true)
    })
  })
  describe("nesting with maxDepth", () => {
    beforeEach(() => {
      parser = new StreamToSequence({ maxDepth: 1 })
      encoder = new TextEncoder()
      parserIter = (text) => Array.from(parser.iter(encoder.encode(text)))
    })

    it("works with object nested into object (1)", () => {
      const seq = parserIter('{"test1":{"test2":1}}')
      assert.deepEqual(seq, [
        [[], {}],
        [["test1"], { test2: 1 }],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into object (2)", () => {
      const seq = parserIter('{"test1":{"test2":1}, "test3":2}')
      assert.deepEqual(seq, [
        [[], {}],
        [["test1"], { test2: 1 }],
        [["test3"], 2],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (1)", () => {
      const seq = parserIter('[{"test1":1}, {"test2":2}]')
      assert.deepEqual(seq, [
        [[], []],
        [[0], { test1: 1 }],
        [[1], { test2: 2 }],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (2)", () => {
      const seq = parserIter('[{"test1":[1, "xyz"]}, {"test2":2}]')
      assert.deepEqual(seq, [
        [[], []],
        [[0], { test1: [1, "xyz"] }],
        [[1], { test2: 2 }],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (3)", () => {
      const seq = parserIter("[[1, 2, 3], [4, 5, 6]]")
      assert.deepEqual(seq, [
        [[], []],
        [[0], [1, 2, 3]],
        [[1], [4, 5, 6]],
      ])
      assert.equal(parser.isFinished(), true)
    })
  })
  describe("includes", () => {
    beforeEach(() => {
      parser = new StreamToSequence({ includes: "'test1'('test2')" })
      encoder = new TextEncoder()
      parserIter = (text) => Array.from(parser.iter(encoder.encode(text)))
    })

    it("works", () => {
      const seq = parserIter('{"test1":{"test2":1}}')
      assert.deepEqual(seq, [[["test1", "test2"], 1]])
      assert.equal(parser.isFinished(), true)
    })
  })
})
