/**
 * Check if there is a white space
 * @param {string} c
 * @returns {boolean}
 */
export function isWhitespace(c: string): boolean;
/**
 * Return true if value is an array or object
 * @param {any} value
 * @returns {boolean}
 */
export function isArrayOrObject(value: any): boolean;
/**
 * Return oldPath and newPath excluding the common part
 * @param {import("../types/baseTypes").JSONPathType} oldPath
 * @param {import("../types/baseTypes").JSONPathType} newPath
 * @returns {number}
 */
export function getCommonPathIndex(oldPath: import("../types/baseTypes").JSONPathType, newPath: import("../types/baseTypes").JSONPathType): number;
/**
 * Transform a value in JSON
 * @param {import("../types/baseTypes").JSONValueType} value
 * @returns {string}
 */
export function valueToString(value: import("../types/baseTypes").JSONValueType): string;
/**
 * Yields item arrays from end back to index, yield true on last
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function fromEndToIndex<T>(array: T[], index: number): Iterable<[number, T]>;
/**
 * Yields item arrays from index to end, yield true on first
 * @template T
 * @param {Array<T>} array
 * @param {number} index
 * @returns {Iterable<[number, T]>}
 */
export function fromIndexToEnd<T>(array: T[], index: number): Iterable<[number, T]>;
/**
 * "}" or "]"
 * @param {import("../types/baseTypes").JSONSegmentPathType} pathSegment
 * @returns {string}
 */
export function pathSegmentTerminator(pathSegment: import("../types/baseTypes").JSONSegmentPathType): string;
/**
 * generate match
 * @param {import("../types/baseTypes").JSONSegmentPathType} match
 * @returns {import("../types/baseTypes").MatchKeyOrIndexType}
 */
export function match(match: import("../types/baseTypes").JSONSegmentPathType): import("../types/baseTypes").MatchKeyOrIndexType;
/**
 * generate slice
 * @param {number} sliceFrom
 * @param {number} sliceTo
 * @returns {import("../types/baseTypes").MatchSliceType}
 */
export function slice(sliceFrom?: number, sliceTo?: number): import("../types/baseTypes").MatchSliceType;
/**
 * Generate MatchSegmentType from a string
 * @param {string} str
 * @param {number} index
 * @returns {import("../types/baseTypes").MatchSegmentType}
 */
export function strToMatchSegment(str: string, index?: number): import("../types/baseTypes").MatchSegmentType;
export class ParsingError extends Error {
    /**
     * @param {string} message
     * @param {number} charNumber
     */
    constructor(message: string, charNumber: number);
    charNumber: number;
}
//# sourceMappingURL=utils.d.mts.map