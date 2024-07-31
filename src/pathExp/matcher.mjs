//@ts-check

/**
 * create spaces for indentation
 * @param {number} level
 * @return string
 */
function spaces(level) {
  return Array(level + 1).join("  ")
}
export class MatcherContainer {
  /**
   * This class is used as generic container of matchers
   * @param {Array<BaseMatcher>} [matchers]
   */
  constructor(matchers) {
    this.matchers = matchers ?? []
  }
  /**
   * Check for match
   * @param {import("../../types/baseTypes.js").JSONPathType} path
   * @return {boolean}
   */
  doesMatch(path) {
    if (this.matchers.length == 0) {
      return true
    }
    for (const matcher of this.matchers) {
      if (matcher.doesMatch(path, true)) {
        return true
      }
    }
    return false
  }
  /**
   * Check if matchers are exhausted
   * @return {boolean}
   */
  isExhausted() {
    if (this.matchers.length === 0) {
      return false
    }
    return this.matchers.every((m) => m.isExhausted())
  }

  /**
   * print as a string
   * @param {boolean} [pretty]
   * @return {string}
   */
  stringify(pretty = false) {
    return this.matchers
      .map((m) => m.stringify(pretty, 0))
      .join(pretty ? "\n" : " ")
  }
}

class BaseMatcher {
  /**
   * This class is used as:
   * - generic container of matchers
   * - base class for all matchers
   * - match *
   * @param {Array<BaseMatcher>} [matchers]
   */
  constructor(matchers) {
    this.matchers = matchers ?? []
    this._isExhausted = false
    this._isLastPossibleMatch = true
  }

  /**
   * Check if this specific segment matches, without checking the children
   * @param {import("../../types/baseTypes.js").JSONSegmentPathType} _segment
   * @param {boolean} _parentLastPossibleMatch
   * @return {boolean}
   */
  doesSegmentMatch(_segment, _parentLastPossibleMatch) {
    return false
  }

  /**
   * Check for match
   * @param {import("../../types/baseTypes.js").JSONPathType} path
   * @param {boolean} [parentLastPossibleMatch]
   * @return {boolean}
   */
  doesMatch(path, parentLastPossibleMatch = true) {
    if (
      path.length === 0 ||
      this.isExhausted() ||
      !this.doesSegmentMatch(path[0], parentLastPossibleMatch)
    ) {
      return false
    }
    if (this.matchers.length == 0) {
      return true
    }
    const newPath = path.slice(1)
    for (const matcher of this.matchers) {
      if (matcher.doesMatch(newPath, this._isLastPossibleMatch)) {
        return true
      }
    }
    return false
  }
  /**
   * Check if matcher is exhausted (or children)
   * @return {boolean}
   */
  isExhausted() {
    if (this._isExhausted) {
      return true
    }
    if (this.matchers.length === 0) {
      return false
    }
    return this.matchers.every((m) => m.isExhausted())
  }

  /**
   * print as a string
   * @param {boolean} [pretty]
   * @param {number} [level]
   * @return {string}
   */
  stringify(pretty = false, level = 0) {
    if (this.matchers.length === 0) return ""
    return `{${pretty ? "\n" + spaces(level - 1) : ""}${this.matchers
      .map((m) => m.stringify(pretty, level + 1))
      .join(pretty ? "\n" + spaces(level - 1) : " ")}${
      pretty ? "\n" + spaces(level - 2) : ""
    }}`
  }
}

export class AnyMatcher extends BaseMatcher {
  /**
   * Check if this specific segment matches, without checking the children
   * @param {import("../../types/baseTypes.js").JSONSegmentPathType} _segment
   * @param {boolean} _parentLastPossibleMatch
   * @return {boolean}
   */
  doesSegmentMatch(_segment, _parentLastPossibleMatch) {
    this._isLastPossibleMatch = false
    return true
  }
  /**
   * print as a string
   * @param {boolean} [pretty]
   * @param {number} [level]
   * @return {string}
   */
  stringify(pretty = false, level = 0) {
    return `*${super.stringify(pretty, level + 1)}`
  }
}

export class SegmentMatcher extends BaseMatcher {
  /**
   * direct match of a number of a string
   * @param {Array<BaseMatcher>} [matchers]
   * @param {import("../../types/baseTypes.js").JSONSegmentPathType} segmentMatch
   */
  constructor(segmentMatch, matchers) {
    super(matchers)
    this.hasMatchedForLastTime = false
    this._isLastPossibleMatch = true
    this.segmentMatch = segmentMatch
  }
  /**
   * Check if this specific segment matches, without checking the children
   * @param {import("../../types/baseTypes.js").JSONSegmentPathType} segment
   * @param {boolean} parentLastPossibleMatch
   * @return {boolean}
   */
  doesSegmentMatch(segment, parentLastPossibleMatch) {
    this._isLastPossibleMatch = parentLastPossibleMatch

    const doesMatch = segment === this.segmentMatch

    if (!doesMatch && this.hasMatchedForLastTime) {
      this._isExhausted = true
    }
    if (this._isLastPossibleMatch) {
      this.hasMatchedForLastTime = doesMatch
    }
    return doesMatch
  }
  /**
   * print as a string
   * @param {boolean} [pretty]
   * @param {number} [level]
   * @return {string}
   */
  stringify(pretty = false, level = 0) {
    let segmentStr
    if (typeof this.segmentMatch === "string") {
      if (this.segmentMatch.includes('"')) {
        segmentStr = `'${this.segmentMatch}'`
      } else {
        segmentStr = `"${this.segmentMatch}"`
      }
    } else {
      segmentStr = this.segmentMatch.toString()
    }
    return `${segmentStr}${super.stringify(pretty, level + 1)}`
  }
}

export class SliceMatcher extends BaseMatcher {
  /**
   * Check for a slice (numbers only)
   * @param {{min: number, max: number}} options
   * @param {Array<BaseMatcher>} [matchers]
   */
  constructor(options, matchers) {
    super(matchers)
    this.hasMatchedForLastTime = false
    this.min = options.min ?? 0
    this.max = options.max ?? Infinity
  }
  /**
   * Check if this specific segment matches, without checking the children
   * @param {import("../../types/baseTypes.js").JSONSegmentPathType} segment
   * @param {boolean} parentLastPossibleMatch
   * @return {boolean}
   */
  doesSegmentMatch(segment, parentLastPossibleMatch) {
    if (typeof segment !== "number") {
      return false
    }
    this._isLastPossibleMatch =
      parentLastPossibleMatch && segment === this.max - 1

    const doesMatch = segment >= this.min && segment < this.max
    if (!doesMatch && this.hasMatchedForLastTime) {
      this._isExhausted = true
    }
    if (this._isLastPossibleMatch) {
      this.hasMatchedForLastTime = doesMatch
    }
    return doesMatch
  }
  /**
   * print as a string
   * @param {boolean} [pretty]
   * @param {number} [level]
   * @return {string}
   */
  stringify(pretty = false, level = 0) {
    const min = this.min === 0 ? "" : this.min.toString()
    const max = this.max === Infinity ? "" : this.max.toString()
    return `${min}..${max}${super.stringify(pretty, level + 1)}`
  }
}
