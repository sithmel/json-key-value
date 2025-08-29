//@ts-check
import assert from "assert"
import { describe, it } from "node:test"

import testOp from "../src/SequenceProcessor/test.js"
import addOp from "../src/SequenceProcessor/add.js"
import replaceOp from "../src/SequenceProcessor/replace.js"
import removeOp from "../src/SequenceProcessor/remove.js"
import { toPathObject, Path } from "../src/lib/path.js"
import { toValueObject, Value } from "../src/lib/value.js"

/**
 * Collects an AsyncIterable<Iterable<T>> into Array<T>
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @returns {Promise<Array<[import("../src/lib/path.js").JSONPathType, any]>>}
 */
async function collectAndDecode(asyncIterable) {
  /**
   * @type {Array<[import("../src/lib/path.js").JSONPathType, any]>}
   */
  const out = []
  for await (const batch of asyncIterable) {
    for (const [path, value] of batch) {
      out.push([path.decoded, value.decoded])
    }
  }
  return out
}

/**
 * Build a simple async iterable of a single batch of path/value pairs
 * @param {Array<[import("../src/lib/path.js").JSONPathType, any]>} items
 * @returns {AsyncIterable<Iterable<[Path, Value]>>}
 */
function singleBatchSequence(items) {
  const encodedItems = items.map(([path, value]) => [toPathObject(path), toValueObject(value)]) 
  return (async function* () {
    yield /** @type {Iterable<[Path, Value]>} */ (encodedItems)
  })()
}

describe("SequenceProcessor test op", () => {
  it("passes when the path/value exists in the sequence", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b"], 2],
    ])

    const result = await collectAndDecode(
      testOp(seq, toPathObject(["b"]), toValueObject(2)),
    )
    // Ensure passthrough behavior (shape preserved) and no throw
    assert.deepEqual(result, [
      [["a"], 1],
      [["b"], 2],
    ])
  })

  it("throws when the path/value does not exist in the sequence", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b"], 2],
    ])

    await assert.rejects(() =>
      collectAndDecode(testOp(seq, toPathObject(["c"]), toValueObject(3))),
    )
  })

  it("passes when all object sub path/values exist under the base path", async () => {
    const seq = singleBatchSequence([
      [["root", "a"], 1],
      [["root", "b", "c"], true],
      [["x"], 0],
    ])

    const result = await collectAndDecode(
      testOp(
        seq,
        toPathObject(["root"]),
        toValueObject({ a: 1, b: { c: true } }),
      ),
    )

    // passthrough unchanged
    assert.deepEqual(result, [
      [["root", "a"], 1],
      [["root", "b", "c"], true],
      [["x"], 0],
    ])
  })

  it("throws when any required object sub path/value is missing", async () => {
    const seq = singleBatchSequence([
      [["root", "a"], 1],
      // missing ["root","b","c"]
    ])

    await assert.rejects(() =>
      collectAndDecode(
        testOp(
          seq,
          toPathObject(["root"]),
          toValueObject({ a: 1, b: { c: true } }),
        ),
      ),
    )
  })

  it("passes when all array elements exist under the base path", async () => {
    const seq = singleBatchSequence([
      [["arr", 0], 10],
      [["arr", 1], 20],
    ])

    const result = await collectAndDecode(
      testOp(seq, toPathObject(["arr"]), toValueObject([10, 20])),
    )

    assert.deepEqual(result, [
      [["arr", 0], 10],
      [["arr", 1], 20],
    ])
  })

  it("handles empty object and empty array under base path", async () => {
    const seq1 = singleBatchSequence([
      [["rootEmptyObj"], {}],
    ])
    const seq2 = singleBatchSequence([
      [["rootEmptyArr"], []],
    ])


    // empty object
    const result1 = await collectAndDecode(
      testOp(seq1, toPathObject(["rootEmptyObj"]), toValueObject({})),
    )
    // empty array
    const result2 = await collectAndDecode(
      testOp(seq2, toPathObject(["rootEmptyArr"]), toValueObject([])),
    )

    assert.deepEqual(result1, [
      [["rootEmptyObj"], {}],
    ])
    assert.deepEqual(result2, [
      [["rootEmptyArr"], []],
    ])
  })

  it("throws when empty object pair under base path is missing", async () => {
    const seq = singleBatchSequence([])

    await assert.rejects(() =>
      collectAndDecode(
        testOp(seq, toPathObject(["rootEmptyObj"]), toValueObject({})),
      ),
    )
  })
})

describe("SequenceProcessor remove op", () => {
  it("removes a leaf value only", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", "x"], true],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["b", "x"])),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b"], {}],
      [["c"], 3],
    ])
  })

  it("removes an entire subtree (object prefix)", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", "x"], true],
      [["b", "y"], 2],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["b"])),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["c"], 3],
    ])
  })

  it("removes a single array element (index prefix)", async () => {
    const seq = singleBatchSequence([
      [["a", 0], 1],
      [["a", 1], 2],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["a", 0])),
    )

    assert.deepEqual(result, [[["a", 0], 2]])
  })

  it("throws an error when path not found", async () => {
    const seq = singleBatchSequence([
      [["a"], 1]
    ])

    await assert.rejects(() =>
      collectAndDecode(removeOp(seq, toPathObject(["x"])))
    )
  })

})

describe("SequenceProcessor add op", () => {
  it("inserts into object subtree in pre-order (between siblings)", async () => {
    // Base sequence represents: { a: 1, b: { x: true }, c: 3 }
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", "x"], true],
      [["c"], 3],
    ])

    // Insert { b: { y: 2 } } so order becomes: [a], [b,x], [b,y], [c]
    const insertedPath = toPathObject(["b", "y"])
    const insertedValue = toValueObject(2)

    const result = await collectAndDecode(
      addOp(seq, insertedPath, insertedValue),
    )
    assert.deepEqual(result, [
      [["a"], 1],
      [["b", "x"], true],
      [["b", "y"], 2],
      [["c"], 3],
    ])
  })

  it("appends at the end of an array subtree by index order", async () => {
    // Base sequence represents: { a: [1, 2] }
    const seq = singleBatchSequence([
      [["a", 0], 1],
      [["a", 1], 2],
    ])

    // Insert index 2 -> should come after index 1
    const insertedPath = toPathObject(["a", 2])
    const insertedValue = toValueObject(3)

    const result = await collectAndDecode(
      addOp(seq, insertedPath, insertedValue),
    )

    assert.deepEqual(result, [
      [["a", 0], 1],
      [["a", 1], 2],
      [["a", 2], 3],
    ])
  })

  it("prepends at the beginning of an array", async () => {
    // Base sequence represents: { a: [1, undefined, ] }
    const seq = singleBatchSequence([
      [["a", 0], 1],
      [["a", 3], 2],
    ])

    // Insert index 2 -> should come after index 1
    const insertedPath = toPathObject(["a", 0])
    const insertedValue = toValueObject(3)

    const result = await collectAndDecode(
      addOp(seq, insertedPath, insertedValue),
    )

    assert.deepEqual(result, [
      [["a", 0], 3], // prepended
      [["a", 1], 1], // shifted
      [["a", 4], 2], // shifted
    ])
  })

  it("insert in the middle of an array", async () => {
    // Base sequence represents: { a: [1, 2] }
    const seq = singleBatchSequence([
      [["a", 0], 1],
      [["a", 3], 2],
    ])

    // Insert index 2 -> should come after index 1
    const insertedPath = toPathObject(["a", 2])
    const insertedValue = toValueObject(3)

    const result = await collectAndDecode(
      addOp(seq, insertedPath, insertedValue),
    )

    assert.deepEqual(result, [
      [["a", 0], 1],
      [["a", 2], 3],
      [["a", 4], 2],
    ])
  })

  it("inserts as first child within a subtree when appropriate", async () => {
    // Base sequence represents: { a: { z: true }, b: 1 }
    const seq = singleBatchSequence([
      [["a", "z"], true],
      [["b"], 1],
    ])

    // Insert a.a -> expected before a.z
    const insertedPath = toPathObject(["a", "a"])
    const insertedValue = toValueObject(0)

    const result = await collectAndDecode(
      addOp(seq, insertedPath, insertedValue),
    )
    assert.deepEqual(result, [
      [["a", "z"], true],
      [["a", "a"], 0],
      [["b"], 1],
    ])
  })
})

describe("SequenceProcessor replace op", () => {
  it("replaces a leaf value in-place (same path)", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", "x"], true],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      replaceOp(
        seq,
        toPathObject(["b", "x"]),
        toValueObject(false),
      ),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b", "x"], false],
      [["c"], 3],
    ])
  })

  it("replaces an element under an array, keeping order", async () => {
    const seq = singleBatchSequence([
      [["a", 0], 1],
      [["a", 1], 2],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["a", 0]), toValueObject(9)),
    )

    assert.deepEqual(result, [
      [["a", 0], 9],
      [["a", 1], 2],
    ])
  })
})

