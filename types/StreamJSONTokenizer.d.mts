/**
 * Enum for character codes
 */
export type CHAR_CODE = number
export namespace CHAR_CODE {
  let N0: number
  let N9: number
  let MINUS: number
  let OPEN_BRACES: number
  let CLOSED_BRACES: number
  let QUOTE: number
  let COLON: number
  let COMMA: number
  let OPEN_BRACKETS: number
  let CLOSED_BRACKETS: number
  let BACKSLASH: number
  let SPACE: number
  let CR: number
  let LF: number
  let TAB: number
  let BACKSPACE: number
  let DC2: number
  let B: number
  let T: number
  let F: number
  let N: number
  let R: number
  let U: number
  let CAPITAL_E: number
  let E: number
  let A: number
  let L: number
  let S: number
  let DOT: number
}
/**
 * Enum for token value
 */
export type TOKEN = number
export namespace TOKEN {
  let OPEN_BRACES_1: number
  export { OPEN_BRACES_1 as OPEN_BRACES }
  let CLOSED_BRACES_1: number
  export { CLOSED_BRACES_1 as CLOSED_BRACES }
  export let OPEN_BRACKET: number
  export let CLOSED_BRACKET: number
  let COMMA_1: number
  export { COMMA_1 as COMMA }
  let COLON_1: number
  export { COLON_1 as COLON }
  export let STRING: number
  export let NUMBER: number
  export let TRUE: number
  export let FALSE: number
  export let NULL: number
  export let SUB_OBJECT: number
}
export default class StreamJSONTokenizer {
  /**
   * Convert a stream of bytes (in chunks) to a sequence tokens
   * @param {{ maxDepth?: number }} options
   */
  constructor(options?: { maxDepth?: number | undefined })
  maxDepth: number
  currentDepth: number
  offsetIndexFromBeginning: number
  state: number
  /** @type number? */
  outputTokenStart: number | null
  currentBuffer: Uint8Array
  /**
   * returns the outputBuffer
   * @param {number} outputTokenStart
   * @param {number} outputTokenEnd
   * @returns {Uint8Array}
   */
  getOutputBuffer(outputTokenStart: number, outputTokenEnd: number): Uint8Array
  /**
   * save the buffer for the next call
   * @param {number} outputTokenEnd
   */
  saveBufferForNextCall(outputTokenEnd: number): void
  /**
   *
   * @param {number} currentBufferIndex
   */
  startCaptureOutput(currentBufferIndex: number): void
  /**
   *
   * @returns {number}
   */
  getOutputTokenStart(): number
  /**
   * Parse a json or json fragment, return a sequence of path/value pairs
   * @param {Uint8Array} new_buffer
   * @returns {Iterable<[TOKEN, number, number]>}
   */
  iter(new_buffer: Uint8Array): Iterable<[TOKEN, number, number]>
}
//# sourceMappingURL=StreamJSONTokenizer.d.mts.map
