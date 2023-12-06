//@ts-check
import { isArrayOrObject } from "./utils.mjs"
export default class ObjParser {
  /**
   * parse a json or json fragment
   * @param {Object} obj
   * @param {import("../types/baseTypes").JSONPathType} currentPath
   * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
   */
  *parse(obj, currentPath = []) {
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
        currentPath.push(pathSegment)
        yield* this.parse(value, currentPath)
        currentPath.pop()
      }
    } else {
      yield [currentPath, obj]
    }
  }
}
