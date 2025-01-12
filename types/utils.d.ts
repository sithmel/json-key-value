/**
 * Check if there is a white space
 * @private
 * @param {string} c
 * @returns {boolean}
 */
export function isWhitespace(c: string): boolean
/**
 * Return true if value is an array or object
 * @private
 * @param {any} value
 * @returns {boolean}
 */
export function isArrayOrObject(value: any): boolean
/**
 * Return oldPath and newPath excluding the common part
 * @private
 * @param {import("./baseTypes").JSONPathType} oldPath
 * @param {import("./baseTypes").JSONPathType} newPath
 * @returns {number}
 */
export function getCommonPathIndex(
  oldPath: import("./baseTypes").JSONPathType,
  newPath: import("./baseTypes").JSONPathType,
): number
/**
 * Check if oldPath is contained in the new path
 * @private
 * @param {import("./baseTypes").JSONPathType} oldPath
 * @param {import("./baseTypes").JSONPathType} newPath
 * @returns {boolean}
 */
export function isPreviousPathInNewPath(
  oldPath: import("./baseTypes").JSONPathType,
  newPath: import("./baseTypes").JSONPathType,
): boolean
/**
 * Transform a value in JSON
 * @private
 * @param {import("./baseTypes").JSONValueType} value
 * @returns {string}
 */
export function valueToString(
  value: import("./baseTypes").JSONValueType,
): string
/**
 * Yields item arrays from end back to index, yield true on last
 * @private
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function fromEndToIndex<T>(
  array: Array<T>,
  index: number,
): Iterable<[number, T]>
/**
 * Yields item arrays from index to end, yield true on first
 * @private
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function fromIndexToEnd<T>(
  array: Array<T>,
  index: number,
): Iterable<[number, T]>
/**
 * "}" or "]"
 * @private
 * @param {import("./baseTypes").JSONSegmentPathType} pathSegment
 * @returns {string}
 */
export function pathSegmentTerminator(
  pathSegment: import("./baseTypes").JSONSegmentPathType,
): string
/**
 * @private
 * @param {Uint8Array} buffer
 * @returns {any}
 */
export function decodeAndParse(buffer: Uint8Array): any
/**
 * @private
 * @param {any} value
 * @returns {Uint8Array}
 */
export function stringifyAndEncode(value: any): Uint8Array
/**
 * @private
 */
export class ParsingError extends Error {
  /**
   * @param {string} message
   * @param {number} charNumber
   */
  constructor(message: string, charNumber: number)
  charNumber: number
}
//# sourceMappingURL=utils.d.ts.map
