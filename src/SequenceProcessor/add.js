// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
import { getSequenceFromValue } from "./utils.js"

/**
 * add a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.1
 * Inserts the provided [path, value] into the sequence according to preorder traversal
 * order (object keys lexicographically, array indices numerically).
 * Note: For multi-batch inputs, insertion is executed within the first batch where
 * the correct position is found; if not found, it appends to the end of that batch.
 * @param {AsyncIterable<Iterable<[Path, Value] | [Path, Value, number, number]>>} asyncIterable
 * @param {Path} path
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<[Path, Value] | [Path, Value, number, number]>>}
 */
export default async function* add(asyncIterable, path, value) {
  let inserted = false
  let commonPathIndex = 0 // when this decreases, then we need to insert the new value
  /**
   * Filters a single iterable based on the matcher.
   * @param {Iterable<[Path, Value] | [Path, Value, number, number]>} iterable
   * @returns {Iterable<[Path, Value] | [Path, Value, number, number]>}
   */
  function* iter(iterable) {
    for (const item of iterable) {
      if (inserted) {
        yield item
      } else {
        const [currentPath, ...rest] = item
        const newCommonPathIndex = currentPath.getCommonPathIndex(path)
        if (newCommonPathIndex < commonPathIndex) {
          // Insert before current item
          yield * getSequenceFromValue(path, value)
          inserted = true
        }
        commonPathIndex = newCommonPathIndex
        yield item
      }
    }
  }
  for await (const iterable of asyncIterable) {
    if (inserted) {
      yield iterable
    } else {
      yield iter(iterable)
    }
  }
  if (!inserted) {
    // If not inserted, append at the end of the last batch
    yield getSequenceFromValue(path, value)
  }
}