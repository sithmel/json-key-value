//@ts-check
import { PathMatcher } from "./PathMatcher.mjs"

export default class BatchSequence {
  /**
   * Matches multiple patch expressions until they are exhausted
   * @param {Array<import("../types/baseTypes").MatchPathType>|string} matchersDataOrString
   */
  constructor(matchersDataOrString) {
    this.pathMatcher = new PathMatcher(matchersDataOrString)
  }
  /**
   * Update the object with a new path value pairs
   * @param {Iterable<[import("../types/baseTypes").JSONPathType,import("../types/baseTypes").JSONValueType]>} iterable
   * @returns {Iterable<[import("../types/baseTypes").JSONPathType,import("../types/baseTypes").JSONValueType]>}
   */
  *batch(iterable) {
    for (const [path, value] of iterable) {
    }
  }
}
