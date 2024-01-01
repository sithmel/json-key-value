//@ts-check

export class ParsingError extends Error {
  /**
   * @param {string} message
   * @param {number} charNumber
   */
  constructor(message, charNumber) {
    super(message)

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ParsingError)
    }

    this.name = "ParsingError"
    this.charNumber = charNumber
  }
}

/**
 * Check if there is a white space
 * @package
 * @param {string} c
 * @returns {boolean}
 */
export function isWhitespace(c) {
  return c === "\n" || c === " " || c === "\r" || c === "\t"
}

/**
 * Return true if value is an array or object
 * @package
 * @param {any} value
 * @returns {boolean}
 */
export function isArrayOrObject(value) {
  return value != null && typeof value === "object"
}

/**
 * Return oldPath and newPath excluding the common part
 * @package
 * @param {import("../types/baseTypes").JSONPathType} oldPath
 * @param {import("../types/baseTypes").JSONPathType} newPath
 * @returns {number}
 */
export function getCommonPathIndex(oldPath, newPath) {
  const length = Math.max(oldPath.length, newPath.length)
  for (let i = 0; i < length; i++) {
    if (oldPath[i] !== newPath[i]) {
      return i
    }
  }
  return length
}

/**
 * Check if oldPath is contained in the new path
 * @package
 * @param {import("../types/baseTypes").JSONPathType} oldPath
 * @param {import("../types/baseTypes").JSONPathType} newPath
 * @returns {boolean}
 */
export function isPreviousPathInNewPath(oldPath, newPath) {
  if (oldPath.length > newPath.length) return false
  const length = Math.min(oldPath.length, newPath.length)
  for (let i = 0; i < length; i++) {
    if (oldPath[i] !== newPath[i]) {
      return false
    }
  }
  return true
}

/**
 * Transform a value in JSON
 * @package
 * @param {import("../types/baseTypes").JSONValueType} value
 * @returns {string}
 */
export function valueToString(value) {
  if (isArrayOrObject(value)) {
    if (Array.isArray(value)) {
      return "["
    } else {
      return "{"
    }
  }
  return JSON.stringify(value)
}

/**
 * Yields item arrays from end back to index, yield true on last
 * @package
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function* fromEndToIndex(array, index) {
  for (let i = array.length - 1; i >= index; i--) {
    yield [i, array[i]]
  }
}

/**
 * Yields item arrays from index to end, yield true on first
 * @package
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function* fromIndexToEnd(array, index) {
  for (let i = index; i < array.length; i++) {
    yield [i, array[i]]
  }
}

/**
 * "}" or "]"
 * @package
 * @param {import("../types/baseTypes").JSONSegmentPathType} pathSegment
 * @returns {string}
 */
export function pathSegmentTerminator(pathSegment) {
  return typeof pathSegment === "string" ? "}" : "]"
}

/**
 * generate match
 * @param {import("../types/baseTypes").JSONSegmentPathType} match
 * @returns {import("../types/baseTypes").MatchKeyOrIndexType}
 */
export function match(match) {
  return { type: "match", match }
}

/**
 * generate slice
 * @param {number} sliceFrom
 * @param {number} sliceTo
 * @returns {import("../types/baseTypes").MatchSliceType}
 */
export function slice(sliceFrom = 0, sliceTo = Infinity) {
  return { type: "slice", sliceFrom, sliceTo }
}

const indexRE = /^[0-9]+$/
const sliceRE = /^([0-9]*):([0-9]*)$/
const unquotedStringRE = /^[a-zA-Z_]+[a-zA-Z_0-9]*$/

/**
 * Generate MatchSegmentType from a string
 * @package
 * @param {string} str
 * @param {number} index
 * @returns {import("../types/baseTypes").MatchSegmentType}
 */
export function strToMatchSegment(str, index = 0) {
  if (indexRE.test(str)) {
    return match(parseInt(str))
  }
  const sliceMatches = sliceRE.exec(str)
  if (sliceMatches) {
    const sliceFrom = sliceMatches[1] ? parseInt(sliceMatches[1], 10) : 0
    const sliceTo = sliceMatches[2] ? parseInt(sliceMatches[2], 10) : Infinity
    if (sliceFrom > sliceTo) {
      throw new ParsingError(`Invalid fragment : ${str}`, index)
    }
    return slice(sliceFrom, sliceTo)
  }
  if (unquotedStringRE.test(str)) {
    return match(str)
  }
  throw new ParsingError(`Invalid fragment : ${str}`, index)
}
