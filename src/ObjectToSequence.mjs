//@ts-check
import { isArrayOrObject } from "./utils.mjs"
import parser from "./pathExp/parser.mjs"
import { MatcherContainer } from "./pathExp/matcher.mjs"
import { Path } from "./pathExp/path.mjs"

export default class ObjectToSequence {
  /**
   * Convert a stream of characters (in chunks) to a sequence of path/value pairs
   * @param {{ maxDepth?: number, includes?: string }} options
   */
  constructor(options = {}) {
    const { maxDepth = Infinity } = options
    this.maxDepth = maxDepth

    const { includes = null } = options
    this.matcher = includes ? parser(includes) : new MatcherContainer()
  }

  /**
   * parse a json or json fragment
   * @param {any} obj
   * @param {Path} [currentPath]
   * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
   */
  *iter(obj, currentPath = new Path()) {
    if (this.matcher.isExhausted()) {
      return
    }
    if (isArrayOrObject(obj) && currentPath.length < this.maxDepth) {
      let pathSegmentsAndValues
      if (Array.isArray(obj)) {
        if (this.matcher.doesMatch(currentPath)) {
          yield [currentPath.toDecoded(), []]
        }
        pathSegmentsAndValues = obj.map((v, i) => [i, v])
      } else {
        if (this.matcher.doesMatch(currentPath)) {
          yield [currentPath.toDecoded(), {}]
        }
        pathSegmentsAndValues = Object.entries(obj)
      }
      for (const [pathSegment, value] of pathSegmentsAndValues) {
        currentPath.push(pathSegment)
        yield* this.iter(value, currentPath)
        currentPath.pop()
      }
    } else {
      if (this.matcher.doesMatch(currentPath)) {
        yield [currentPath.toDecoded(), obj]
      }
    }
  }
}
