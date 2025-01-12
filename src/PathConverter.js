//@ts-check

/**
 * Transform a path in a string and vice versa
 *
 */
class PathConverter {
  /**
   * Transform a path in a string and vice versa
   *
   * @param {string} [separator] - Character sequence to use as a separator between path segments
   * @param {string} [numberPrefix] - prefix to put in front of numeric path segments
   */
  constructor(separator = "//", numberPrefix = "@@") {
    this.separator = separator
    this.numberPrefix = numberPrefix
  }
  /**
   * Transform an array index in a string that
   * can be sorted in lexicographic order
   * @private
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
   * @private
   * @param {string} str
   * @returns {number}
   */
  _stringToIndex(str) {
    return parseInt(str.slice(this.numberPrefix.length + 1))
  }
  /**
   * Convert a path from array to string
   * @param {import("./baseTypes").JSONPathType} path - an array of path segments to convert into string
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
   * @param {string} str - a string to convert into an array of path segments
   * @returns {import("./baseTypes").JSONPathType}
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

export default PathConverter
