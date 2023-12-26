//@ts-check
import toPathExp from "./toPathExp.mjs"
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
   * @param {import("../types/baseTypes").MatchPathType} match
   */
  constructor(match) {
    this.match = match
    // how many levels of the matcher are exhausted
    this.levelExhausted = new Array(match.length)
    this.isExhausted = false
    this.doesMatch = false
  }

  /**
   * @param {number} level
   */
  _setIsExhausted(level) {
    this.isExhausted = !!this.levelExhausted[level]
    this.doesMatch = false
  }
  /**
   * @param {number} level
   */
  _setLevelExhausted(level) {
    // I can set a level as exhausted if the previous one is not
    if (level === 0 || this.levelExhausted[level - 1]) {
      this.levelExhausted[level] = true
    }
  }
  /**
   * @param {import("../types/baseTypes").JSONPathType} path
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

/**
 * include/exclude a sequence
 * @param {boolean} includeOnMatch
 * @param {Array<import("../types/baseTypes").MatchPathType>} matchersData
 * @param {Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @returns {Iterable<import("../types/baseTypes").JSONPathValueType>}
 */
function* includeOrExcludeByPath(includeOnMatch, matchersData, iterable) {
  const matchers = matchersData.map((m) => new Matcher(m))
  const filterExhausted = new Set()
  for (const [path, value] of iterable) {
    if (filterExhausted.size === matchers.length) {
      if (includeOnMatch) {
        break // nothing else to match
      } else {
        yield [path, value]
        continue
      }
    }
    let including = !includeOnMatch
    for (const matcher of matchers) {
      if (filterExhausted.has(matcher)) {
        continue
      }
      matcher.nextMatch(path)
      // once included or excluded we stick to that
      if (including === !includeOnMatch) {
        including = matcher.doesMatch ? includeOnMatch : !includeOnMatch
      }
      if (matcher.isExhausted) {
        filterExhausted.add(matcher)
      }
    }
    if (including) {
      yield [path, value]
    }
  }
}

/**
 * include a sequence item
 * @param {Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @param {Array<import("../types/baseTypes").MatchPathType>} matchers
 * @returns {Iterable<import("../types/baseTypes").JSONPathValueType>}
 */
export function includeByPath(iterable, matchers) {
  return includeOrExcludeByPath(true, matchers, iterable)
}

/**
 * exclude a sequence item
 * @param {Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @param {Array<import("../types/baseTypes").MatchPathType>} matchers
 * @returns {Iterable<import("../types/baseTypes").JSONPathValueType>}
 */
export function excludeByPath(iterable, matchers) {
  return includeOrExcludeByPath(false, matchers, iterable)
}

/**
 * filter a sequence
 * @param {Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @param {Array<import("../types/baseTypes").MatchPathType>|string|null} include
 * @param {Array<import("../types/baseTypes").MatchPathType>|string|null} exclude
 * @returns {Iterable<import("../types/baseTypes").JSONPathValueType>}
 */
export function filterByPath(iterable, include = null, exclude = null) {
  let iter = iterable
  const includeMatcher = toPathExp(include)
  const excludeMatcher = toPathExp(exclude)
  if (include != null) {
    iter = includeByPath(iter, includeMatcher)
  }
  if (exclude != null) {
    iter = excludeByPath(iter, excludeMatcher)
  }
  return iter
}
