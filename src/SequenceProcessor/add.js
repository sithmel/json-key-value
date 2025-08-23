// @ts-check
import { assert } from "console"
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
import { getSequenceFromValue } from "./utils.js"

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
  const pathToAddLastSegment = searchPath.get(searchPath.length - 1)

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
      if (typeof pathToAddLastSegment !== 'number') {
        if (newCommonPathIndex === searchPath.length) {
          // ************** Case 1 - object key replacement
          // - yield the new sequence, the first time
          // - do not yield the original sequence
          if (insertStatus !== INSERT_STATUS.INSERTED) {
            yield * getSequenceFromValue(searchPath, value)
            insertStatus = INSERT_STATUS.INSERTED
          }
        } else if (newCommonPathIndex === searchPath.length - 1) {
          // ************** Case 2 - object key append
          // in this case, I have to insert the sequence as soon as searchPath stops matching
          insertStatus = INSERT_STATUS.INSERTED_WHEN_FINISHED
          yield item // yield the current item unchanged
        } else {
          if (newCommonPathIndex < commonPathIndex) {
            // If the new common path index is less than the previous one, we need to append
            if (insertStatus === INSERT_STATUS.INSERTED_WHEN_FINISHED) {
              yield * getSequenceFromValue(searchPath, value)
              insertStatus = INSERT_STATUS.INSERTED
            }
          }
          yield item // yield the current item unchanged
        }
      } else if (typeof pathToAddLastSegment === 'number') {
        if (newCommonPathIndex === searchPath.length || newCommonPathIndex === searchPath.length - 1) {
          insertStatus = INSERT_STATUS.INSERTED_WHEN_FINISHED
          // ************** Case 3 - array index insertion
          // searchPath ["a", "b", 2] - currentPath ["a", "b", 2, "d"]
          // or
          // searchPath ["a", "b", 2] - currentPath ["a", "b", 3, "c"]
          const currentPathLastSegment = currentPath.get(searchPath.length - 1)
          if (typeof currentPathLastSegment !== 'number') { // this should always be true
            throw new Error(`Path segment mismatch: expected array index at segment in path ${currentPath}, at index ${currentPath.length - 1}`)
          }
          if (currentPathLastSegment >= pathToAddLastSegment ) {
            if (insertStatus !== INSERT_STATUS.INSERTED) {
              yield * getSequenceFromValue(searchPath, value)
              insertStatus = INSERT_STATUS.INSERTED
            }
            // shift all other items
            currentPath.array[searchPath.length - 1] = currentPathLastSegment + 1
            yield item
          } else {
            yield item
          }
        } else {
          if (insertStatus === INSERT_STATUS.INSERTED_WHEN_FINISHED) {
            yield * getSequenceFromValue(searchPath, value)
            insertStatus = INSERT_STATUS.INSERTED
          }
          yield item // yield the current item unchanged
        }
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
    insertStatus = INSERT_STATUS.INSERTED
  }
  if (insertStatus !== INSERT_STATUS.INSERTED) {
    throw new Error("Add operation failed: expected path/value not inserted");
  }
}