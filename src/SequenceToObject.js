//@ts-check

/**
 * @typedef {module:baseTypes.JSONSegmentPathType} JSONSegmentPathType
 * @typedef {import("./baseTypes").JSONValueType} JSONValueType
 * @typedef {import("./baseTypes").JSONPathType} JSONPathType
 */

/**
 * @package
 * @private
 * @param {JSONSegmentPathType} pathSegment
 * @returns {{}|[]}
 */
function initObject(pathSegment) {
  return typeof pathSegment === "number" && pathSegment >= 0 ? [] : {}
}

/**
 * Convert a sequence to a js object
 */
class SequenceToObject {
  /**
   * Convert a sequence to a js object
   * @param {Object} options
   * @param {boolean} [options.compactArrays=false] - if true ignore array index and generates arrays without gaps
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
   * @private
   * @param {JSONSegmentPathType} pathSegment
   * @param {JSONValueType} currentObject
   * @returns {JSONSegmentPathType}
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
   * Returns the object built out of the sequence
   * It can be called multiple times and it will return the up to date object
   * @returns {any}
   */
  getObject() {
    return this.object
  }

  /**
   * Update the object with a new path value pairs
   * @param {JSONPathType} path - an array of path segments
   * @param {JSONValueType} value - the value corresponding to the path
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
export default SequenceToObject
