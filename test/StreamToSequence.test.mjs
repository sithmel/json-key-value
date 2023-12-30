//@ts-check
import assert from "assert"
import pkg from "zunit"

import StreamToSequence from "../src/StreamToSequence.mjs"

const { describe, it, oit, beforeEach } = pkg

describe("StreamToSequence", () => {
  let parser
  beforeEach(() => {
    parser = new StreamToSequence()
  })
  it("can resume", () => {
    const seq = []
    for (const chunk of ['"t', "es", "t", '"']) {
      for (const item of parser.iter(chunk)) {
        seq.push(item)
      }
    }
    assert.deepEqual(seq, [[[], "test"]])
    assert.equal(parser.isFinished(), true)
  })

  describe("strings", () => {
    it("works with a simple string", () => {
      const seq = Array.from(parser.iter('"test"'))
      assert.deepEqual(seq, [[[], "test"]])
    })
    it("works with slashes", () => {
      const seq = Array.from(parser.iter('"hello\\nworld"'))
      assert.deepEqual(seq, [[[], "hello\nworld"]])
    })
    it("works with unicode", () => {
      const seq = Array.from(parser.iter('"hell\\u006f"'))
      assert.deepEqual(seq, [[[], "hello"]])
    })
  })
  describe("numbers", () => {
    it("does not work without trailing space ", () => {
      const seq = Array.from(parser.iter("100"))
      assert.deepEqual(seq, [])
    })

    it("works with a number", () => {
      const seq = Array.from(parser.iter("100 "))
      assert.deepEqual(seq, [[[], 100]])
    })

    it("works with decimals", () => {
      const seq = Array.from(parser.iter("10.05 "))
      assert.deepEqual(seq, [[[], 10.05]])
    })

    it("works with exp", () => {
      const seq = Array.from(parser.iter("10e2 "))
      assert.deepEqual(seq, [[[], 1000]])
    })

    it("works with decimals exp", () => {
      const seq = Array.from(parser.iter("10.3e2 "))
      assert.deepEqual(seq, [[[], 1030]])
    })

    it("works with exp and sign", () => {
      const seq = Array.from(parser.iter("10e-1 "))
      assert.deepEqual(seq, [[[], 1]])
    })
  })
  describe("booleans and null", () => {
    it("works with true", () => {
      const seq = Array.from(parser.iter("true"))
      assert.deepEqual(seq, [[[], true]])
    })
    it("works with false", () => {
      const seq = Array.from(parser.iter("false"))
      assert.deepEqual(seq, [[[], false]])
    })
    it("works with null", () => {
      const seq = Array.from(parser.iter("null"))
      assert.deepEqual(seq, [[[], null]])
    })
  })
  describe("object", () => {
    it("works with an empty object", () => {
      const seq = Array.from(parser.iter("{}"))
      assert.deepEqual(seq, [[[], {}]])
      assert.equal(parser.isFinished(), true)
    })
    it("works with a minimal object", () => {
      const seq = Array.from(parser.iter(`{"test":1}`))
      assert.deepEqual(seq, [
        [[], {}],
        [["test"], 1],
      ])
      assert.equal(parser.isFinished(), true)
    })
    it("works with an object with multiple prop", () => {
      const seq = Array.from(parser.iter(`{"test":1, "test1":"xyz"}`))
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
      const seq = Array.from(parser.iter("[]"))
      assert.deepEqual(seq, [[[], []]])
      assert.equal(parser.isFinished(), true)
    })
    it("works with a minimal array", () => {
      const seq = Array.from(parser.iter(`[1]`))
      assert.deepEqual(seq, [
        [[], []],
        [[0], 1],
      ])
      assert.equal(parser.isFinished(), true)
    })
    it("works with an array with multiple items", () => {
      const seq = Array.from(parser.iter(`[1,"xyz"]`))
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
      const seq = Array.from(parser.iter('{"test1":{"test2":1}}'))
      assert.deepEqual(seq, [
        [[], {}],
        [["test1"], {}],
        [["test1", "test2"], 1],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into object (2)", () => {
      const seq = Array.from(parser.iter('{"test1":{"test2":1}, "test3":2}'))
      assert.deepEqual(seq, [
        [[], {}],
        [["test1"], {}],
        [["test1", "test2"], 1],
        [["test3"], 2],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (1)", () => {
      const seq = Array.from(parser.iter('[{"test1":1}, {"test2":2}]'))
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
      const seq = Array.from(parser.iter('[{"test1":[1, "xyz"]}, {"test2":2}]'))
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
      const seq = Array.from(parser.iter("[[1, 2, 3], [4, 5, 6]]"))
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
})
