//@ts-check
import { isArrayOrObject } from "./utils.mjs"
export default class ObjectToSequence {
  /**
   * parse a json or json fragment
   * @param {any} obj
   * @param {import("../types/baseTypes").JSONPathType} currentPath
   * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
   */
  *iter(obj, currentPath = []) {
    if (isArrayOrObject(obj)) {
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
