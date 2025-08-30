//@ts-check
import assert from "assert"
import { describe, it } from "node:test"

import {
  isArrayOrObject,
  decodeAndParse,
  stringifyAndEncode,
  areDeeplyEqual,
  mergeBuffers,
  ParsingError,
} from "../../src/lib/utils.js"

describe("isArrayOrObject", () => {
  it("works with plain objects", () => assert.equal(isArrayOrObject({}), true))
  it("works with arrays", () => assert.equal(isArrayOrObject([]), true))
  it("works with undefined", () =>
    assert.equal(isArrayOrObject(undefined), false))
  it("works with null", () => assert.equal(isArrayOrObject(null), false))
  it("works with 0", () => assert.equal(isArrayOrObject(0), false))
  it("works with 1", () => assert.equal(isArrayOrObject(1), false))
  it("works with empty strings", () => assert.equal(isArrayOrObject(""), false))
  it("works with strings", () => assert.equal(isArrayOrObject("xyz"), false))
  it("works with objects", () =>
    assert.equal(isArrayOrObject(new Date()), true))
})
describe("decodeAndParse stringifyAndEncode", () => {
  it("encodes", () =>
    assert.deepEqual(
      stringifyAndEncode("hello"),
      new Uint8Array([34, 104, 101, 108, 108, 111, 34]),
    ))
  it("decodes", () =>
    assert.deepEqual(
      "hello",
      decodeAndParse(new Uint8Array([34, 104, 101, 108, 108, 111, 34])),
    ))
})

describe("areDeeplyEqual", () => {
  it("returns true for equal primitives", () => {
    assert.equal(areDeeplyEqual(1, 1), true)
    assert.equal(areDeeplyEqual("abc", "abc"), true)
    assert.equal(areDeeplyEqual(true, true), true)
    assert.equal(areDeeplyEqual(null, null), true)
    assert.equal(areDeeplyEqual(undefined, undefined), true)
  })

  it("returns false for different primitives", () => {
    assert.equal(areDeeplyEqual(1, 2), false)
    assert.equal(areDeeplyEqual("abc", "def"), false)
    assert.equal(areDeeplyEqual(true, false), false)
    assert.equal(areDeeplyEqual(null, undefined), false)
    assert.equal(areDeeplyEqual(undefined, null), false)
  })

  it("returns true for deeply equal arrays", () => {
    assert.equal(areDeeplyEqual([1, 2, 3], [1, 2, 3]), true)
    assert.equal(areDeeplyEqual([[1], [2]], [[1], [2]]), true)
    assert.equal(areDeeplyEqual([], []), true)
  })

  it("returns false for different arrays", () => {
    assert.equal(areDeeplyEqual([1, 2], [1, 2, 3]), false)
    assert.equal(areDeeplyEqual([1, 2, 3], [3, 2, 1]), false)
    assert.equal(areDeeplyEqual([1, [2]], [1, [3]]), false)
  })

  it("returns true for deeply equal objects", () => {
    assert.equal(areDeeplyEqual({ a: 1, b: 2 }, { a: 1, b: 2 }), true)
    assert.equal(areDeeplyEqual({ a: { b: 2 } }, { a: { b: 2 } }), true)
    assert.equal(areDeeplyEqual({}, {}), true)
  })

  it("returns false for different objects", () => {
    assert.equal(areDeeplyEqual({ a: 1 }, { a: 2 }), false)
    assert.equal(areDeeplyEqual({ a: 1 }, { b: 1 }), false)
    assert.equal(areDeeplyEqual({ a: { b: 2 } }, { a: { b: 3 } }), false)
    assert.equal(areDeeplyEqual({ a: 1 }, {}), false)
  })

  it("returns false for objects and arrays", () => {
    assert.equal(areDeeplyEqual({ 0: 1, 1: 2 }, [1, 2]), false)
    assert.equal(areDeeplyEqual([1, 2], { 0: 1, 1: 2 }), false)
  })
  it("returns true for objects with different key order", () => {
    assert.equal(
      areDeeplyEqual(
        { a: 1, b: 2, c: { x: 3, y: [4, 5] } },
        { c: { y: [4, 5], x: 3 }, b: 2, a: 1 },
      ),
      true,
    )
  })

  it("returns false when one object misses a key", () => {
    assert.equal(areDeeplyEqual({ a: 1, b: 2 }, { a: 1 }), false)
  })

  it("returns false when nested value differs", () => {
    assert.equal(
      areDeeplyEqual({ a: { b: [1, 2, 3] } }, { a: { b: [1, 2, 4] } }),
      false,
    )
  })
})

describe("mergeBuffers", () => {
  it("merges multiple buffers preserving order", () => {
    const a = new Uint8Array([1, 2, 3])
    const b = new Uint8Array([4, 5])
    const c = new Uint8Array([6])
    assert.deepEqual(
      mergeBuffers([a, b, c]),
      new Uint8Array([1, 2, 3, 4, 5, 6]),
    )
  })

  it("returns empty buffer for empty input", () => {
    assert.equal(mergeBuffers([]).length, 0)
  })

  it("returns a copy for single buffer input", () => {
    const a = new Uint8Array([7, 8, 9])
    const merged = mergeBuffers([a])
    assert.deepEqual(merged, a)
    // Ensure not the same reference (should be a new merged view)
    assert.notEqual(merged, a)
  })

  it("handles larger buffers", () => {
    const len = 1024
    const a = new Uint8Array(len)
    const b = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      a[i] = i % 256
      b[i] = (255 - i) % 256
    }
    const merged = mergeBuffers([a, b])
    assert.equal(merged.length, len * 2)
    assert.deepEqual(merged.slice(0, len), a)
    assert.deepEqual(merged.slice(len), b)
  })
})

describe("ParsingError", () => {
  it("captures name, message, and charNumber", () => {
    const err = new ParsingError("Invalid token", 42)
    assert.ok(err instanceof Error)
    assert.equal(err.name, "ParsingError")
    assert.equal(err.message, "Invalid token")
    assert.equal(err.charNumber, 42)
  })
})
