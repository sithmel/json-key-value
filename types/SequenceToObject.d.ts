export default SequenceToObject
/**
 * Convert a sequence to a js object
 */
declare class SequenceToObject {
  /**
   * Convert a sequence to a js object
   * @param {Object} options
   * @param {boolean} [options.compactArrays=false] - if true ignore array index and generates arrays without gaps
   */
  constructor(options?: { compactArrays?: boolean | undefined })
  object: import("./baseTypes").JSONValueType | undefined
  compactArrays: boolean
  lastArray: any[] | [] | undefined
  lastArrayIndex: number | undefined
  /**
   * @private
   * @param {import("./baseTypes").JSONSegmentPathType} pathSegment
   * @param {import("./baseTypes").JSONValueType} currentObject
   * @returns {import("./baseTypes").JSONSegmentPathType}
   */
  private _calculateRealIndex
  /**
   * Returns the object built out of the sequence
   * It can be called multiple times and it will return the up to date object
   * @returns {any}
   */
  getObject(): any
  /**
   * Update the object with a new path value pairs
   * @param {import("./baseTypes").JSONPathType} path - an array of path segments
   * @param {import("./baseTypes").JSONValueType} value - the value corresponding to the path
   * @returns {void}
   */
  add(
    path: import("./baseTypes").JSONPathType,
    value: import("./baseTypes").JSONValueType,
  ): void
}
//# sourceMappingURL=SequenceToObject.d.ts.map
