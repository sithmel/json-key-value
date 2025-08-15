// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"

/**
 * Compare two path segments for ordering in traversal:
 * - numbers by numeric order
 * - strings (CachedString) by decoded lexicographic order
 * - if types differ, numbers sort before strings (deterministic fallback)
 * @param {number | { decoded: string }} a
 * @param {number | { decoded: string }} b
 * @returns {number}
 */
function compareSegments(a, b) {
  const aIsNum = typeof a === "number"
  const bIsNum = typeof b === "number"
  if (aIsNum && bIsNum) return /** @type {number} */ (a) - /** @type {number} */ (b)
  if (aIsNum !== bIsNum) return aIsNum ? -1 : 1
  const as = /** @type {{ decoded: string }} */ (a).decoded
  const bs = /** @type {{ decoded: string }} */ (b).decoded
  if (as === bs) return 0
  return as < bs ? -1 : 1
}

/**
 * Lexicographic path comparison consistent with JSON preorder traversal,
 * comparing segment-by-segment using compareSegments; if all equal up to min length,
 * shorter path sorts before longer path.
 * @param {Path} p1
 * @param {Path} p2
 * @returns {number}
 */
function comparePaths(p1, p2) {
  const len = Math.min(p1.length, p2.length)
  for (let i = 0; i < len; i++) {
    const s1 = p1.get(i)
    const s2 = p2.get(i)
    if (s1 == null || s2 == null) continue
    const cmp = compareSegments(/** @type {any} */ (s1), /** @type {any} */ (s2))
    if (cmp !== 0) return cmp
  }
  return p1.length - p2.length
}

/**
 * add a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.1
 * Inserts the provided [path, value] into the sequence according to preorder traversal
 * order (object keys lexicographically, array indices numerically).
 * Note: For multi-batch inputs, insertion is executed within the first batch where
 * the correct position is found; if not found, it appends to the end of that batch.
 * @template {[Path, Value] | [Path, Value, number, number]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @param {Path} path
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<T>>}
 */
export default async function* add(asyncIterable, path, value) {
  let inserted = false

  /**
   * Merge a batch, inserting the new item before the first element greater than it.
   * If not inserted within the loop, append at the end of this batch.
   * @param {Iterable<T>} iterable
   * @returns {Iterable<T>}
   */
  function* merge(iterable) {
    for (const item of iterable) {
      if (!inserted && comparePaths(path, /** @type {any} */ (item[0])) < 0) {
        // Insert before current item
        yield (/** @type {T} */ (/** @type {unknown} */ ([path, value])))
        inserted = true
      }
      yield item
    }
    if (!inserted) {
      // Append at end of this batch
      yield (/** @type {T} */ (/** @type {unknown} */ ([path, value])))
      inserted = true
    }
  }

  for await (const batch of asyncIterable) {
    yield merge(batch)
    if (inserted) {
      // After insertion, just passthrough remaining batches (if any)
      for await (const restBatch of asyncIterable) {
        yield restBatch
      }
      return
    }
  }
}
