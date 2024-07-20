//@ts-check
import assert from "assert"
import pkg from "zunit"

import SequenceToStream from "../src/SequenceToStream.mjs"
import ObjectToSequence from "../src/ObjectToSequence.mjs"

const { describe, it, oit, odescribe } = pkg

async function testObj(obj) {
  let str = ""
  const parser = new ObjectToSequence()
  const builder = new SequenceToStream({
    onData: async (data) => {
      str += data
    },
  })
  for (const [path, value] of parser.iter(obj)) {
    builder.add(path, value)
  }
  await builder.end()
  assert.deepEqual(JSON.parse(str), obj, str)
}

async function testSequence(sequence, obj, compactArrays = false) {
  let str = ""
  const builder = new SequenceToStream({
    compactArrays,
    onData: async (data) => {
      str += data
    },
  })
  for (const [path, value] of sequence) {
    builder.add(path, value)
  }
  await builder.end()
  assert.deepEqual(JSON.parse(str), obj, str)
}

describe("SequenceToStream", () => {
  describe("scalars", () => {
    it("works with scalars (1)", () => testObj("test"))
    it("works with scalars (2)", () => testObj(1.2))
  })
  describe("objects", () => {
    it("works if empty", () => testObj({}))
    it("works with 1 attribute", () => testObj({ test: 1 }))
    it("works with 1 nested objects", () => testObj({ test: { test2: 2 } }))
    it("works with multiple nested objects", () =>
      testObj({ test: { test2: { test3: 3 } } }))
    it("works with more attributes", () => testObj({ test: 1, test2: 2 }))
    it("works with multiple nested objects and attributes", () =>
      testObj({ test: { test2: { test3: 3 } }, test4: 2, test5: "hello" }))
  })
  describe("array", () => {
    it("works if empty", () => testObj([]))
    it("works if 1 element", () => testObj([1]))
    it("works if 2 element", () => testObj([1, "A"]))
    it("works with nested arrays", () => testObj([1, ["A", [2]], 3]))
  })
  describe("array and nested objects", () => {
    it("works with empty obj array", () => testObj([{}, {}]))
    it("works obj in array", () => testObj([{ test: 2 }]))
    it("works obj in array", () => testObj({ test: [1, 2, { a: 2, b: 3 }, 4] }))
  })
  describe("reconstruct from sequence", () => {
    it("works with 1 obj 1 attr", () => testSequence([[["a"], 1]], { a: 1 }))
    it("works with 1 obj deep paths", () =>
      testSequence([[["a", "b", "c"], true]], { a: { b: { c: true } } }))
    it("works with 1 obj more attribs", () =>
      testSequence(
        [
          [["a", "b"], true],
          [["x", "y"], false],
        ],
        { a: { b: true }, x: { y: false } },
      ))
    it("works with 1 array 1 attr", () => testSequence([[[0], 1]], [1]))
    it("works with 1 array deep paths", () =>
      testSequence([[[0, 0, 0], 1]], [[[1]]]))
    it("works with 1 array with more elements", () =>
      testSequence(
        [
          [[0, 1], 1],
          [[1, 0], 2],
        ],
        [[null, 1], [2]],
      ))
    it("works with 1 array with more elements (compacting)", () =>
      testSequence(
        [
          [[0, 1], 1],
          [[1, 0], 2],
        ],
        [[1], [2]],
        true,
      ))

    it("works with mix array and obj", () =>
      testSequence(
        [
          [[0, "a", "b"], true],
          [[0, "c", "d"], false],
        ],
        [{ a: { b: true }, c: { d: false } }],
      ))

    it("reconstruct missing array pieces", () =>
      testSequence([[[2], 1]], [null, null, 1]))
    it("compacts when missing array pieces", () =>
      testSequence([[[2], 1]], [1], true))
    it("reconstruct missing array pieces(2)", () =>
      testSequence(
        [
          [[0], "a"],
          [[3], 1],
        ],
        ["a", null, null, 1],
      ))
    it("compacts when missing array pieces(2)", () =>
      testSequence(
        [
          [[0], "a"],
          [[3], 1],
        ],
        ["a", 1],
        true,
      ))
    it("compacts arrays", () =>
      testSequence(
        [
          [["collection", 2], {}],
          [["collection", 2, "brand"], "Rolls Royce"],
          [["collection", 2, "number"], 8],
        ],
        {
          collection: [{ brand: "Rolls Royce", number: 8 }],
        },
        true,
      ))
    it("reconstruct with skipping indexes", () =>
      testSequence(
        [
          [["collection", 2], {}],
          [["collection", 3, "brand"], "Rolls Royce"],
          [["collection", 3, "number"], 8],
        ],
        {
          collection: [{}, { brand: "Rolls Royce", number: 8 }],
        },
        true,
      ))
    it("reconstruct with skipping indexes", () =>
      testSequence(
        [
          [["collection", 2], {}],
          [["collection", 3, "brand"], "Rolls Royce"],
          [["collection", 3, "number"], 8],
        ],
        {
          collection: [null, null, {}, { brand: "Rolls Royce", number: 8 }],
        },
        false,
      ))
  })
  describe("chunks", () => {
    it("works with object nested into object (1)", () =>
      testSequence(
        [
          [[], {}],
          [["test1"], { test2: 1 }],
        ],
        { test1: { test2: 1 } },
        false,
      ))
    it("works with object nested into object (2)", () =>
      testSequence(
        [
          [[], {}],
          [["test1"], { test2: 1 }],
          [["test3"], 2],
        ],
        { test1: { test2: 1 }, test3: 2 },
        false,
      ))
    it("works with object nested into arrays (1)", () =>
      testSequence(
        [
          [[], []],
          [[0], { test1: 1 }],
          [[1], { test2: 2 }],
        ],
        [{ test1: 1 }, { test2: 2 }],
        false,
      ))
    it("works with object nested into arrays (2)", () =>
      testSequence(
        [
          [[], []],
          [[0], { test1: [1, "xyz"] }],
          [[1], { test2: 2 }],
        ],
        [{ test1: [1, "xyz"] }, { test2: 2 }],
        false,
      ))
  })
})
