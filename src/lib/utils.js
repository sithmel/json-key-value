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
 *
 * @param {any} value1
 * @param {any} value2
 * @returns {boolean}
 */
export function areDeeplyEqual(value1, value2) {
  // works with strings, numbers, booleans, null, undefined
  // works also with array and objects, if they are the same
  if (value1 === value2) {
    return true
  }
  // if either values are null or undefined, they are not equal
  if (value1 == null || value2 == null) {
    return false
  }

  // at this point we only have Object and Array left.
  // they must be of the same type to be equal

  // both arrays
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return false

    return value1.every((elem, index) => {
      return areDeeplyEqual(elem, value2[index])
    })
  }
  if (Array.isArray(value1) || Array.isArray(value2)) {
    // value1 is an array, value2 is an object
    return false
  }
  if (isArrayOrObject(value1) && isArrayOrObject(value2)) {
    // both objects
    const keys1 = Object.keys(value1)
    // different number of keys
    if (keys1.length !== Object.keys(value2).length) return false

    for (let key in value1) {
      if (!(key in value2)) return false
      const isEqual = areDeeplyEqual(value1[key], value2[key])
      if (!isEqual) return false
    }

    return true
  }
  // neither is an array or object
  return false
}

/**
 * Return true if value is an array or object
 * @private
 * @param {any} value
 * @returns {boolean}
 */
export function isArrayOrObject(value) {
  return value != null && typeof value === "object"
}

const decoder = new TextDecoder("utf8", { fatal: true, ignoreBOM: true })
const encoder = new TextEncoder()
/**
 * @template T
 * @private
 * @param {Uint8Array} buffer
 * @returns {T}
 */
export function decodeAndParse(buffer) {
  return JSON.parse(decoder.decode(buffer))
}

/**
 * @private
 * @param {any} value
 * @returns {Uint8Array}
 */
export function stringifyAndEncode(value) {
  return encoder.encode(JSON.stringify(value))
}

/**
 * @private
 * @param {Array<Uint8Array>} buffers
 * @returns {Uint8Array}
 */
export function mergeBuffers(buffers) {
  const offsets = []
  let totalSize = 0
  for (const buffer of buffers) {
    offsets.push(totalSize)
    totalSize += buffer.length
  }
  const merged = new Uint8Array(totalSize)
  let i = 0
  for (const buffer of buffers) {
    merged.set(buffer, offsets[i])
    i++
  }
  return merged
}
