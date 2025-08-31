/**
 * Compare two pathSegments for equality
 * @param {JSONSegmentPathEncodedType|null} segment1
 * @param {JSONSegmentPathEncodedType|null} segment2
 * @returns {boolean}
 */
export function areSegmentsEqual(segment1: JSONSegmentPathEncodedType | null, segment2: JSONSegmentPathEncodedType | null): boolean;
/**
 *
 * @param {JSONSegmentPathType} pathSegment
 * @returns {JSONSegmentPathEncodedType}
 */
export function toEncodedSegment(pathSegment: JSONSegmentPathType): JSONSegmentPathEncodedType;
/**
 *
 * @param {JSONPathType} path
 * @returns {Path}
 */
export function toPathObject(path: JSONPathType): Path;
/**
 * @typedef {CachedString|number} JSONSegmentPathEncodedType
 */
/**
 * @typedef {string | number} JSONSegmentPathType
 */
/**
 * @typedef {Array<JSONSegmentPathType>} JSONPathType
 */
export class Path {
    /**
     * @param {Array<JSONSegmentPathEncodedType>} [array]
     * @param {number} [offset]
     */
    constructor(array?: Array<JSONSegmentPathEncodedType>, offset?: number);
    array: JSONSegmentPathEncodedType[];
    offset: number;
    /** @return {number}*/
    get length(): number;
    /**
     * Return a new Path with the last segment added
     * @param {JSONSegmentPathEncodedType} segment
     * @return {Path}
     */
    withSegmentAdded(segment: JSONSegmentPathEncodedType): Path;
    /**
     * Return a new Path with the last segment removed
     * @return {Path}
     */
    withSegmentRemoved(): Path;
    /**
     * @param {number} index
     * @return {?JSONSegmentPathEncodedType}
     */
    get(index: number): JSONSegmentPathEncodedType | null;
    /**
     * @param {(arg0: JSONSegmentPathEncodedType) => any} func
     * @return {Array<any>}
     */
    map(func: (arg0: JSONSegmentPathEncodedType) => any): Array<any>;
    /**
     * @return {Path}
     * */
    rest(): Path;
    /** @return {JSONPathType} */
    get decoded(): JSONPathType;
    /** @return {Array<Uint8Array|number>} */
    get encoded(): Array<Uint8Array | number>;
    /**
     * Yields item arrays from end back to index, yield true on last
     * @param {number} index
     * @returns {Iterable<[number, JSONSegmentPathEncodedType]>}
     */
    fromEndToIndex(index: number): Iterable<[number, JSONSegmentPathEncodedType]>;
    /**
     * Yields item arrays from index to end, yield true on first
     * @param {number} index
     * @returns {Iterable<[number, JSONSegmentPathEncodedType]>}
     */
    fromIndexToEnd(index: number): Iterable<[number, JSONSegmentPathEncodedType]>;
    /**
     * Return oldPath and newPath excluding the common part
     * @param {Path} newPath
     * @returns {number}
     */
    getCommonPathIndex(newPath: Path): number;
    /**
     * The paths are equal
     * @param {Path} newPath
     * @returns {boolean}
     */
    isEqual(newPath: Path): boolean;
}
export type JSONSegmentPathEncodedType = CachedString | number;
export type JSONSegmentPathType = string | number;
export type JSONPathType = Array<JSONSegmentPathType>;
import { CachedString } from "./value.js";
//# sourceMappingURL=path.d.ts.map