//@ts-check

/**
 * Implement JSON reviver feature as for specs of JSON.parse
 * @param {import("../types/baseTypes").JSONSegmentPathType} pathSegment
 * @returns {{}|[]}
 */
function initObject(pathSegment) {
  return typeof pathSegment === "number" && pathSegment >= 0 ? [] : {}
}
export default class ObjBuilder {
  constructor() {
    this.object = undefined
  }
  /**
   * Implement JSON reviver feature as for specs of JSON.parse
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
      const currentPathSegment = path[i]
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
    currentObject[path[path.length - 1]] = value
  }
}
