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
  let hasBeenRemoved = false
  const pathToRemoveLastSegment = pathToRemove.get(pathToRemove.length - 1)

  /**
   * @param {Iterable<T>} iterable
   * @returns {Iterable<T>}
   */
  function* inner(iterable) {
    for (const iter of iterable) {
      const path = iter[0]
      if (typeof pathToRemoveLastSegment === 'number') {
        if (pathToRemove.getCommonPathIndex(path) === pathToRemove.length) {
          hasBeenRemoved = true
          continue // do not return the item
        } else if (pathToRemove.getCommonPathIndex(path) === pathToRemove.length - 1) {
          const currentLastSegment = path.get(pathToRemove.length - 1)
          if (typeof currentLastSegment !== 'number') {
            throw new Error(`Path segment mismatch: expected array index at segment in path ${path}, at index ${pathToRemove.length - 1}`)            
          }
          if (currentLastSegment < pathToRemoveLastSegment) {
            yield iter
          } else { // (currentLastSegment > pathToRemoveLastSegment)
            path.array[pathToRemove.length - 1] = currentLastSegment - 1
            yield iter
          }
        }
        yield iter
      } else {
        if (pathToRemove.getCommonPathIndex(path) !== pathToRemove.length) {
          yield iter
        } else {
          hasBeenRemoved = true
        }
      }
    }
  }

  for await (const batch of asyncIterable) {
    yield inner(batch)
  }
  if (!hasBeenRemoved) {
    throw new Error(`The path ${pathToRemove} was not found. Removal not possible`)
  }
}
