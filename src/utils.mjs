//@ts-check

/**
 * Return true if value is an array or object
 * @param {any} value
 * @returns {boolean}
 */
export function isArrayOrObject(value) {
  return value != null && typeof value === "object"
}

/**
 * Return oldPath and newPath excluding the common part
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
 * Transform a value in JSON
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
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[T, boolean]>}
 */
export function* fromEndToIndex(array, index) {
  for (let i = array.length - 1; i >= index; i--) {
    yield [array[i], i === index]
  }
}

/**
 * Yields item arrays from index to end, yield true on first
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[T, boolean]>}
 */
export function* fromIndexToEnd(array, index) {
  for (let i = index; i < array.length; i++) {
    yield [array[i], i === index]
  }
}

/**
 * "}" or "]"
 * @param {import("../types/baseTypes").JSONSegmentPathType} pathSegment
 * @returns {string}
 */
export function pathSegmentTerminator(pathSegment) {
  return typeof pathSegment === "string" ? "}" : "]"
}
