export default PathConverter;
export type JSONPathType = import("./baseTypes").JSONPathType;
/**
 * @typedef {import("./baseTypes").JSONPathType} JSONPathType
 */
/**
 * Transform a path in a string and vice versa
 *
 */
declare class PathConverter {
    /**
     * Transform a path in a string and vice versa
     *
     * @param {string} [separator] - Character sequence to use as a separator between path segments
     * @param {string} [numberPrefix] - prefix to put in front of numeric path segments
     */
    constructor(separator?: string, numberPrefix?: string);
    separator: string;
    numberPrefix: string;
    /**
     * Transform an array index in a string that
     * can be sorted in lexicographic order
     * @package
     * @private
     * @param {number} index
     * @returns {string}
     */
    private _indexToString;
    /**
     * Transform a string in an array index
     * @package
     * @private
     * @param {string} str
     * @returns {number}
     */
    private _stringToIndex;
    /**
     * Convert a path from array to string
     * @param {JSONPathType} path - an array of path segments to convert into string
     * @returns {string}
     */
    pathToString(path: JSONPathType): string;
    /**
     * Convert a path from string to a array
     * @param {string} str - a string to convert into an array of path segments
     * @returns {JSONPathType}
     */
    stringToPath(str: string): JSONPathType;
}
//# sourceMappingURL=PathConverter.d.ts.map