//@ts-check

/**
 * @typedef {import("./baseTypes").JSONValueType} JSONValueType
 * @typedef {import("./baseTypes").JSONPathType} JSONPathType
 */

import { isArrayOrObject } from "./utils.js"
import parser from "./pathExp/parser.js"
import { MatcherContainer } from "./pathExp/matcher.js"
import { Path } from "./pathExp/path.js"

/**
 * Convert a js value into a sequence of path/value pairs
 */
class ObjectToSequence {
  /**
   * Convert a js value into a sequence of path/value pairs
   * @param {Object} [options]
   * @param {number} [options.maxDepth=Infinity] - Max parsing depth
   * @param {string} [options.includes=null] - Expression using the includes syntax
   */
  constructor(options = {}) {
    const { maxDepth = Infinity } = options
    this.maxDepth = maxDepth

    const { includes = null } = options
    this.matcher = includes ? parser(includes) : new MatcherContainer()
  }

  /**
   * yields path/value pairs from a given object
   * @param {any} obj - Any JS value
   * @param {Path} [currentPath] - Only for internal use
   * @returns {Iterable<[JSONPathType, JSONValueType]>}
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
export default ObjectToSequence
