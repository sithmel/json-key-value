export default SequenceToStream
/**
 * Convert a sequence of path value pairs to a stream of bytes
 */
declare class SequenceToStream {
  /**
   * Convert a sequence of path value pairs to a stream of bytes
   * @param {Object} options
   * @param {boolean} [options.compactArrays=false] - if true ignore array index and generates arrays without gaps
   * @param {(arg0: Uint8Array) => Promise<void>} options.onData - function called when a new sequence of bytes is returned
   */
  constructor({
    onData,
    compactArrays,
  }: {
    compactArrays?: boolean | undefined
    onData: (arg0: Uint8Array) => Promise<void>
  })
  /** @type {import("./baseTypes").JSONPathType} */
  currentPath: import("./baseTypes").JSONPathType
  onData: (arg0: Uint8Array) => Promise<void>
  /** @type CONTEXT */
  context: CONTEXT
  lastWritePromise: Promise<void>
  compactArrays: boolean
  encoder: import("util").TextEncoder
  /**
   * @private
   * @param {string} str
   */
  private _output
  /**
   * add a new path value pair
   * @param {import("./baseTypes").JSONPathType} path - an array of path segments
   * @param {import("./baseTypes").JSONValueType} value - the value at the corresponding path
   * @returns {void}
   */
  add(
    path: import("./baseTypes").JSONPathType,
    value: import("./baseTypes").JSONValueType,
  ): void
  /**
   * The input stream is completed
   * @returns {Promise<void>}
   */
  end(): Promise<void>
}
/**
 * Enum for CONTEXT
 */
type CONTEXT = string
declare namespace CONTEXT {
  let OBJECT: string
  let ARRAY: string
  let NULL: string
}
//# sourceMappingURL=SequenceToStream.d.ts.map
