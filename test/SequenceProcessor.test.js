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
  const encodedItems = items.map(([path, value]) => [
    toPathObject(path),
    toValueObject(value),
  ])
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
    const seq1 = singleBatchSequence([[["rootEmptyObj"], {}]])
    const seq2 = singleBatchSequence([[["rootEmptyArr"], []]])

    // empty object
    const result1 = await collectAndDecode(
      testOp(seq1, toPathObject(["rootEmptyObj"]), toValueObject({})),
    )
    // empty array
    const result2 = await collectAndDecode(
      testOp(seq2, toPathObject(["rootEmptyArr"]), toValueObject([])),
    )

    assert.deepEqual(result1, [[["rootEmptyObj"], {}]])
    assert.deepEqual(result2, [[["rootEmptyArr"], []]])
  })

  it("throws when empty object pair under base path is missing", async () => {
    const seq = singleBatchSequence([])

    await assert.rejects(() =>
      collectAndDecode(
        testOp(seq, toPathObject(["rootEmptyObj"]), toValueObject({})),
      ),
    )
  })

  it("throws when path exists but value doesn't match (primitive)", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b"], 2],
    ])

    await assert.rejects(() =>
      collectAndDecode(testOp(seq, toPathObject(["b"]), toValueObject(999))),
    )
  })

  it("throws when partial object match (missing nested property)", async () => {
    const seq = singleBatchSequence([
      [["root", "a"], 1],
      // missing ["root", "b", "c"]
      [["x"], 0],
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

  it("throws when object has extra properties not in expected value", async () => {
    const seq = singleBatchSequence([
      [["root", "a"], 1],
      [["root", "b", "c"], true],
      [["root", "extra"], "unexpected"],
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

  it("throws when array length doesn't match", async () => {
    const seq = singleBatchSequence([
      [["arr", 0], 10],
      [["arr", 1], 20],
      [["arr", 2], 30], // extra element
    ])

    await assert.rejects(() =>
      collectAndDecode(
        testOp(seq, toPathObject(["arr"]), toValueObject([10, 20])),
      ),
    )
  })

  it("throws when array elements don't match", async () => {
    const seq = singleBatchSequence([
      [["arr", 0], 10],
      [["arr", 1], 999], // wrong value
    ])

    await assert.rejects(() =>
      collectAndDecode(
        testOp(seq, toPathObject(["arr"]), toValueObject([10, 20])),
      ),
    )
  })

  it("passes with deeply nested object structure", async () => {
    const seq = singleBatchSequence([
      [["deep", "level1", "level2", "a"], 42],
      [["deep", "level1", "level2", "b"], true],
      [["deep", "level1", "other"], "value"],
      [["other"], 123],
    ])

    const result = await collectAndDecode(
      testOp(
        seq,
        toPathObject(["deep"]),
        toValueObject({
          level1: {
            level2: { a: 42, b: true },
            other: "value",
          },
        }),
      ),
    )

    assert.deepEqual(result, [
      [["deep", "level1", "level2", "a"], 42],
      [["deep", "level1", "level2", "b"], true],
      [["deep", "level1", "other"], "value"],
      [["other"], 123],
    ])
  })

  it("passes with mixed array and object nesting", async () => {
    const seq = singleBatchSequence([
      [["mixed", "arr", 0, "prop"], "first"],
      [["mixed", "arr", 1, "prop"], "second"],
      [["mixed", "simple"], 100],
    ])

    const result = await collectAndDecode(
      testOp(
        seq,
        toPathObject(["mixed"]),
        toValueObject({
          arr: [{ prop: "first" }, { prop: "second" }],
          simple: 100,
        }),
      ),
    )

    assert.deepEqual(result, [
      [["mixed", "arr", 0, "prop"], "first"],
      [["mixed", "arr", 1, "prop"], "second"],
      [["mixed", "simple"], 100],
    ])
  })

  it("handles test on root level (empty path)", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", "x"], true],
    ])

    const result = await collectAndDecode(
      testOp(seq, toPathObject([]), toValueObject({ a: 1, b: { x: true } })),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b", "x"], true],
    ])
  })

  it("throws when testing root level with wrong structure", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", "x"], true],
    ])

    await assert.rejects(() =>
      collectAndDecode(
        testOp(
          seq,
          toPathObject([]),
          toValueObject({ a: 999, b: { x: true } }),
        ),
      ),
    )
  })

  it.only("handles sparse arrays correctly", async () => {
    const seq = singleBatchSequence([
      [["sparse", 0], "first"],
      [["sparse", 5], "sixth"],
    ])

    const expected = []
    expected[0] = "first"
    expected[5] = "sixth"

    const result = await collectAndDecode(
      testOp(seq, toPathObject(["sparse"]), toValueObject(expected)),
    )

    assert.deepEqual(result, [
      [["sparse", 0], "first"],
      [["sparse", 5], "sixth"],
    ])
  })

  it("passes through multiple batches unchanged", async () => {
    /**
     * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
     */
    async function* multipleBatchSequence() {
      yield [
        [toPathObject(["a"]), toValueObject(1)],
        [toPathObject(["b", "x"]), toValueObject(true)],
      ]
      yield [
        [toPathObject(["b", "y"]), toValueObject(false)],
        [toPathObject(["c"]), toValueObject(3)],
      ]
    }

    const result = await collectAndDecode(
      testOp(
        multipleBatchSequence(),
        toPathObject(["b"]),
        toValueObject({ x: true, y: false }),
      ),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b", "x"], true],
      [["b", "y"], false],
      [["c"], 3],
    ])
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

    const result = await collectAndDecode(removeOp(seq, toPathObject(["b"])))

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

    const result = await collectAndDecode(removeOp(seq, toPathObject(["a", 0])))

    assert.deepEqual(result, [[["a", 0], 2]])
  })

  it("throws an error when path not found", async () => {
    const seq = singleBatchSequence([[["a"], 1]])

    await assert.rejects(() =>
      collectAndDecode(removeOp(seq, toPathObject(["x"]))),
    )
  })

  it("removes array element and compacts remaining elements", async () => {
    const seq = singleBatchSequence([
      [["arr", 0], "first"],
      [["arr", 1], "second"],
      [["arr", 2], "third"],
      [["arr", 3], "fourth"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["arr", 1])),
    )

    // Array indexes should be compacted after removal
    assert.deepEqual(result, [
      [["arr", 0], "first"],
      [["arr", 1], "third"],
      [["arr", 2], "fourth"],
    ])
  })

  it("removes last array element", async () => {
    const seq = singleBatchSequence([
      [["arr", 0], "first"],
      [["arr", 1], "second"],
      [["arr", 2], "third"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["arr", 2])),
    )

    assert.deepEqual(result, [
      [["arr", 0], "first"],
      [["arr", 1], "second"],
    ])
  })

  it("removes first array element", async () => {
    const seq = singleBatchSequence([
      [["arr", 0], "first"],
      [["arr", 1], "second"],
      [["arr", 2], "third"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["arr", 0])),
    )

    assert.deepEqual(result, [
      [["arr", 0], "second"],
      [["arr", 1], "third"],
    ])
  })

  it("removes from sparse array", async () => {
    const seq = singleBatchSequence([
      [["arr", 0], "first"],
      [["arr", 5], "sixth"],
      [["arr", 10], "eleventh"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["arr", 5])),
    )

    // Indexes above removed element should be decremented
    assert.deepEqual(result, [
      [["arr", 0], "first"],
      [["arr", 9], "eleventh"],
    ])
  })

  it("removes nested object property", async () => {
    const seq = singleBatchSequence([
      [["root", "nested", "prop1"], "value1"],
      [["root", "nested", "prop2"], "value2"],
      [["root", "other"], "unchanged"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["root", "nested", "prop1"])),
    )

    // Remove operation stops processing after finding and removing the target
    assert.deepEqual(result, [
      [["root", "nested", "prop2"], "value2"],
      [["root", "other"], "unchanged"],
    ])
  })

  it("removes entire nested object leaving empty container", async () => {
    const seq = singleBatchSequence([
      [["root", "nested", "prop"], "value"],
      [["root", "other"], "unchanged"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["root", "nested", "prop"])),
    )

    // Should add empty object container for "nested"
    assert.deepEqual(result, [
      [["root", "nested"], {}],
      [["root", "other"], "unchanged"],
    ])
  })

  it("removes property from object with no siblings", async () => {
    const seq = singleBatchSequence([[["obj", "onlyProp"], "value"]])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["obj", "onlyProp"])),
    )

    // The empty container gets created at the end with the path of the removed item, not its container
    assert.deepEqual(result, [[["obj"], {}]])
  })

  it("removes array element with no siblings", async () => {
    const seq = singleBatchSequence([[["arr", 0], "onlyElement"]])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["arr", 0])),
    )

    // The empty container gets created at the end with the path of the removed item, not its container
    assert.deepEqual(result, [[["arr"], []]])
  })

  it("removes multiple array elements by removing entire subtree", async () => {
    const seq = singleBatchSequence([
      [["data", "arr", 0], "first"],
      [["data", "arr", 1], "second"],
      [["data", "arr", 2], "third"],
      [["data", "other"], "unchanged"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["data", "arr"])),
    )

    assert.deepEqual(result, [[["data", "other"], "unchanged"]])
  })

  it("handles mixed object and array removal", async () => {
    const seq = singleBatchSequence([
      [["mixed", "arr", 0, "prop"], "value1"],
      [["mixed", "arr", 1, "prop"], "value2"],
      [["mixed", "simple"], "unchanged"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["mixed", "arr", 0])),
    )

    // Array index should be compacted, but processing stops after removal
    assert.deepEqual(result, [
      [["mixed", "arr", 0, "prop"], "value2"],
      [["mixed", "simple"], "unchanged"],
    ])
  })

  it("removes root level property", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b"], 2],
      [["c"], 3],
    ])

    const result = await collectAndDecode(removeOp(seq, toPathObject(["b"])))

    assert.deepEqual(result, [
      [["a"], 1],
      [["c"], 3],
    ])
  })

  it("throws error when removing non-existent nested path", async () => {
    const seq = singleBatchSequence([[["a", "b"], "value"]])

    await assert.rejects(
      () => collectAndDecode(removeOp(seq, toPathObject(["a", "c"]))),
      /The path .*was not found/,
    )
  })

  it("throws error when removing from non-existent container", async () => {
    const seq = singleBatchSequence([[["a"], 1]])

    await assert.rejects(
      () => collectAndDecode(removeOp(seq, toPathObject(["b", "c"]))),
      /The path .*was not found/,
    )
  })

  it("handles multiple batches correctly", async () => {
    /**
     * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
     */
    async function* multipleBatchSequence() {
      yield [
        [toPathObject(["a"]), toValueObject(1)],
        [toPathObject(["b", "x"]), toValueObject(true)],
      ]
      yield [
        [toPathObject(["b", "y"]), toValueObject(false)],
        [toPathObject(["c"]), toValueObject(3)],
      ]
    }

    const result = await collectAndDecode(
      removeOp(multipleBatchSequence(), toPathObject(["b", "x"])),
    )

    // Processing continues after removal but subsequent items might not be yielded
    assert.deepEqual(result, [
      [["a"], 1],
      [["b", "y"], false],
      [["c"], 3],
    ])
  })

  it("removes deeply nested property", async () => {
    const seq = singleBatchSequence([
      [["deep", "level1", "level2", "level3", "prop"], "value"],
      [["deep", "level1", "other"], "unchanged"],
    ])

    const result = await collectAndDecode(
      removeOp(
        seq,
        toPathObject(["deep", "level1", "level2", "level3", "prop"]),
      ),
    )

    // Should create empty containers for the removed nested structure
    assert.deepEqual(result, [
      [["deep", "level1", "level2", "level3"], {}],
      [["deep", "level1", "other"], "unchanged"],
    ])
  })

  it("handles empty container creation at sequence end", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["z", "prop"], "value"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["z", "prop"])),
    )

    // Empty container is created with the removed path, not its container path
    assert.deepEqual(result, [
      [["a"], 1],
      [["z"], {}],
    ])
  })

  it("removes from complex nested structure", async () => {
    const seq = singleBatchSequence([
      [["root", "users", 0, "name"], "Alice"],
      [["root", "users", 0, "age"], 30],
      [["root", "users", 1, "name"], "Bob"],
      [["root", "users", 1, "age"], 25],
      [["root", "config"], "unchanged"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["root", "users", 0])),
    )

    // Should compact array indexes but processing might stop after removal
    assert.deepEqual(result, [
      [["root", "users", 0, "name"], "Bob"],
      [["root", "users", 0, "age"], 25],
      [["root", "config"], "unchanged"],
    ])
  })

  it("handles removal when path found outside container", async () => {
    // This tests the PATH_FOUND_OUTSIDE_CONTAINER state
    const seq = singleBatchSequence([
      [["isolated", "prop"], "value"],
      [["other"], "unchanged"],
    ])

    const result = await collectAndDecode(
      removeOp(seq, toPathObject(["isolated", "prop"])),
    )

    // Should add empty container since no siblings were found
    assert.deepEqual(result, [
      [["isolated"], {}],
      [["other"], "unchanged"],
    ])
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

  it("adds to empty object", async () => {
    // Base sequence represents: { a: {} }
    const seq = singleBatchSequence([[["a"], {}]])

    const result = await collectAndDecode(
      addOp(seq, toPathObject(["a", "newProp"]), toValueObject(42)),
    )

    assert.deepEqual(result, [[["a", "newProp"], 42]])
  })

  it("adds to empty array", async () => {
    // Base sequence represents: { a: [] }
    const seq = singleBatchSequence([[["a"], []]])

    const result = await collectAndDecode(
      addOp(seq, toPathObject(["a", 0]), toValueObject("first")),
    )

    assert.deepEqual(result, [[["a", 0], "first"]])
  })

  it("throws error when trying to add to non-empty object as if it were empty", async () => {
    // Base sequence has a non-empty object but we're trying to replace it
    const seq = singleBatchSequence([[["a"], { existing: "value" }]])

    await assert.rejects(async () => {
      await collectAndDecode(
        addOp(seq, toPathObject(["a", "newProp"]), toValueObject(42)),
      )
    }, /expected empty object/)
  })

  it("throws error when trying to add to non-empty array as if it were empty", async () => {
    // Base sequence has a non-empty array but we're trying to replace it
    const seq = singleBatchSequence([[["a"], ["existing"]]])

    await assert.rejects(async () => {
      await collectAndDecode(
        addOp(seq, toPathObject(["a", 0]), toValueObject("new")),
      )
    }, /expected empty array/)
  })

  it("inserts complex object value", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["c"], 3],
    ])

    const complexValue = toValueObject({ nested: { deep: true }, arr: [1, 2] })

    const result = await collectAndDecode(
      addOp(seq, toPathObject(["b"]), complexValue),
    )

    // The add operation appends at the end of the container
    assert.deepEqual(result, [
      [["a"], 1],
      [["c"], 3],
      [["b", "nested", "deep"], true],
      [["b", "arr", 0], 1],
      [["b", "arr", 1], 2],
    ])
  })

  it("inserts array value", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["c"], 3],
    ])

    const arrayValue = toValueObject([10, 20, 30])

    const result = await collectAndDecode(
      addOp(seq, toPathObject(["b"]), arrayValue),
    )

    // The add operation appends at the end of the container
    assert.deepEqual(result, [
      [["a"], 1],
      [["c"], 3],
      [["b", 0], 10],
      [["b", 1], 20],
      [["b", 2], 30],
    ])
  })

  it("handles array insertion with index shifting correctly", async () => {
    const seq = singleBatchSequence([
      [["arr", 0], "first"],
      [["arr", 1], "second"],
      [["arr", 2], "third"],
    ])

    const result = await collectAndDecode(
      addOp(seq, toPathObject(["arr", 1]), toValueObject("inserted")),
    )

    assert.deepEqual(result, [
      [["arr", 0], "first"],
      [["arr", 1], "inserted"],
      [["arr", 2], "second"],
      [["arr", 3], "third"],
    ])
  })

  it("handles string replacement in object", async () => {
    const seq = singleBatchSequence([
      [["obj", "prop"], "old"],
      [["obj", "other"], "unchanged"],
    ])

    const result = await collectAndDecode(
      addOp(seq, toPathObject(["obj", "prop"]), toValueObject("new")),
    )

    assert.deepEqual(result, [
      [["obj", "prop"], "new"],
      [["obj", "other"], "unchanged"],
    ])
  })

  it("adds to root level", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      addOp(seq, toPathObject(["b"]), toValueObject(2)),
    )

    // The add operation appends at the end of the container
    assert.deepEqual(result, [
      [["a"], 1],
      [["c"], 3],
      [["b"], 2],
    ])
  })

  it("throws error for path segment mismatch in array context", async () => {
    const seq = singleBatchSequence([[["arr", "notNumber"], "wrong"]])

    await assert.rejects(async () => {
      await collectAndDecode(
        addOp(seq, toPathObject(["arr", 0]), toValueObject("value")),
      )
    }, /Path segment mismatch: expected array index/)
  })

  it("handles multiple batches correctly", async () => {
    /**
     * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
     */
    async function* multipleBatchSequence() {
      yield [
        [toPathObject(["a"]), toValueObject(1)],
        [toPathObject(["b", "x"]), toValueObject(true)],
      ]
      yield [[toPathObject(["c"]), toValueObject(3)]]
    }

    const result = await collectAndDecode(
      addOp(
        multipleBatchSequence(),
        toPathObject(["b", "y"]),
        toValueObject(false),
      ),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b", "x"], true],
      [["b", "y"], false],
      [["c"], 3],
    ])
  })

  it("handles deeply nested path addition", async () => {
    const seq = singleBatchSequence([
      [["deep", "level1", "level2", "existing"], "value"],
      [["other"], "prop"],
    ])

    const result = await collectAndDecode(
      addOp(
        seq,
        toPathObject(["deep", "level1", "level2", "new"]),
        toValueObject("added"),
      ),
    )

    assert.deepEqual(result, [
      [["deep", "level1", "level2", "existing"], "value"],
      [["deep", "level1", "level2", "new"], "added"],
      [["other"], "prop"],
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
      replaceOp(seq, toPathObject(["b", "x"]), toValueObject(false)),
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

  it("replaces an entire subtree with a simple value", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", "x"], true],
      [["b", "y"], false],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["b"]), toValueObject("replaced")),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b"], "replaced"],
      [["c"], 3],
    ])
  })

  it("replaces a simple value with a complex object", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b"], 2],
      [["c"], 3],
    ])

    const complexValue = toValueObject({ nested: { deep: true }, arr: [1, 2] })

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["b"]), complexValue),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b", "nested", "deep"], true],
      [["b", "arr", 0], 1],
      [["b", "arr", 1], 2],
      [["c"], 3],
    ])
  })

  it("replaces a subtree with a different complex object", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["data", "old", "prop1"], "value1"],
      [["data", "old", "prop2"], "value2"],
      [["data", "other"], "unchanged"],
      [["c"], 3],
    ])

    const newValue = toValueObject({ new: { structure: "yes" } })

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["data", "old"]), newValue),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["data", "old", "new", "structure"], "yes"],
      [["data", "other"], "unchanged"],
      [["c"], 3],
    ])
  })

  it("replaces an array element with a complex object", async () => {
    const seq = singleBatchSequence([
      [["arr", 0], "first"],
      [["arr", 1], "second"],
      [["arr", 2], "third"],
    ])

    const complexValue = toValueObject({ replaced: true, data: [10, 20] })

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["arr", 1]), complexValue),
    )

    assert.deepEqual(result, [
      [["arr", 0], "first"],
      [["arr", 1, "replaced"], true],
      [["arr", 1, "data", 0], 10],
      [["arr", 1, "data", 1], 20],
      [["arr", 2], "third"],
    ])
  })

  it("replaces root level property", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b"], 2],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["b"]), toValueObject("new_value")),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b"], "new_value"],
      [["c"], 3],
    ])
  })

  it("replaces entire root structure", async () => {
    const seq = singleBatchSequence([
      [["old", "prop1"], "value1"],
      [["old", "prop2"], "value2"],
      [["other"], "prop"],
    ])

    const newRootValue = toValueObject({
      completely: { different: "structure" },
    })

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["old"]), newRootValue),
    )

    assert.deepEqual(result, [
      [["old", "completely", "different"], "structure"],
      [["other"], "prop"],
    ])
  })

  it("replaces first item in sequence", async () => {
    const seq = singleBatchSequence([
      [["first"], "original"],
      [["second"], "unchanged"],
      [["third"], "also_unchanged"],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["first"]), toValueObject("replaced")),
    )

    assert.deepEqual(result, [
      [["first"], "replaced"],
      [["second"], "unchanged"],
      [["third"], "also_unchanged"],
    ])
  })

  it("replaces last item in sequence", async () => {
    const seq = singleBatchSequence([
      [["first"], "unchanged"],
      [["second"], "also_unchanged"],
      [["last"], "original"],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["last"]), toValueObject("replaced")),
    )

    assert.deepEqual(result, [
      [["first"], "unchanged"],
      [["second"], "also_unchanged"],
      [["last"], "replaced"],
    ])
  })

  it("replaces with empty object", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", "nested", "prop"], "value"],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["b"]), toValueObject({})),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b"], {}],
      [["c"], 3],
    ])
  })

  it("replaces with empty array", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", 0], "item1"],
      [["b", 1], "item2"],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["b"]), toValueObject([])),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b"], []],
      [["c"], 3],
    ])
  })

  it("handles replacement in deeply nested structure", async () => {
    const seq = singleBatchSequence([
      [["deep", "level1", "level2", "level3", "target"], "original"],
      [["deep", "level1", "level2", "other"], "unchanged"],
      [["deep", "sibling"], "also_unchanged"],
    ])

    const result = await collectAndDecode(
      replaceOp(
        seq,
        toPathObject(["deep", "level1", "level2", "level3", "target"]),
        toValueObject("replaced"),
      ),
    )

    assert.deepEqual(result, [
      [["deep", "level1", "level2", "level3", "target"], "replaced"],
      [["deep", "level1", "level2", "other"], "unchanged"],
      [["deep", "sibling"], "also_unchanged"],
    ])
  })

  it("replaces array element preserving other elements' order", async () => {
    const seq = singleBatchSequence([
      [["data", "items", 0], "first"],
      [["data", "items", 1, "prop"], "middle"],
      [["data", "items", 2], "last"],
      [["data", "config"], "setting"],
    ])

    const result = await collectAndDecode(
      replaceOp(
        seq,
        toPathObject(["data", "items", 1]),
        toValueObject("simple_replacement"),
      ),
    )

    assert.deepEqual(result, [
      [["data", "items", 0], "first"],
      [["data", "items", 1], "simple_replacement"],
      [["data", "items", 2], "last"],
      [["data", "config"], "setting"],
    ])
  })

  it("throws error when path not found", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b"], 2],
    ])

    await assert.rejects(
      () =>
        collectAndDecode(
          replaceOp(seq, toPathObject(["nonexistent"]), toValueObject("value")),
        ),
      /The path .*was not found.*Replacement not possible/,
    )
  })

  it("throws error when nested path not found", async () => {
    const seq = singleBatchSequence([
      [["a", "exists"], "value"],
      [["b"], 2],
    ])

    await assert.rejects(
      () =>
        collectAndDecode(
          replaceOp(
            seq,
            toPathObject(["a", "missing"]),
            toValueObject("value"),
          ),
        ),
      /The path .*was not found.*Replacement not possible/,
    )
  })

  it("throws error when container path exists but target path doesn't", async () => {
    const seq = singleBatchSequence([
      [["container", "prop1"], "value1"],
      [["container", "prop2"], "value2"],
    ])

    await assert.rejects(
      () =>
        collectAndDecode(
          replaceOp(
            seq,
            toPathObject(["container", "missing"]),
            toValueObject("value"),
          ),
        ),
      /The path .*was not found.*Replacement not possible/,
    )
  })

  it("handles multiple batches correctly during replacement", async () => {
    /**
     * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
     */
    async function* multipleBatchSequence() {
      yield [
        [toPathObject(["a"]), toValueObject(1)],
        [toPathObject(["b", "x"]), toValueObject(true)],
      ]
      yield [
        [toPathObject(["b", "y"]), toValueObject(false)],
        [toPathObject(["c"]), toValueObject(3)],
      ]
    }

    const result = await collectAndDecode(
      replaceOp(
        multipleBatchSequence(),
        toPathObject(["b", "x"]),
        toValueObject("replaced"),
      ),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b", "x"], "replaced"],
      [["b", "y"], false],
      [["c"], 3],
    ])
  })

  it("stops processing subtree items after replacement (REPLACED state)", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["target", "child1"], "will_be_removed"],
      [["target", "child2"], "will_also_be_removed"],
      [["target", "nested", "deep"], "removed_too"],
      [["after"], "should_appear"],
    ])

    const result = await collectAndDecode(
      replaceOp(
        seq,
        toPathObject(["target"]),
        toValueObject("simple_replacement"),
      ),
    )

    // Items under "target" path should be skipped after replacement
    assert.deepEqual(result, [
      [["a"], 1],
      [["target"], "simple_replacement"],
      [["after"], "should_appear"],
    ])
  })

  it("handles replacement when target path has no children", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["target"], "leaf_value"],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["target"]), toValueObject("replaced")),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["target"], "replaced"],
      [["c"], 3],
    ])
  })

  it("replaces array with object", async () => {
    const seq = singleBatchSequence([
      [["data", 0], "first"],
      [["data", 1], "second"],
      [["other"], "unchanged"],
    ])

    const newValue = toValueObject({ converted: "from_array", type: "object" })

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["data"]), newValue),
    )

    assert.deepEqual(result, [
      [["data", "converted"], "from_array"],
      [["data", "type"], "object"],
      [["other"], "unchanged"],
    ])
  })

  it("replaces object with array", async () => {
    const seq = singleBatchSequence([
      [["data", "prop1"], "value1"],
      [["data", "prop2"], "value2"],
      [["other"], "unchanged"],
    ])

    const newValue = toValueObject(["first", "second", "third"])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["data"]), newValue),
    )

    assert.deepEqual(result, [
      [["data", 0], "first"],
      [["data", 1], "second"],
      [["data", 2], "third"],
      [["other"], "unchanged"],
    ])
  })

  it("handles replacement at root level (empty path)", async () => {
    const seq = singleBatchSequence([
      [["old", "structure"], "data"],
      [["old", "more"], "info"],
    ])

    const newRoot = toValueObject({ new: { root: "structure" } })

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject([]), newRoot),
    )

    assert.deepEqual(result, [[["new", "root"], "structure"]])
  })

  it("replaces with null value", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["b", "complex", "structure"], "value"],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["b"]), toValueObject(null)),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["b"], null],
      [["c"], 3],
    ])
  })

  it("replaces with boolean value", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["flag", "nested", "setting"], "complex"],
      [["c"], 3],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["flag"]), toValueObject(true)),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["flag"], true],
      [["c"], 3],
    ])
  })

  it("handles state machine transitions correctly through all states", async () => {
    // This test ensures proper state machine behavior:
    // SEARCHING -> PATH_FOUND -> REPLACED -> DONE
    const seq = singleBatchSequence([
      [["before"], "should_pass_through"], // SEARCHING state
      [["target", "sub1"], "will_be_replaced"], // PATH_FOUND state
      [["target", "sub2"], "will_be_skipped"], // REPLACED state
      [["after"], "should_pass_through"], // DONE state
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["target"]), toValueObject("new_value")),
    )

    assert.deepEqual(result, [
      [["before"], "should_pass_through"],
      [["target"], "new_value"],
      [["after"], "should_pass_through"],
    ])
  })

  it("replaces when target path is exact match (not just prefix)", async () => {
    const seq = singleBatchSequence([
      [["prefix"], "exact_match"],
      [["prefix", "child"], "this_is_child"],
      [["other"], "unrelated"],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["prefix"]), toValueObject("replaced")),
    )

    // Should replace the entire "prefix" subtree
    assert.deepEqual(result, [
      [["prefix"], "replaced"],
      [["other"], "unrelated"],
    ])
  })

  it("preserves items that come lexicographically after replaced path", async () => {
    const seq = singleBatchSequence([
      [["a"], 1],
      [["m", "replaced"], "old_value"],
      [["z"], "should_remain"],
    ])

    const result = await collectAndDecode(
      replaceOp(
        seq,
        toPathObject(["m", "replaced"]),
        toValueObject("new_value"),
      ),
    )

    assert.deepEqual(result, [
      [["a"], 1],
      [["m", "replaced"], "new_value"],
      [["z"], "should_remain"],
    ])
  })

  it("replaces path that has many children", async () => {
    const seq = singleBatchSequence([
      [["keep"], "unchanged"],
      [["target", "child1"], "remove1"],
      [["target", "child2", "nested"], "remove2"],
      [["target", "child3"], "remove3"],
      [["target", "child4", "deep", "nesting"], "remove4"],
      [["z_after"], "should_remain"],
    ])

    const result = await collectAndDecode(
      replaceOp(
        seq,
        toPathObject(["target"]),
        toValueObject("simple_replacement"),
      ),
    )

    assert.deepEqual(result, [
      [["keep"], "unchanged"],
      [["target"], "simple_replacement"],
      [["z_after"], "should_remain"],
    ])
  })

  it("handles exact path match vs prefix path correctly", async () => {
    // Test that ["a", "b"] path exactly matches ["a", "b"] and not ["a", "b", "c"]
    const seq = singleBatchSequence([
      [["a", "b"], "exact_target"],
      [["a", "b", "c"], "child_of_target"],
      [["a", "other"], "sibling"],
    ])

    const result = await collectAndDecode(
      replaceOp(seq, toPathObject(["a", "b"]), toValueObject("replaced")),
    )

    // Should replace both the exact match and its children
    assert.deepEqual(result, [
      [["a", "b"], "replaced"],
      [["a", "other"], "sibling"],
    ])
  })

  it("throws descriptive error for non-existent path in middle of sequence", async () => {
    const seq = singleBatchSequence([
      [["exists1"], "value1"],
      [["exists2"], "value2"],
      [["exists3"], "value3"],
    ])

    const error = await assert.rejects(
      () =>
        collectAndDecode(
          replaceOp(seq, toPathObject(["nonexistent"]), toValueObject("value")),
        ),
      /The path .*was not found.*Replacement not possible/,
    )
  })
})
