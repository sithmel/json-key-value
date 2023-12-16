//@ts-check
import assert from "assert"
import pkg from "zunit"

import JSONBuilder from "../src/JSONBuilder.mjs"
import ObjParser from "../src/ObjParser.mjs"

const { describe, it, oit, odescribe } = pkg

function testObj(obj) {
  let str = ""
  const parser = new ObjParser()
  const builder = new JSONBuilder((data) => (str += data))
  for (const [path, value] of parser.parse(obj)) {
    builder.add(path, value)
  }
  builder.end()
  assert.deepEqual(JSON.parse(str), obj, str)
}

function testSequence(sequence, obj) {
  let str = ""
  const builder = new JSONBuilder((data) => (str += data))
  for (const [path, value] of sequence) {
    builder.add(path, value)
  }
  builder.end()
  assert.deepEqual(JSON.parse(str), obj, str)
}

describe("JSONBuilder", () => {
  describe("scalars", () => {
    it("works with scalars (1)", () => {
      testObj("test")
    })
    it("works with scalars (2)", () => {
      testObj(1.2)
    })
  })
  describe("objects", () => {
    it("works if empty", () => {
      testObj({})
    })
    it("works with 1 attribute", () => {
      testObj({ test: 1 })
    })
    it("works with 1 nested objects", () => {
      testObj({ test: { test2: 2 } })
    })
    it("works with multiple nested objects", () => {
      testObj({ test: { test2: { test3: 3 } } })
    })
    it("works with more attributes", () => {
      testObj({ test: 1, test2: 2 })
    })
    it("works with multiple nested objects and attributes", () => {
      testObj({ test: { test2: { test3: 3 } }, test4: 2, test5: "hello" })
    })
  })
  describe("array", () => {
    it("works if empty", () => {
      testObj([])
    })
    it("works if 1 element", () => {
      testObj([1])
    })
    it("works if 2 element", () => {
      testObj([1, "A"])
    })
    it("works with nested arrays", () => {
      testObj([1, ["A", [2]], 3])
    })
  })
  describe("array and nested objects", () => {
    it("works with empty obj array", () => {
      testObj([{}, {}])
    })
    it("works obj in array", () => {
      testObj([{ test: 2 }])
    })
    it("works obj in array", () => {
      testObj({ test: [1, 2, { a: 2, b: 3 }, 4] })
    })
  })
  describe("reconstruct from sequence", () => {
    it("works with 1 obj 1 attr", () => {
      testSequence([[["a"], 1]], { a: 1 })
    })
    it("works with 1 obj deep paths", () => {
      testSequence([[["a", "b", "c"], true]], { a: { b: { c: true } } })
    })
    it("works with 1 obj more attribs", () => {
      testSequence(
        [
          [["a", "b"], true],
          [["x", "y"], false],
        ],
        { a: { b: true }, x: { y: false } },
      )
    })
    it("works with 1 array 1 attr", () => {
      testSequence([[[0], 1]], [1])
    })
    it("works with 1 array deep paths", () => {
      testSequence([[[0, 0, 0], 1]], [[[1]]])
    })
    it("works with 1 array with more elements", () => {
      testSequence(
        [
          [[0, 1], 1],
          [[1, 0], 2],
        ],
        [[null, 1], [2]],
      )
    })
    it("works with mix array and obj", () => {
      testSequence(
        [
          [[0, "a", "b"], true],
          [[0, "c", "d"], false],
        ],
        [{ a: { b: true }, c: { d: false } }],
      )
    })

    it("reconstruct missing array pieces", () => {
      testSequence([[[2], 1]], [null, null, 1])
    })
    it("reconstruct missing array pieces", () => {
      testSequence(
        [
          [[0], "a"],
          [[3], 1],
        ],
        ["a", null, null, 1],
      )
    })
  })
})
