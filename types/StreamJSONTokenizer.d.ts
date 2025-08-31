/**
 * Enum for token value
 */
export type TOKEN = number
export namespace TOKEN {
  let OPEN_BRACES: number
  let CLOSED_BRACES: number
  let OPEN_BRACKET: number
  let CLOSED_BRACKET: number
  let COMMA: number
  let COLON: number
  let STRING: number
  let NUMBER: number
  let TRUE: number
  let FALSE: number
  let NULL: number
  let SUB_OBJECT: number
}
export default StreamJSONTokenizer
/**
 * @private
 */
declare class StreamJSONTokenizer {
  offsetIndexFromBeginning: number
  state: number
  /** @type number? */
  outputTokenStart: number | null
  currentBuffer: Uint8Array<ArrayBuffer>
  maxDepthReached: boolean
  currentDepthInSubObject: number
  /**
   * returns the outputBuffer
   * @param {number} outputTokenStart
   * @param {number} outputTokenEnd
   * @returns {Uint8Array}
   */
  getOutputBuffer(outputTokenStart: number, outputTokenEnd: number): Uint8Array
  /**
   * save the buffer for the next call
   * @private
   * @param {number} outputTokenEnd
   */
  private _saveBufferForNextCall
  /**
   *
   * @private
   * @param {number} currentBufferIndex
   */
  private _startCaptureOutput
  /**
   *
   * @private
   * @returns {number}
   */
  private _getOutputTokenStart
  /**
   * Parse a json or json fragment, return a sequence of tokens and their delimiters
   * @param {Uint8Array} new_buffer
   * @returns {Iterable<[TOKEN, number, number]>}
   */
  iter(new_buffer: Uint8Array): Iterable<[TOKEN, number, number]>
}
//# sourceMappingURL=StreamJSONTokenizer.d.ts.map
