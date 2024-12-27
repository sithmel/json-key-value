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
    assert.deepEqual(seq, [[[], "test", 0, 6]])
    assert.equal(parser.isFinished(), true)
  })

  describe("strings", () => {
    it("works with a simple string", () => {
      const seq = parserIter('"test"')
      assert.deepEqual(seq, [[[], "test", 0, 6]])
    })
    it("works with slashes", () => {
      const seq = parserIter('"hello\\nworld"')
      assert.deepEqual(seq, [[[], "hello\nworld", 0, 14]])
    })
    it("works with unicode", () => {
      const seq = parserIter('"hell\\u006f"')
      assert.deepEqual(seq, [[[], "hello", 0, 12]])
    })
  })
  describe("numbers", () => {
    it("does not work without trailing space ", () => {
      const seq = parserIter("100")
      assert.deepEqual(seq, [])
    })

    it("works with a number", () => {
      const seq = parserIter("100 ")
      assert.deepEqual(seq, [[[], 100, 0, 3]])
    })

    it("works with decimals", () => {
      const seq = parserIter("10.05 ")
      assert.deepEqual(seq, [[[], 10.05, 0, 5]])
    })

    it("works with exp", () => {
      const seq = parserIter("10e2 ")
      assert.deepEqual(seq, [[[], 1000, 0, 4]])
    })

    it("works with decimals exp", () => {
      const seq = parserIter("10.3e2 ")
      assert.deepEqual(seq, [[[], 1030, 0, 6]])
    })

    it("works with exp and sign", () => {
      const seq = parserIter("10e-1 ")
      assert.deepEqual(seq, [[[], 1, 0, 5]])
    })
  })
  describe("booleans and null", () => {
    it("works with true", () => {
      const seq = parserIter("true")
      assert.deepEqual(seq, [[[], true, 0, 4]])
    })
    it("works with false", () => {
      const seq = parserIter("false")
      assert.deepEqual(seq, [[[], false, 0, 5]])
    })
    it("works with null", () => {
      const seq = parserIter("null")
      assert.deepEqual(seq, [[[], null, 0, 4]])
    })
  })
  describe("object", () => {
    it("works with an empty object", () => {
      const seq = parserIter("{}")
      assert.deepEqual(seq, [[[], {}, 0, 1]])
      assert.equal(parser.isFinished(), true)
    })
    it("works with a minimal object", () => {
      const seq = parserIter(`{"test":1}`)
      assert.deepEqual(seq, [
        [[], {}, 0, 1],
        [["test"], 1, 8, 9],
      ])
      assert.equal(parser.isFinished(), true)
    })
    it("works with an object with multiple prop", () => {
      const seq = parserIter(`{"test":1, "test1":"xyz"}`)
      assert.deepEqual(seq, [
        [[], {}, 0, 1],
        [["test"], 1, 8, 9],
        [["test1"], "xyz", 19, 24],
      ])
      assert.equal(parser.isFinished(), true)
    })
  })
  describe("array", () => {
    it("works with an empty array", () => {
      const seq = parserIter("[]")
      assert.deepEqual(seq, [[[], [], 0, 1]])
      assert.equal(parser.isFinished(), true)
    })
    it("works with a minimal array", () => {
      const seq = parserIter(`[1]`)
      assert.deepEqual(seq, [
        [[], [], 0, 1],
        [[0], 1, 1, 2],
      ])
      assert.equal(parser.isFinished(), true)
    })
    it("works with an array with multiple items", () => {
      const seq = parserIter(`[1,"xyz"]`)
      assert.deepEqual(seq, [
        [[], [], 0, 1],
        [[0], 1, 1, 2],
        [[1], "xyz", 3, 8],
      ])
      assert.equal(parser.isFinished(), true)
    })
  })
  describe("nesting", () => {
    it("works with object nested into object (1)", () => {
      const seq = parserIter('{"test1":{"test2":1}}')
      assert.deepEqual(seq, [
        [[], {}, 0, 1],
        [["test1"], {}, 9, 10],
        [["test1", "test2"], 1, 18, 19],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into object (2)", () => {
      const seq = parserIter('{"test1":{"test2":1}, "test3":2}')
      assert.deepEqual(seq, [
        [[], {}, 0, 1],
        [["test1"], {}, 9, 10],
        [["test1", "test2"], 1, 18, 19],
        [["test3"], 2, 30, 31],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (1)", () => {
      const seq = parserIter('[{"test1":1}, {"test2":2}]')
      assert.deepEqual(seq, [
        [[], [], 0, 1],
        [[0], {}, 1, 2],
        [[0, "test1"], 1, 10, 11],
        [[1], {}, 14, 15],
        [[1, "test2"], 2, 23, 24],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (2)", () => {
      const seq = parserIter('[{"test1":[1, "xyz"]}, {"test2":2}]')
      assert.deepEqual(seq, [
        [[], [], 0, 1],
        [[0], {}, 1, 2],
        [[0, "test1"], [], 10, 11],
        [[0, "test1", 0], 1, 11, 12],
        [[0, "test1", 1], "xyz", 14, 19],
        [[1], {}, 23, 24],
        [[1, "test2"], 2, 32, 33],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (3)", () => {
      const seq = parserIter("[[1, 2, 3], [4, 5, 6]]")
      assert.deepEqual(seq, [
        [[], [], 0, 1],
        [[0], [], 1, 2],
        [[0, 0], 1, 2, 3],
        [[0, 1], 2, 5, 6],
        [[0, 2], 3, 8, 9],
        [[1], [], 12, 13],
        [[1, 0], 4, 13, 14],
        [[1, 1], 5, 16, 17],
        [[1, 2], 6, 19, 20],
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
        [[], {}, 0, 1],
        [["test1"], { test2: 1 }, 9, 20],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into object (2)", () => {
      const seq = parserIter('{"test1":{"test2":1}, "test3":2}')
      assert.deepEqual(seq, [
        [[], {}, 0, 1],
        [["test1"], { test2: 1 }, 9, 20],
        [["test3"], 2, 30, 31],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (1)", () => {
      const seq = parserIter('[{"test1":1}, {"test2":2}]')
      assert.deepEqual(seq, [
        [[], [], 0, 1],
        [[0], { test1: 1 }, 1, 12],
        [[1], { test2: 2 }, 14, 25],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (2)", () => {
      const seq = parserIter('[{"test1":[1, "xyz"]}, {"test2":2}]')
      assert.deepEqual(seq, [
        [[], [], 0, 1],
        [[0], { test1: [1, "xyz"] }, 1, 21],
        [[1], { test2: 2 }, 23, 34],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (3)", () => {
      const seq = parserIter("[[1, 2, 3], [4, 5, 6]]")
      assert.deepEqual(seq, [
        [[], [], 0, 1],
        [[0], [1, 2, 3], 1, 10],
        [[1], [4, 5, 6], 12, 21],
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
      assert.deepEqual(seq, [[["test1", "test2"], 1, 18, 19]])
      assert.equal(parser.isFinished(), true)
    })
  })
})
