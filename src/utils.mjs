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
 * Return true if value is an array or object
 * @param {Array<any>} arr
 * @returns {Iterable<any>}
 */
export function* reversed(arr) {
  for (let i = arr.length - 1; i >= 0; i--) {
    yield arr[i]
  }
}
