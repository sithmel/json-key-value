//@ts-check
import { isArrayOrObject } from "./utils.mjs"
export default class ObjectToSequence {
  /**
   * Convert a stream of characters (in chunks) to a sequence of path/value pairs
   * @param {{ maxDepth?: number }} options
   */
  constructor(options = {}) {
    const { maxDepth = Infinity } = options
    this.maxDepth = maxDepth
  }

  /**
   * parse a json or json fragment
   * @param {any} obj
   * @param {import("../types/baseTypes").JSONPathType} currentPath
   * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
   */
  *iter(obj, currentPath = []) {
    if (isArrayOrObject(obj) && currentPath.length < this.maxDepth) {
      let pathSegmentsAndValues
      if (Array.isArray(obj)) {
        yield [currentPath, []]
        pathSegmentsAndValues = obj.map((v, i) => [i, v])
      } else {
        yield [currentPath, {}]
        pathSegmentsAndValues = Object.entries(obj)
      }
      for (const [pathSegment, value] of pathSegmentsAndValues) {
        currentPath = [...currentPath, pathSegment]
        yield* this.iter(value, currentPath)
        currentPath = currentPath.slice(0, -1)
      }
    } else {
      yield [currentPath, obj]
    }
  }
}
