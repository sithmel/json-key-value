//@ts-check
import assert from "assert"
import { describe, it } from "node:test"

import testOp from "../src/SequenceProcessor/test.js"
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

describe("SequenceProcessor test op", () => {
  it("passes when the path/value exists in the sequence", async () => {
    const p1 = toPathObject(["a"]) ; const v1 = toValueObject(1)
    const p2 = toPathObject(["b"]) ; const v2 = toValueObject(2)

    /** @type {Array<[Path, Value]>} */
    const seq = [[p1, v1], [p2, v2]]

    const result = await collect(
      testOp(singleBatch(seq), toPathObject(["b"]), toValueObject(2))
    )

    // Ensure passthrough behavior (shape preserved) and no throw
    const decoded = result[0].map(([path, value]) => [path.decoded, value.decoded])
    assert.deepEqual(decoded, [[["a"], 1], [["b"], 2]])
  })

  it("throws when the path/value does not exist in the sequence", async () => {
    const p1 = toPathObject(["a"]) ; const v1 = toValueObject(1)
    const p2 = toPathObject(["b"]) ; const v2 = toValueObject(2)

    /** @type {Array<[Path, Value]>} */
    const seq = [[p1, v1], [p2, v2]]

    await assert.rejects(
      () => collect(testOp(singleBatch(seq), toPathObject(["c"]), toValueObject(3)))
    )
  })
})
