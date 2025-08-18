// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
import { getSequenceFromValue } from "./utils.js"

/**
 * test if a value is in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.6
 * Pass-through: yields the original sequence unchanged but asserts that the expected
 * path/value is present. If `value.decoded` is an object/array, expand it via ObjectToSequence
 * and assert that all concatenated sub path/values are present.
 * @template {[Path, Value, number?, number?]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @param {Path} path
 * @param {Value|Iterable<[Path, Value]>} value
 * @returns {AsyncIterable<Iterable<T>>}
 */
export default async function* test(asyncIterable, path, value) {
  /** @type {Array<[Path, Value]>} */
  const required = Array.from(getSequenceFromValue(path, value))
  
  const found = new Array(required.length).fill(false)
  let remaining = required.length

  /**
   * Scan a batch while yielding it unchanged.
   * @param {Iterable<T>} iterable
   * @returns {Iterable<T>}
   */
  function* scan(iterable) {
    for (const item of iterable) {
      if (remaining > 0) {
        for (let i = 0; i < required.length; i++) {
          if (found[i]) continue
          const [reqPath, reqVal] = required[i]
          // item: [Path, Value, ...]
          if (item[0].isEqual(reqPath) && item[1].isEqual(reqVal)) {
            found[i] = true
            remaining--
            if (remaining === 0) break
          }
        }
      }
      yield item
    }
  }

  for await (const batch of asyncIterable) {
    yield scan(batch)
  }

  if (remaining !== 0) {
    throw new Error("Test operation failed: expected path/value not found")
  }
}
