//@ts-check
/**
 * @typedef {import("./baseTypes").JSONValueType} JSONValueType
 * @typedef {import("./baseTypes").JSONPathType} JSONPathType
 * @typedef {import("./baseTypes").JSONSegmentPathType} JSONSegmentPathType
 */

/**
 * @private
 */
export class ParsingError extends Error {
  /**
   * @package
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
 * @private
 * @param {string} c
 * @returns {boolean}
 */
export function isWhitespace(c) {
  return c === "\n" || c === " " || c === "\r" || c === "\t"
}

/**
 * Return true if value is an array or object
 * @package
 * @private
 * @param {any} value
 * @returns {boolean}
 */
export function isArrayOrObject(value) {
  return value != null && typeof value === "object"
}

/**
 * Return oldPath and newPath excluding the common part
 * @package
 * @private
 * @param {JSONPathType} oldPath
 * @param {JSONPathType} newPath
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
 * @private
 * @param {JSONPathType} oldPath
 * @param {JSONPathType} newPath
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
 * @private
 * @param {JSONValueType} value
 * @returns {string}
 */
export function valueToString(value) {
  if (isArrayOrObject(value)) {
    if (value !== null && Object.keys(value).length !== 0) {
      return JSON.stringify(value)
    }
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
 * @private
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
 * @private
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
 * @private
 * @param {JSONSegmentPathType} pathSegment
 * @returns {string}
 */
export function pathSegmentTerminator(pathSegment) {
  return typeof pathSegment === "string" ? "}" : "]"
}

const decoder = new TextDecoder("utf8", { fatal: true, ignoreBOM: true })
/**
 * @package
 * @private
 * @param {Uint8Array} buffer
 * @returns {any}
 */
export function decodeAndParse(buffer) {
  return JSON.parse(decoder.decode(buffer))
}

const encoder = new TextEncoder()
/**
 * @package
 * @private
 * @param {any} value
 * @returns {Uint8Array}
 */
export function stringifyAndEncode(value) {
  return encoder.encode(JSON.stringify(value))
}
