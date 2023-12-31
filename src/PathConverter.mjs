//@ts-check

export default class PathConverter {
  /**
   * Transform a path in a string and vice versa
   *
   * @param {string} separator?
   * @param {string} numberPrefix?
   */
  constructor(separator = "//", numberPrefix = "@@") {
    this.separator = separator
    this.numberPrefix = numberPrefix
  }
  /**
   * Transform an array index in a string that
   * can be sorted in lexicographic order
   * @package
   * @param {number} index
   * @returns {string}
   */
  _indexToString(index) {
    const numberString = index.toFixed()
    return (
      this.numberPrefix +
      String.fromCharCode(64 + numberString.length) +
      numberString
    )
  }
  /**
   * Transform a string in an array index
   * @package
   * @param {string} str
   * @returns {number}
   */
  _stringToIndex(str) {
    return parseInt(str.slice(this.numberPrefix.length + 1))
  }
  /**
   * Convert a path from array to string
   * @param {import("../types/baseTypes").JSONPathType} path
   * @returns {string}
   */
  pathToString(path) {
    return path
      .map((pathSegment) =>
        typeof pathSegment === "string"
          ? pathSegment
          : this._indexToString(pathSegment),
      )
      .join(this.separator)
  }
  /**
   * Convert a path from string to a array
   * @param {string} str
   * @returns {import("../types/baseTypes").JSONPathType}
   */
  stringToPath(str) {
    if (str.length === 0) return []
    return str
      .split(this.separator)
      .map((str) =>
        str.startsWith(this.numberPrefix) ? this._stringToIndex(str) : str,
      )
  }
}
