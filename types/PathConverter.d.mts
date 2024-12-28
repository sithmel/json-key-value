export default class PathConverter {
  /**
   * Transform a path in a string and vice versa
   *
   * @param {string} separator?
   * @param {string} numberPrefix?
   */
  constructor(separator?: string, numberPrefix?: string)
  separator: string
  numberPrefix: string
  /**
   * Transform an array index in a string that
   * can be sorted in lexicographic order
   * @package
   * @param {number} index
   * @returns {string}
   */
  _indexToString(index: number): string
  /**
   * Transform a string in an array index
   * @package
   * @param {string} str
   * @returns {number}
   */
  _stringToIndex(str: string): number
  /**
   * Convert a path from array to string
   * @param {import("../types/baseTypes").JSONPathType} path
   * @returns {string}
   */
  pathToString(path: import("../types/baseTypes").JSONPathType): string
  /**
   * Convert a path from string to a array
   * @param {string} str
   * @returns {import("../types/baseTypes").JSONPathType}
   */
  stringToPath(str: string): import("../types/baseTypes").JSONPathType
}
//# sourceMappingURL=PathConverter.d.mts.map
