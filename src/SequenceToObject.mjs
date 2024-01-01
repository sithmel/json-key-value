//@ts-check

/**
 * Implement JSON reviver feature as for specs of JSON.parse
 * @package
 * @param {import("../types/baseTypes").JSONSegmentPathType} pathSegment
 * @returns {{}|[]}
 */
function initObject(pathSegment) {
  return typeof pathSegment === "number" && pathSegment >= 0 ? [] : {}
}
export default class SequenceToObject {
  /**
   * Convert a sequence to a js object
   * @param {{compactArrays?: boolean}} options
   */
  constructor(options = {}) {
    const { compactArrays } = options
    this.object = undefined
    this.compactArrays = compactArrays ?? false

    this.lastArray = undefined
    this.lastArrayIndex = undefined
  }

  /**
   * @package
   * @param {import("../types/baseTypes").JSONSegmentPathType} pathSegment
   * @param {import("../types/baseTypes").JSONValueType} currentObject
   * @returns {import("../types/baseTypes").JSONSegmentPathType}
   */
  _calculateRealIndex(pathSegment, currentObject) {
    if (typeof pathSegment === "string" || !this.compactArrays) {
      return pathSegment
    }
    if (Array.isArray(currentObject)) {
      // copy values locally
      const lastArray = this.lastArray
      const lastArrayIndex = this.lastArrayIndex
      // update with new values
      this.lastArray = currentObject
      this.lastArrayIndex = pathSegment
      if (currentObject === lastArray && lastArrayIndex === pathSegment) {
        return currentObject.length - 1
      }
      return currentObject.length
    }
    return 0
  }

  /**
   * Update the object with a new path value pairs
   * @param {import("../types/baseTypes").JSONPathType} path
   * @param {import("../types/baseTypes").JSONValueType} value
   * @returns {void}
   */
  add(path, value) {
    if (path.length === 0) {
      this.object = value
      return
    }
    if (this.object === undefined) {
      this.object = initObject(path[0])
    }
    let currentObject = this.object
    for (let i = 0; i < path.length - 1; i++) {
      // ignoring type errors here:
      // if path is inconsistent with data, it should throw an exception
      const currentPathSegment = this._calculateRealIndex(
        path[i],
        currentObject,
      )
      const nextPathSegment = path[i + 1]
      // @ts-ignore
      if (currentObject[currentPathSegment] === undefined) {
        // @ts-ignore
        currentObject[currentPathSegment] = initObject(nextPathSegment)
      }
      // @ts-ignore
      currentObject = currentObject[currentPathSegment]
    }
    // @ts-ignore
    const currentPathSegment = this._calculateRealIndex(
      path[path.length - 1],
      currentObject,
    )
    // @ts-ignore
    currentObject[currentPathSegment] = value
  }
}
