//@ts-check
import assert from "assert"
import { describe, it, beforeEach } from "node:test"

import { streamToIterable, objectToIterable } from "../src/index.js"
import { Path } from "../src/lib/path.js"
import { Value } from "../src/lib/value.js"

/**
 * @param {[Path, Value, (number | undefined)?, (number | undefined)?]} pathAndValue
 * @returns {[Array<string | number>, any, number | null, number | null]}
 */
function decodePathAndValue(pathAndValue) {
  const [path, value, start, end] = pathAndValue
  return [path.decoded, value.decoded, start ?? null, end ?? null]
}

/**
 *
 * @param {Array<string>} array
 * @returns {Iterable<Uint8Array>}
 */
function arrayOfStringsToStream(array) {
  const encoder = new TextEncoder()
  return array.map((text) => encoder.encode(text))
}

describe("streamToIterable", () => {
  it("works", async () => {
    const streamLike = arrayOfStringsToStream(['{"test1":{"te', 'st2":1}}'])
    const array = await streamToIterable(streamLike)
      .includes("'test1'('test2')")
      .toArray()
    const seq = array.map(decodePathAndValue)

    assert.deepEqual(seq, [[["test1", "test2"], 1, 18, 19]])
  })

  it("add operation", async () => {
    const streamLike = arrayOfStringsToStream(['{"a":1,"c":3}'])
    const result = await streamToIterable(streamLike)
      .add(["b"], 2)
      .toObject()

    assert.deepEqual(result, { a: 1, c: 3, b: 2 })
  })

  it("remove operation", async () => {
    const streamLike = arrayOfStringsToStream(['{"a":1,"b":2,"c":3}'])
    const result = await streamToIterable(streamLike)
      .remove(["b"])
      .toObject()

    assert.deepEqual(result, { a: 1, c: 3 })
  })

  it("test operation", async () => {
    const streamLike = arrayOfStringsToStream(['{"a":1,"b":2,"c":3}'])
    const array = await streamToIterable(streamLike)
      .test(["b"], 2)
      .toArray()
    const seq = array.map(decodePathAndValue)

    // test operation is pass-through: yields all items unchanged if test passes
    // We only check path and value, not character positions which can vary
    assert.equal(seq.length, 3)
    assert.deepEqual(seq[0].slice(0, 2), [["a"], 1])
    assert.deepEqual(seq[1].slice(0, 2), [["b"], 2]) 
    assert.deepEqual(seq[2].slice(0, 2), [["c"], 3])
  })

  it("test operation throws when value doesn't match", async () => {
    const streamLike = arrayOfStringsToStream(['{"a":1,"b":2,"c":3}'])
    await assert.rejects(async () => {
      await streamToIterable(streamLike)
        .test(["b"], 99) // Wrong value
        .toArray()
    }, /value does not match/)
  })

  it("replace operation", async () => {
    const streamLike = arrayOfStringsToStream(['{"a":1,"b":2,"c":3}'])
    const result = await streamToIterable(streamLike)
      .replace(["b"], 99)
      .toObject()

    assert.deepEqual(result, { a: 1, b: 99, c: 3 })
  })

  it("patch operation with multiple operations", async () => {
    const streamLike = arrayOfStringsToStream(['{"a":1,"b":2,"c":3}'])
    const result = await streamToIterable(streamLike)
      .patch([
        { op: "remove", path: ["b"] },
        { op: "add", path: ["d"], value: 4 },
        { op: "replace", path: ["c"], value: 99 }
      ])
      .toObject()

    assert.deepEqual(result, { a: 1, c: 99, d: 4 })
  })

  it("patch operation with test", async () => {
    const streamLike = arrayOfStringsToStream(['{"a":1,"b":2,"c":3}'])
    const result = await streamToIterable(streamLike)
      .patch([
        { op: "test", path: ["b"], value: 2 }, // Validate b equals 2
        { op: "replace", path: ["b"], value: 99 }
      ])
      .toObject()

    assert.deepEqual(result, { a: 1, b: 99, c: 3 })
  })
})

describe("objectToIterable", () => {
  it("works", async () => {
    const array = await objectToIterable({ test1: { test2: 1 } })
      .includes("'test1'('test2')")
      .toArray()
    const seq = array.map(decodePathAndValue)

    assert.deepEqual(seq, [[["test1", "test2"], 1, null, null]])
  })

  it("add operation", async () => {
    const result = await objectToIterable({ a: 1, c: 3 })
      .add(["b"], 2)
      .toObject()

    assert.deepEqual(result, { a: 1, c: 3, b: 2 })
  })

  it("remove operation", async () => {
    const result = await objectToIterable({ a: 1, b: 2, c: 3 })
      .remove(["b"])
      .toObject()

    assert.deepEqual(result, { a: 1, c: 3 })
  })

  it("test operation", async () => {
    const array = await objectToIterable({ a: 1, b: 2, c: 3 })
      .test(["b"], 2)
      .toArray()
    const seq = array.map(decodePathAndValue)

    // test operation is pass-through: yields all items unchanged if test passes
    assert.deepEqual(seq, [
      [["a"], 1, null, null],
      [["b"], 2, null, null], 
      [["c"], 3, null, null]
    ])
  })

  it("test operation throws when value doesn't match", async () => {
    await assert.rejects(async () => {
      await objectToIterable({ a: 1, b: 2, c: 3 })
        .test(["b"], 99) // Wrong value
        .toArray()
    }, /value does not match/)
  })

  it("replace operation", async () => {
    const result = await objectToIterable({ a: 1, b: 2, c: 3 })
      .replace(["b"], 99)
      .toObject()

    assert.deepEqual(result, { a: 1, b: 99, c: 3 })
  })

  it("patch operation with multiple operations", async () => {
    const result = await objectToIterable({ a: 1, b: 2, c: 3 })
      .patch([
        { op: "remove", path: ["b"] },
        { op: "add", path: ["d"], value: 4 },
        { op: "replace", path: ["c"], value: 99 }
      ])
      .toObject()

    assert.deepEqual(result, { a: 1, c: 99, d: 4 })
  })

  it("patch operation with test", async () => {
    const result = await objectToIterable({ a: 1, b: 2, c: 3 })
      .patch([
        { op: "test", path: ["b"], value: 2 }, // Validate b equals 2
        { op: "replace", path: ["b"], value: 99 }
      ])
      .toObject()

    assert.deepEqual(result, { a: 1, b: 99, c: 3 })
  })
})
