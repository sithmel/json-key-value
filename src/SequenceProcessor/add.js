// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
import { getSequenceFromValue } from "./utils.js"

/**
 * @enum {number}
 */
const INSERT_TYPE = {
  OBJECT: 0,
  ARRAY: 1,
}

/**
 * @enum {number}
 */
const INSERT_STATUS = {
  WAIT: 0,
  INSERTED: 1,
  INSERTED_WHEN_FINISHED: 2,
}

/**
 * add a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.1
 * Inserts the provided [path, value] into the sequence according to preorder traversal
 * order (object keys lexicographically, array indices numerically).
 * Note: For multi-batch inputs, insertion is executed within the first batch where
 * the correct position is found; if not found, it appends to the end of that batch.
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @param {Path} searchPath
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
 */
export default async function* add(asyncIterable, searchPath, value) {
  let insertStatus = INSERT_STATUS.WAIT
  const insertType = typeof searchPath.get(searchPath.length - 1) === 'number' ?  INSERT_TYPE.ARRAY : INSERT_TYPE.OBJECT
  let arrayIndex = 0 // for array insertion, tracks the index where to insert

  let commonPathIndex = 0 // when this decreases, then we need to insert the new value
  /**
   * Filters a single iterable based on the matcher.
   * @param {Iterable<[Path, Value, number?, number?]>} iterable
   * @returns {Iterable<[Path, Value, number?, number?]>}
   */
  function* iter(iterable) {
    for (const item of iterable) {
      const [currentPath] = item
      const newCommonPathIndex = currentPath.getCommonPathIndex(searchPath)
      if (insertType === INSERT_TYPE.OBJECT) {
        if (newCommonPathIndex === searchPath.length) {
          // ************** Case 1
          // currentPath includes searchPath (newCommonPathIndex === searchPath.length)
          // if the last segment of searchPath is an object then I have to insert the object
          // and remove all current items with the searchPath path
          // so the first time I insert the sequence and remove the items. The other times, I remove the items
          if (insertStatus !== INSERT_STATUS.INSERTED) {
            yield * getSequenceFromValue(searchPath, value)
            insertStatus = INSERT_STATUS.INSERTED
          }
        } else if (newCommonPathIndex === searchPath.length - 1) {
          // ************** Case 2
          // searchPath matches currentPath except for the last segment and the last segment is a key
          // in this case, I have to insert the sequence as soon as searchPath stops matching
          insertStatus = INSERT_STATUS.INSERTED_WHEN_FINISHED
          yield item // yield the current item unchanged
        } else {
          if (newCommonPathIndex < commonPathIndex) {
            // If the new common path index is less than the previous one, we need to insert
            if (insertStatus === INSERT_STATUS.INSERTED_WHEN_FINISHED) {
              yield * getSequenceFromValue(searchPath, value)
              insertStatus = INSERT_STATUS.INSERTED
            }
          }
          yield item // yield the current item unchanged
        }
      } else if (insertType === INSERT_TYPE.ARRAY) {
        if (newCommonPathIndex === searchPath.length - 1) {
          // ************** Case 3
          // searchPath matches currentPath except for the last segment and the last segment is an index
          // I count the items that are showing up and I add the sequence at the right moment or I add it when it stops matching
          insertStatus = INSERT_STATUS.INSERTED_WHEN_FINISHED

          const insertIndex = searchPath.get(searchPath.length - 1)
          if (insertIndex === arrayIndex) {
            if (insertStatus === INSERT_STATUS.INSERTED_WHEN_FINISHED) {
              yield * getSequenceFromValue(searchPath, value)
              insertStatus = INSERT_STATUS.INSERTED
            }
            arrayIndex++
          }
        } else {
          if (insertStatus === INSERT_STATUS.INSERTED_WHEN_FINISHED) {
            yield * getSequenceFromValue(searchPath, value)
            insertStatus = INSERT_STATUS.INSERTED
          }
        }
        yield item // yield the current item unchanged
      }
      commonPathIndex = newCommonPathIndex
    }
  }

  for await (const iterable of asyncIterable) {
    yield iter(iterable)
  }
  if (insertStatus === INSERT_STATUS.INSERTED_WHEN_FINISHED) {
    // If not inserted, append at the end of the last batch
    yield getSequenceFromValue(searchPath, value)
  }
}