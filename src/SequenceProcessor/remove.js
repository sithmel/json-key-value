// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"

/**
 * remove a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.2
 * @template {[Path, Value, number?, number?]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @param {Path} pathToRemove
 * @returns {AsyncIterable<Iterable<T>>}
 */
export default async function* remove(asyncIterable, pathToRemove) {
  /**
   * @param {Iterable<T>} iterable
   * @returns {Iterable<T>}
   */
  function* inner(iterable) {
    for (const iter of iterable) {
      if (pathToRemove.getCommonPathIndex(iter[0]) !== pathToRemove.length) {
        yield iter
      }
    }
  }

  for await (const batch of asyncIterable) {
    yield inner(batch)
  }
}
