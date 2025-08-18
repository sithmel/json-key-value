// @ts-check
import { Path } from "../lib/path.js"
import { Value, CachedSubObject } from "../lib/value.js"
import ObjectToSequence from "../ObjectToSequence.js"

/**
 * Build the list of new items to insert/tests. If `value` is a subobject, expand it using
 * ObjectToSequence and concatenate the base path; otherwise return the single pair.
 * @template {[Path, Value]} T
 * @param {Path} basePath
 * @param {Iterable<T>} iterable
 * @returns {Iterable<T>}
 */
function* concatenatePathToIterable(basePath, iterable) {
  for (const [subPath, subVal, ...rest] of iterable) {
    const fullPath = new Path([...basePath.array, ...subPath.array])
    yield /** @type {T} */ ([fullPath, subVal, ...rest])
  }
}

/**
 * Build the list of new items to insert/tests. If `value` is a subobject, expand it using
 * ObjectToSequence and concatenate the base path; otherwise return the single pair.
 * @template {[Path, Value]} T
 * @param {Path} basePath
 * @param {Value|Iterable<T>} value
 * @returns {Iterable<[Path, Value]>}
 */
export function * getSequenceFromValue(basePath, value) {
  // check if value is iterable
  if (!(value instanceof Value)) {
    yield* concatenatePathToIterable(basePath, value)
  } else if (value instanceof CachedSubObject) {
    const o2s = new ObjectToSequence()
    yield* concatenatePathToIterable(basePath, o2s.iter(value.decoded))
  } else {
    yield [basePath, value]
  }
}
