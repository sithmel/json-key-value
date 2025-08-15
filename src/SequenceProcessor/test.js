// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"

/**
 * test if a value is in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.6
 * Pass-through: yields the original sequence unchanged but asserts that at least one
 * item matches both path and value. If not found, it throws after the stream ends.
 * @template {[Path, Value] | [Path, Value, number, number]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @param {Path} path
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<T>>}
 */
export default async function* test(asyncIterable, path, value) {
  let found = false

  /**
   * Scan a batch while yielding it unchanged.
   * @param {Iterable<T>} iterable
   * @returns {Iterable<T>}
   */
  function* scan(iterable) {
    for (const item of iterable) {
      // item: [Path, Value, ...]
      if (!found && item[0].isEqual(path) && item[1].isEqual(value)) {
        found = true
      }
      yield item
    }
  }

  for await (const batch of asyncIterable) {
    yield scan(batch)
  }

  if (!found) {
    throw new Error("Test operation failed: expected path/value not found")
  }
}
