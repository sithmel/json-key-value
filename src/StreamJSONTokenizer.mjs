//@ts-check

import { ParsingError } from "./utils.mjs"

/**
 * Enum for character codes
 * @private
 * @readonly
 * @enum {number}
 */
const CHAR_CODE = {
  N0: "0".charCodeAt(0),
  N9: "9".charCodeAt(0),
  MINUS: "-".charCodeAt(0),

  OPEN_BRACES: "{".charCodeAt(0),
  CLOSED_BRACES: "}".charCodeAt(0),
  QUOTE: '"'.charCodeAt(0),
  COLON: ":".charCodeAt(0),
  COMMA: ",".charCodeAt(0),
  OPEN_BRACKETS: "[".charCodeAt(0),
  CLOSED_BRACKETS: "]".charCodeAt(0),
  BACKSLASH: "\\".charCodeAt(0),

  SPACE: " ".charCodeAt(0),
  CR: "\r".charCodeAt(0),
  LF: "\n".charCodeAt(0),
  TAB: "\t".charCodeAt(0),
  BACKSPACE: "\x08".charCodeAt(0),
  DC2: "\x12".charCodeAt(0),

  B: "b".charCodeAt(0),
  T: "t".charCodeAt(0),
  F: "f".charCodeAt(0),
  N: "n".charCodeAt(0),
  R: "r".charCodeAt(0),
  U: "u".charCodeAt(0),

  CAPITAL_E: "E".charCodeAt(0),
  E: "e".charCodeAt(0),
  A: "a".charCodeAt(0),
  L: "l".charCodeAt(0),
  S: "s".charCodeAt(0),
  DOT: ".".charCodeAt(0),
}

let token_enum = 0
/**
 * Enum for token value
 * @private
 * @readonly
 * @enum {number}
 */
export const TOKEN = {
  // delimiters
  OPEN_BRACES: token_enum++,
  CLOSED_BRACES: token_enum++,
  OPEN_BRACKET: token_enum++,
  CLOSED_BRACKET: token_enum++,
  COMMA: token_enum++,
  COLON: token_enum++,
  // values
  STRING: token_enum++,
  NUMBER: token_enum++,
  TRUE: token_enum++,
  FALSE: token_enum++,
  NULL: token_enum++,
  SUB_OBJECT: token_enum++,
}

let state_enum = 0
/**
 * Enum for parser state
 * @package
 * @private
 * @readonly
 * @enum {number}
 */
const STATE = {
  IDLE: state_enum++, // general stuff
  TRUE: state_enum++, // r
  TRUE2: state_enum++, // u
  TRUE3: state_enum++, // e
  FALSE: state_enum++, // a
  FALSE2: state_enum++, // l
  FALSE3: state_enum++, // s
  FALSE4: state_enum++, // e
  NULL: state_enum++, // u
  NULL2: state_enum++, // l
  NULL3: state_enum++, // l
  NUMBER: state_enum++, // [0-9]
  STRING: state_enum++, // ""
  STRING_SLASH_CHAR: state_enum++, // "\"
}

/**
 * @package
 * @private
 */
class StreamJSONTokenizer {
  /**
   * Convert a stream of bytes (in chunks of ArrayBuffers) to a sequence tokens
   * @param {{ maxDepth?: number }} options
   */
  constructor(options = {}) {
    const { maxDepth = Infinity } = options
    this.maxDepth = maxDepth
    this.currentDepth = 0

    this.offsetIndexFromBeginning = 0
    this.state = STATE.IDLE

    /** @type number? */
    this.outputTokenStart = null

    this.currentBuffer = new Uint8Array()
  }

  /**
   * returns the outputBuffer
   * @param {number} outputTokenStart
   * @param {number} outputTokenEnd
   * @returns {Uint8Array}
   */
  getOutputBuffer(outputTokenStart, outputTokenEnd) {
    const subarray = this.currentBuffer.subarray(
      outputTokenStart,
      outputTokenEnd,
    )
    return subarray
  }

  /**
   * save the buffer for the next call
   * @private
   * @param {number} outputTokenEnd
   */
  _saveBufferForNextCall(outputTokenEnd) {
    this.offsetIndexFromBeginning =
      this.offsetIndexFromBeginning + this.currentBuffer.byteLength
    if (this.outputTokenStart != null) {
      this.currentBuffer = this.currentBuffer.subarray(
        this.outputTokenStart,
        outputTokenEnd,
      )
      this.outputTokenStart = 0
    } else {
      this.currentBuffer = new Uint8Array()
    }
    this.offsetIndexFromBeginning -= this.currentBuffer.byteLength
  }

  /**
   *
   * @private
   * @param {number} currentBufferIndex
   */
  _startCaptureOutput(currentBufferIndex) {
    this.outputTokenStart = currentBufferIndex
  }

  /**
   *
   * @private
   * @returns {number}
   */
  _getOutputTokenStart() {
    const start = this.outputTokenStart
    this.outputTokenStart = null
    if (start == null) {
      throw new Error("Unexpected start is null")
    }
    return start
  }

  /**
   * Parse a json or json fragment, return a sequence of tokens and their delimiters
   * @param {Uint8Array} new_buffer
   * @returns {Iterable<[TOKEN, number, number]>}
   */
  *iter(new_buffer) {
    let currentBufferIndex
    if (this.currentBuffer.byteLength === 0) {
      this.currentBuffer = new_buffer
      currentBufferIndex = 0
    } else {
      currentBufferIndex = this.currentBuffer.byteLength
      // merge current_buffer in this.currentBuffer (if not empty)
      const buffer = new ArrayBuffer(
        this.currentBuffer.byteLength + new_buffer.byteLength,
      )
      const newTypedBuffer = new Uint8Array(buffer)
      newTypedBuffer.set(this.currentBuffer)
      newTypedBuffer.set(new_buffer, this.currentBuffer.byteLength)
      this.currentBuffer = newTypedBuffer
    }

    for (
      ;
      currentBufferIndex < this.currentBuffer.length;
      currentBufferIndex++
    ) {
      let byte = this.currentBuffer[currentBufferIndex]

      switch (this.state) {
        case STATE.STRING:
          if (byte === CHAR_CODE.QUOTE) {
            if (this.currentDepth <= this.maxDepth) {
              yield [
                TOKEN.STRING,
                this._getOutputTokenStart(),
                currentBufferIndex + 1,
              ]
            }
            this.state = STATE.IDLE
          } else if (byte === CHAR_CODE.BACKSLASH) {
            this.state = STATE.STRING_SLASH_CHAR
          }
          continue

        case STATE.IDLE:
          if (
            byte === CHAR_CODE.SPACE ||
            byte === CHAR_CODE.LF ||
            byte === CHAR_CODE.CR ||
            byte === CHAR_CODE.TAB
          ) {
            continue
          }
          if (byte === CHAR_CODE.QUOTE) {
            this.state = STATE.STRING
            if (this.currentDepth <= this.maxDepth)
              this._startCaptureOutput(currentBufferIndex)
          } else if (byte === CHAR_CODE.T) {
            this.state = STATE.TRUE
            if (this.currentDepth <= this.maxDepth)
              this._startCaptureOutput(currentBufferIndex)
          } else if (byte === CHAR_CODE.F) {
            this.state = STATE.FALSE
            if (this.currentDepth <= this.maxDepth)
              this._startCaptureOutput(currentBufferIndex)
          } else if (byte === CHAR_CODE.N) {
            this.state = STATE.NULL
            if (this.currentDepth <= this.maxDepth)
              this._startCaptureOutput(currentBufferIndex)
          } else if (
            byte === CHAR_CODE.MINUS ||
            (CHAR_CODE.N0 <= byte && byte <= CHAR_CODE.N9)
          ) {
            this.state = STATE.NUMBER
            if (this.currentDepth <= this.maxDepth)
              this._startCaptureOutput(currentBufferIndex)
          } else if (byte === CHAR_CODE.OPEN_BRACES) {
            if (this.currentDepth === this.maxDepth) {
              this._startCaptureOutput(currentBufferIndex)
            } else if (this.currentDepth < this.maxDepth) {
              yield [
                TOKEN.OPEN_BRACES,
                currentBufferIndex,
                currentBufferIndex + 1,
              ]
            }
            this.currentDepth++
          } else if (byte === CHAR_CODE.CLOSED_BRACES) {
            this.currentDepth--
            if (this.currentDepth === this.maxDepth) {
              yield [
                TOKEN.SUB_OBJECT,
                this._getOutputTokenStart(),
                currentBufferIndex + 1,
              ]
            } else if (this.currentDepth < this.maxDepth) {
              yield [
                TOKEN.CLOSED_BRACES,
                currentBufferIndex,
                currentBufferIndex + 1,
              ]
            }
          } else if (byte === CHAR_CODE.OPEN_BRACKETS) {
            if (this.currentDepth === this.maxDepth) {
              this._startCaptureOutput(currentBufferIndex)
            } else if (this.currentDepth < this.maxDepth) {
              yield [
                TOKEN.OPEN_BRACKET,
                currentBufferIndex,
                currentBufferIndex + 1,
              ]
            }
            this.currentDepth++
          } else if (byte === CHAR_CODE.CLOSED_BRACKETS) {
            this.currentDepth--
            if (this.currentDepth === this.maxDepth) {
              yield [
                TOKEN.SUB_OBJECT,
                this._getOutputTokenStart(),
                currentBufferIndex + 1,
              ]
            } else if (this.currentDepth < this.maxDepth) {
              yield [
                TOKEN.CLOSED_BRACKET,
                currentBufferIndex,
                currentBufferIndex + 1,
              ]
            }
          } else if (byte === CHAR_CODE.COLON) {
            if (this.currentDepth <= this.maxDepth) {
              yield [TOKEN.COLON, currentBufferIndex, currentBufferIndex + 1]
            }
          } else if (byte === CHAR_CODE.COMMA) {
            if (this.currentDepth <= this.maxDepth) {
              yield [TOKEN.COMMA, currentBufferIndex, currentBufferIndex + 1]
            }
          } else {
            throw new ParsingError(
              "Invalid character",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          }
          continue

        case STATE.STRING_SLASH_CHAR:
          this.state = STATE.STRING
          continue

        case STATE.TRUE:
          if (byte === CHAR_CODE.R) this.state = STATE.TRUE2
          else
            throw new ParsingError(
              "Invalid true started with t",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.TRUE2:
          if (byte === CHAR_CODE.U) this.state = STATE.TRUE3
          else
            throw new ParsingError(
              "Invalid true started with tr",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.TRUE3:
          if (byte === CHAR_CODE.E) {
            if (this.currentDepth <= this.maxDepth) {
              yield [
                TOKEN.TRUE,
                this._getOutputTokenStart(),
                currentBufferIndex + 1,
              ]
            }
            this.state = STATE.IDLE
          } else
            throw new ParsingError(
              "Invalid true started with tru",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.FALSE:
          if (byte === CHAR_CODE.A) this.state = STATE.FALSE2
          else
            throw new ParsingError(
              "Invalid false started with f",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.FALSE2:
          if (byte === CHAR_CODE.L) this.state = STATE.FALSE3
          else
            throw new ParsingError(
              "Invalid false started with fa",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.FALSE3:
          if (byte === CHAR_CODE.S) this.state = STATE.FALSE4
          else
            throw new ParsingError(
              "Invalid false started with fal",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.FALSE4:
          if (byte === CHAR_CODE.E) {
            if (this.currentDepth <= this.maxDepth) {
              yield [
                TOKEN.FALSE,
                this._getOutputTokenStart(),
                currentBufferIndex + 1,
              ]
            }
            this.state = STATE.IDLE
          } else
            throw new ParsingError(
              "Invalid false started with fals",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.NULL:
          if (byte === CHAR_CODE.U) this.state = STATE.NULL2
          else
            throw new ParsingError(
              "Invalid null started with n",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.NULL2:
          if (byte === CHAR_CODE.L) this.state = STATE.NULL3
          else
            throw new ParsingError(
              "Invalid null started with nu",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.NULL3:
          if (byte === CHAR_CODE.L) {
            if (this.currentDepth <= this.maxDepth) {
              yield [
                TOKEN.NULL,
                this._getOutputTokenStart(),
                currentBufferIndex + 1,
              ]
            }
            this.state = STATE.IDLE
          } else
            throw new ParsingError(
              "Invalid null started with nul",
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
          continue

        case STATE.NUMBER:
          if (
            (CHAR_CODE.N0 <= byte && byte <= CHAR_CODE.N9) ||
            byte === CHAR_CODE.DOT ||
            byte === CHAR_CODE.E ||
            byte === CHAR_CODE.CAPITAL_E ||
            byte === CHAR_CODE.MINUS
          ) {
          } else {
            currentBufferIndex--
            if (this.currentDepth <= this.maxDepth) {
              yield [
                TOKEN.NUMBER,
                this._getOutputTokenStart(),
                currentBufferIndex + 1,
              ]
            }
            this.state = STATE.IDLE
          }
          continue

        default:
          throw new ParsingError(
            "Unknown state: " + this.state,
            this.offsetIndexFromBeginning + currentBufferIndex,
          )
      }
    }
    this._saveBufferForNextCall(currentBufferIndex + 1) // save leftovers for next call
  }
}

export default StreamJSONTokenizer
