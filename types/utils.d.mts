/**
 * Check if there is a white space
 * @package
 * @private
 * @param {string} c
 * @returns {boolean}
 */
export function isWhitespace(c: string): boolean
/**
 * Return true if value is an array or object
 * @package
 * @private
 * @param {any} value
 * @returns {boolean}
 */
export function isArrayOrObject(value: any): boolean
/**
 * Return oldPath and newPath excluding the common part
 * @package
 * @private
 * @param {JSONPathType} oldPath
 * @param {JSONPathType} newPath
 * @returns {number}
 */
export function getCommonPathIndex(
  oldPath: import("../types/baseTypes").JSONPathType,
  newPath: import("../types/baseTypes").JSONPathType,
): number
/**
 * Check if oldPath is contained in the new path
 * @package
 * @private
 * @param {JSONPathType} oldPath
 * @param {JSONPathType} newPath
 * @returns {boolean}
 */
export function isPreviousPathInNewPath(
  oldPath: import("../types/baseTypes").JSONPathType,
  newPath: import("../types/baseTypes").JSONPathType,
): boolean
/**
 * Transform a value in JSON
 * @package
 * @private
 * @param {JSONValueType} value
 * @returns {string}
 */
export function valueToString(value: JSONValueType): string
/**
 * Yields item arrays from end back to index, yield true on last
 * @package
 * @private
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function fromEndToIndex<T>(
  array: T[],
  index: number,
): Iterable<[number, T]>
/**
 * Yields item arrays from index to end, yield true on first
 * @package
 * @private
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function fromIndexToEnd<T>(
  array: T[],
  index: number,
): Iterable<[number, T]>
/**
 * "}" or "]"
 * @package
 * @private
 * @param {JSONSegmentPathType} pathSegment
 * @returns {string}
 */
export function pathSegmentTerminator(pathSegment: JSONSegmentPathType): string
/**
 * @package
 * @private
 * @param {Uint8Array} buffer
 * @returns {any}
 */
export function decodeAndParse(buffer: Uint8Array): any
/**
 * @package
 * @private
 * @param {any} value
 * @returns {Uint8Array}
 */
export function stringifyAndEncode(value: any): Uint8Array
/**
 * @typedef {import("../types/baseTypes").JSONValueType} JSONValueType
 * @typedef {import("../types/baseTypes").JSONPathType} JSONPathType
 * @typedef {import("../types/baseTypes").JSONSegmentPathType} JSONSegmentPathType
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
  constructor(message: string, charNumber: number)
  charNumber: number
}
export type JSONValueType = import("../types/baseTypes").JSONValueType
export type JSONPathType = import("../types/baseTypes").JSONPathType
export type JSONSegmentPathType =
  import("../types/baseTypes").JSONSegmentPathType
//# sourceMappingURL=utils.d.mts.map
