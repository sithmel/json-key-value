/**
 * Check if there is a white space
 * @package
 * @param {string} c
 * @returns {boolean}
 */
export function isWhitespace(c: string): boolean;
/**
 * Return true if value is an array or object
 * @package
 * @param {any} value
 * @returns {boolean}
 */
export function isArrayOrObject(value: any): boolean;
/**
 * Return oldPath and newPath excluding the common part
 * @package
 * @param {import("../types/baseTypes").JSONPathType} oldPath
 * @param {import("../types/baseTypes").JSONPathType} newPath
 * @returns {number}
 */
export function getCommonPathIndex(oldPath: import("../types/baseTypes").JSONPathType, newPath: import("../types/baseTypes").JSONPathType): number;
/**
 * Check if oldPath is contained in the new path
 * @package
 * @param {import("../types/baseTypes").JSONPathType} oldPath
 * @param {import("../types/baseTypes").JSONPathType} newPath
 * @returns {boolean}
 */
export function isPreviousPathInNewPath(oldPath: import("../types/baseTypes").JSONPathType, newPath: import("../types/baseTypes").JSONPathType): boolean;
/**
 * Transform a value in JSON
 * @package
 * @param {import("../types/baseTypes").JSONValueType} value
 * @returns {string}
 */
export function valueToString(value: import("../types/baseTypes").JSONValueType): string;
/**
 * Yields item arrays from end back to index, yield true on last
 * @package
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function fromEndToIndex<T>(array: T[], index: number): Iterable<[number, T]>;
/**
 * Yields item arrays from index to end, yield true on first
 * @package
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function fromIndexToEnd<T>(array: T[], index: number): Iterable<[number, T]>;
/**
 * "}" or "]"
 * @package
 * @param {import("../types/baseTypes").JSONSegmentPathType} pathSegment
 * @returns {string}
 */
export function pathSegmentTerminator(pathSegment: import("../types/baseTypes").JSONSegmentPathType): string;
export class ParsingError extends Error {
    /**
     * @param {string} message
     * @param {number} charNumber
     */
    constructor(message: string, charNumber: number);
    charNumber: number;
}
//# sourceMappingURL=utils.d.mts.map