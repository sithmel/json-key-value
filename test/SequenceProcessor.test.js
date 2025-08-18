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
 * Collects an AsyncIterable<Iterable<T>> into Array<Array<T>>
 * @template T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @returns {Promise<Array<Array<T>>>}
 */
async function collect(asyncIterable) {
  const out = []
  for await (const batch of asyncIterable) {
    out.push([...batch])
  }
  return out
}

/**
 * Build a simple async iterable of a single batch of path/value pairs
 * @returns {AsyncIterable<Iterable<[Path, Value]>>}
 * @param {Array<[Path, Value]>} items
 */
function singleBatch(items) {
  return (async function* () {
    yield /** @type {Iterable<[Path, Value]>} */ (items)
  })()
}

function decode(resultBatches) {
  return resultBatches.map((batch) =>
    batch.map(([p, v]) => [p.decoded, v.decoded]),
  )
}

describe("SequenceProcessor test op", () => {
  it("passes when the path/value exists in the sequence", async () => {
    const p1 = toPathObject(["a"])
    const v1 = toValueObject(1)
    const p2 = toPathObject(["b"])
    const v2 = toValueObject(2)

    /** @type {Array<[Path, Value]>} */
    const seq = [
      [p1, v1],
      [p2, v2],
    ]

    const result = await collect(
      testOp(singleBatch(seq), toPathObject(["b"]), toValueObject(2)),
    )

    // Ensure passthrough behavior (shape preserved) and no throw
    const decoded = result[0].map(([path, value]) => [
      path.decoded,
      value.decoded,
    ])
    assert.deepEqual(decoded, [
      [["a"], 1],
      [["b"], 2],
    ])
  })

  it("throws when the path/value does not exist in the sequence", async () => {
    const p1 = toPathObject(["a"])
    const v1 = toValueObject(1)
    const p2 = toPathObject(["b"])
    const v2 = toValueObject(2)

    /** @type {Array<[Path, Value]>} */
    const seq = [
      [p1, v1],
      [p2, v2],
    ]

    await assert.rejects(() =>
      collect(testOp(singleBatch(seq), toPathObject(["c"]), toValueObject(3))),
    )
  })

  it("passes when all object sub path/values exist under the base path", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["root", "a"]), toValueObject(1)],
      [toPathObject(["root", "b", "c"]), toValueObject(true)],
      [toPathObject(["x"]), toValueObject(0)],
    ]

    const result = await collect(
      testOp(
        singleBatch(seq),
        toPathObject(["root"]),
        toValueObject({ a: 1, b: { c: true } }),
      ),
    )

    // passthrough unchanged
    assert.deepEqual(decode(result)[0], [
      [["root", "a"], 1],
      [["root", "b", "c"], true],
      [["x"], 0],
    ])
  })

  it("throws when any required object sub path/value is missing", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["root", "a"]), toValueObject(1)],
      // missing ["root","b","c"]
    ]

    await assert.rejects(() =>
      collect(
        testOp(
          singleBatch(seq),
          toPathObject(["root"]),
          toValueObject({ a: 1, b: { c: true } }),
        ),
      ),
    )
  })

  it("passes when all array elements exist under the base path", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["arr", 0]), toValueObject(10)],
      [toPathObject(["arr", 1]), toValueObject(20)],
    ]

    const result = await collect(
      testOp(singleBatch(seq), toPathObject(["arr"]), toValueObject([10, 20])),
    )

    assert.deepEqual(decode(result)[0], [
      [["arr", 0], 10],
      [["arr", 1], 20],
    ])
  })

  it("handles empty object and empty array under base path", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["rootEmptyObj"]), toValueObject({})],
      [toPathObject(["rootEmptyArr"]), toValueObject([])],
    ]

    // empty object
    await collect(
      testOp(singleBatch(seq), toPathObject(["rootEmptyObj"]), toValueObject({})),
    )
    // empty array
    await collect(
      testOp(singleBatch(seq), toPathObject(["rootEmptyArr"]), toValueObject([])),
    )
  })

  it("throws when empty object pair under base path is missing", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = []

    await assert.rejects(() =>
      collect(
        testOp(singleBatch(seq), toPathObject(["rootEmptyObj"]), toValueObject({})),
      ),
    )
  })
})

describe("SequenceProcessor add op", () => {
  it("inserts into object subtree in pre-order (between siblings)", async () => {
    // Base sequence represents: { a: 1, b: { x: true }, c: 3 }
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["a"]), toValueObject(1)],
      [toPathObject(["b", "x"]), toValueObject(true)],
      [toPathObject(["c"]), toValueObject(3)],
    ]

    // Insert { b: { y: 2 } } so order becomes: [a], [b,x], [b,y], [c]
    const insertedPath = toPathObject(["b", "y"])
    const insertedValue = toValueObject(2)

    const result = await collect(
      addOp(singleBatch(seq), insertedPath, insertedValue),
    )
    assert.deepEqual(decode(result)[0], [
      [["a"], 1],
      [["b", "x"], true],
      [["b", "y"], 2],
      [["c"], 3],
    ])
  })

  it("appends at the end of an array subtree by index order", async () => {
    // Base sequence represents: { a: [1, 2] }
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["a", 0]), toValueObject(1)],
      [toPathObject(["a", 1]), toValueObject(2)],
    ]

    // Insert index 2 -> should come after index 1
    const insertedPath = toPathObject(["a", 2])
    const insertedValue = toValueObject(3)

    const result = await collect(
      addOp(singleBatch(seq), insertedPath, insertedValue),
    )
    assert.deepEqual(decode(result)[0], [
      [["a", 0], 1],
      [["a", 1], 2],
      [["a", 2], 3],
    ])
  })

  it("inserts as first child within a subtree when appropriate", async () => {
    // Base sequence represents: { a: { z: true }, b: 1 }
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["a", "z"]), toValueObject(true)],
      [toPathObject(["b"]), toValueObject(1)],
    ]

    // Insert a.a -> expected before a.z
    const insertedPath = toPathObject(["a", "a"])
    const insertedValue = toValueObject(0)

    const result = await collect(
      addOp(singleBatch(seq), insertedPath, insertedValue),
    )
    assert.deepEqual(decode(result)[0], [
      [["a", "a"], 0],
      [["a", "z"], true],
      [["b"], 1],
    ])
  })
})

describe("SequenceProcessor replace op", () => {
  it("replaces a leaf value in-place (same path)", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["a"]), toValueObject(1)],
      [toPathObject(["b", "x"]), toValueObject(true)],
      [toPathObject(["c"]), toValueObject(3)],
    ]

    const result = await collect(
      replaceOp(
        singleBatch(seq),
        toPathObject(["b", "x"]),
        toValueObject(false),
      ),
    )

    assert.deepEqual(decode(result)[0], [
      [["a"], 1],
      [["b", "x"], false],
      [["c"], 3],
    ])
  })

  it("replaces an element under an array, keeping order", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["a", 0]), toValueObject(1)],
      [toPathObject(["a", 1]), toValueObject(2)],
    ]

    const result = await collect(
      replaceOp(singleBatch(seq), toPathObject(["a", 0]), toValueObject(9)),
    )

    assert.deepEqual(decode(result)[0], [
      [["a", 0], 9],
      [["a", 1], 2],
    ])
  })
})

describe("SequenceProcessor remove op", () => {
  it("removes a leaf value only", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["a"]), toValueObject(1)],
      [toPathObject(["b", "x"]), toValueObject(true)],
      [toPathObject(["c"]), toValueObject(3)],
    ]

    const result = await collect(
      removeOp(singleBatch(seq), toPathObject(["b", "x"])),
    )

    assert.deepEqual(decode(result)[0], [
      [["a"], 1],
      [["c"], 3],
    ])
  })

  it("removes an entire subtree (object prefix)", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["a"]), toValueObject(1)],
      [toPathObject(["b", "x"]), toValueObject(true)],
      [toPathObject(["b", "y"]), toValueObject(2)],
      [toPathObject(["c"]), toValueObject(3)],
    ]

    const result = await collect(
      removeOp(singleBatch(seq), toPathObject(["b"])),
    )

    assert.deepEqual(decode(result)[0], [
      [["a"], 1],
      [["c"], 3],
    ])
  })

  it("removes a single array element (index prefix)", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [
      [toPathObject(["a", 0]), toValueObject(1)],
      [toPathObject(["a", 1]), toValueObject(2)],
    ]

    const result = await collect(
      removeOp(singleBatch(seq), toPathObject(["a", 0])),
    )

    assert.deepEqual(decode(result)[0], [[["a", 1], 2]])
  })

  it("does nothing when path not found", async () => {
    /** @type {Array<[Path, Value]>} */
    const seq = [[toPathObject(["a"]), toValueObject(1)]]

    const result = await collect(
      removeOp(singleBatch(seq), toPathObject(["x"])),
    )

    assert.deepEqual(decode(result)[0], [[["a"], 1]])
  })
})
