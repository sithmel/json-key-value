//@ts-check
import { Path } from "./lib/path.js"
import { Value, CachedString } from "./lib/value.js"
/**
 * @private
 * @param {CachedString|number|null} pathSegment
 * @returns {{}|[]}
 */
function initObject(pathSegment) {
  if (pathSegment == null) {
    throw new Error("Path cannot be empty")
  }
  return typeof pathSegment === "number" && pathSegment >= 0 ? [] : {}
}

/**
 * Convert a sequence to a js object
 */
class SequenceToObject {
  /**
   * Convert a sequence to a js object
   * @param {any} [obj]
   * @param {boolean} [sparse=false] - if true, creates sparse arrays respecting original indexes
   */
  constructor(obj = undefined, sparse = false) {
    this.object = obj
    this.sparse = sparse
    this.previousPath = new Path()
  }

  /**
   * @private
   * @param {CachedString|number|null} pathSegment
   * @param {boolean} isPreviousCommonPathSegment
   * @param {any} currentObject
   * @returns {string|number}
   */
  _calculateRealIndex(pathSegment, isPreviousCommonPathSegment, currentObject) {
    if (pathSegment instanceof CachedString) {
      return pathSegment.decoded
    }

    if (Array.isArray(currentObject) && pathSegment != null) {
      if (this.sparse) {
        // In sparse mode, use the original index directly
        return pathSegment
      } else {
        // In compact mode, use length-based indexing
        if (isPreviousCommonPathSegment) {
          return currentObject.length - 1 // same element
        } else {
          return currentObject.length // new element
        }
      }
    }
    throw new Error("Invalid path segment")
  }

  /**
   * Returns the object built out of the sequence
   * It can be called multiple times and it will return the up to date object
   * @returns {any}
   */
  getObject() {
    return this.object
  }

  /**
   * Update the object with a new path value pairs
   * @param {Path} path - an array of path segments
   * @param {Value} value - the value corresponding to the path
   * @returns {this}
   */
  add(path, value) {
    if (path.length === 0) {
      this.object = value.decoded
      return this
    }
    if (this.object === undefined) {
      this.object = initObject(path.get(0))
    }

    const commonPathIndex = this.previousPath.getCommonPathIndex(path)
    let currentObject = this.object

    for (let i = 0; i < path.length - 1; i++) {
      const currentPathSegment = this._calculateRealIndex(
        path.get(i),
        i < commonPathIndex,
        currentObject,
      )
      const nextPathSegment = path.get(i + 1)
      if (currentObject[currentPathSegment] === undefined) {
        currentObject[currentPathSegment] = initObject(nextPathSegment)
      }
      currentObject = currentObject[currentPathSegment]
    }
    const currentPathSegment = this._calculateRealIndex(
      path.get(path.length - 1),
      path.length - 1 < commonPathIndex,
      currentObject,
    )
    currentObject[currentPathSegment] = value.decoded
    this.previousPath = path
    return this
  }
}
export default SequenceToObject
