//@ts-check
import { stringToPathExp } from "./pathExp.mjs"
export class Matcher {
  /**
   * Performs matches and checks if the matcher will no longer
   * be matching any subsequent path (is exhausted)
   * It works like that:
   * Let's assume out matcher data is A[4:7]C:
   * B2C : Not matching, we must keep searching until encountering the segment A
   * A1  : Not matching, we can set the levelExhausted to [true] because we found A as a first match
   *       This means that if we no longer match A we can consider the search over
   * A4C : Matching! levelExhausted is still [true] because we can have a bigger number
   *       in second position (up until 6)
   * A7A : Not matching: we immediately set levelExhausted to [true, true] as we can't have
   *       a bigger number than 6 in position 2
   * True values in levelExhausted needs to be adjacent starting with the first.
   * If a segment doesn't match and the corresponding boolean in levelExhausted is true
   * then we consider the match to be exhausted (no further matches are possible)
   * @param {import("../../types/baseTypes.js").MatchPathType} match
   */
  constructor(match) {
    this.match = match
    // how many levels of the matcher are exhausted
    this.levelExhausted = new Array(match.length)
    this.isExhausted = false
    this.doesMatch = false
  }

  /**
   * @package
   * @param {number} level
   */
  _setIsExhausted(level) {
    this.isExhausted = !!this.levelExhausted[level]
    this.doesMatch = false
  }
  /**
   * @package
   * @param {number} level
   */
  _setLevelExhausted(level) {
    // I can set a level as exhausted if the previous one is not
    if (level === 0 || this.levelExhausted[level - 1]) {
      this.levelExhausted[level] = true
    }
  }
  /**
   * Check for match
   * @param {import("../../types/baseTypes.js").JSONPathType} path
   */
  nextMatch(path) {
    for (let i = 0; i < this.match.length; i++) {
      const filterMatchOrSlice = this.match[i]
      const pathSegment = path[i]
      if (filterMatchOrSlice.type === "match") {
        if (filterMatchOrSlice.match === pathSegment) {
          this._setLevelExhausted(i)
          continue
        } else {
          this._setIsExhausted(i)
          return
        }
      } else if (
        filterMatchOrSlice.type === "slice" &&
        typeof pathSegment === "number"
      ) {
        if (pathSegment >= filterMatchOrSlice.sliceTo) {
          this._setLevelExhausted(i)
        }
        if (
          pathSegment >= filterMatchOrSlice.sliceFrom &&
          pathSegment < filterMatchOrSlice.sliceTo
        ) {
          continue
        } else {
          this._setIsExhausted(i)
          return
        }
      }
    }
    this.doesMatch = true
  }
}
export class PathMatcher {
  /**
   * Matches multiple patch expressions until they are exhausted
   * @param {Array<import("../../types/baseTypes.js").MatchPathType>|string} matchersDataOrString
   */
  constructor(matchersDataOrString) {
    const matchersData = stringToPathExp(matchersDataOrString)
    /** @type Array<Matcher> */
    this.matchers = matchersData.map((m) => new Matcher(m))
    this.filterExhausted = new Set()
    this.isExhausted = false
    this.doesMatch = false
  }

  /**
   * Check if a path is matching with any path expressions.
   * It updates the attributes "doesMatch" and "IsExhausted"
   * @param {import("../../types/baseTypes.js").JSONPathType} path
   */
  nextMatch(path) {
    if (this.isExhausted) return
    let doesMatch = false
    for (const matcher of this.matchers) {
      if (this.filterExhausted.has(matcher)) {
        continue
      }
      matcher.nextMatch(path)
      // once matched we stick to that
      if (!doesMatch) {
        doesMatch = matcher.doesMatch
      }
      if (matcher.isExhausted) {
        this.filterExhausted.add(matcher)
        if (this.matchers.length === this.filterExhausted.size) {
          this.isExhausted = true
          break
        }
      }
    }
    this.doesMatch = doesMatch
  }

  /**
   * Shorthand to filter an iterable of path/value pairs
   * @param {Array<import("../../types/baseTypes.js").JSONPathValueType>} iterable
   */
  *filterSequence(iterable) {
    for (const [path, value] of iterable) {
      this.nextMatch(path)
      if (this.doesMatch) {
        yield [path, value]
      }
      if (this.isExhausted) {
        break
      }
    }
  }
}
