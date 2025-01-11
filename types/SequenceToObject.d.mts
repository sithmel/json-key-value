export default SequenceToObject
export type JSONSegmentPathType =
  import("../types/baseTypes").JSONSegmentPathType
export type JSONValueType = import("../types/baseTypes").JSONValueType
export type JSONPathType = import("../types/baseTypes").JSONPathType
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
  object: import("../types/baseTypes").JSONValueType | undefined
  compactArrays: boolean
  lastArray: any[] | [] | undefined
  lastArrayIndex: number | undefined
  /**
   * @package
   * @private
   * @param {JSONSegmentPathType} pathSegment
   * @param {JSONValueType} currentObject
   * @returns {JSONSegmentPathType}
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
   * @param {JSONPathType} path - an array of path segments
   * @param {JSONValueType} value - the value corresponding to the path
   * @returns {void}
   */
  add(
    path: import("../types/baseTypes").JSONPathType,
    value: JSONValueType,
  ): void
}
//# sourceMappingURL=SequenceToObject.d.mts.map
