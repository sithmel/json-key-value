//@ts-check

import { ParsingError } from "./utils.mjs"

/**
 * Enum for character codes
 * @package
 * @readonly
 * @enum {number}
 */
export const CHAR_CODE = {
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
}

let state_enum = 0
/**
 * Enum for parser state
 * @package
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

export default class StreamJSONTokenizer {
  /**
   * Convert a stream of bytes (in chunks) to a sequence tokens
   */
  constructor() {
    this.totalBufferIndex = 0
    this.state = STATE.IDLE
    /** @type Array<number> */
    this.outputBuffer = [] // this stores strings temporarily
  }

  /**
   * returns the outputBuffer
   * @returns {Array<number>}
   */
  getOutputBuffer() {
    return this.outputBuffer
  }

  /**
   * Parse a json or json fragment, return a sequence of path/value pairs
   * @param {Uint8Array} current_buffer
   * @returns {Iterable<TOKEN>}
   */
  *iter(current_buffer) {
    for (
      let currentBufferIndex = 0;
      currentBufferIndex < current_buffer.length;
      currentBufferIndex++
    ) {
      this.totalBufferIndex++
      let byte = current_buffer[currentBufferIndex]
      switch (this.state) {
        case STATE.IDLE: // any value
          if (
            [
              CHAR_CODE.SPACE,
              CHAR_CODE.TAB,
              CHAR_CODE.CR,
              CHAR_CODE.LF,
            ].includes(byte)
          )
            continue
          if (byte === CHAR_CODE.QUOTE) {
            this.state = STATE.STRING
            this.outputBuffer = [byte]
          } else if (byte === CHAR_CODE.T) {
            this.state = STATE.TRUE
          } else if (byte === CHAR_CODE.F) {
            this.state = STATE.FALSE
          } else if (byte === CHAR_CODE.N) {
            this.state = STATE.NULL
          } else if (
            byte === CHAR_CODE.MINUS ||
            (CHAR_CODE.N0 <= byte && byte <= CHAR_CODE.N9)
          ) {
            // keep and continue
            this.state = STATE.NUMBER
            this.outputBuffer = [byte]
          } else if (byte === CHAR_CODE.OPEN_BRACES) {
            yield TOKEN.OPEN_BRACES
          } else if (byte === CHAR_CODE.CLOSED_BRACES) {
            yield TOKEN.CLOSED_BRACES
          } else if (byte === CHAR_CODE.OPEN_BRACKETS) {
            yield TOKEN.OPEN_BRACKET
          } else if (byte === CHAR_CODE.CLOSED_BRACKETS) {
            yield TOKEN.CLOSED_BRACKET
          } else if (byte === CHAR_CODE.COLON) {
            yield TOKEN.COLON
          } else if (byte === CHAR_CODE.COMMA) {
            yield TOKEN.COMMA
          } else {
            throw new ParsingError("Invalid character", this.totalBufferIndex)
          }
          continue

        case STATE.STRING: // a string
          if (byte === CHAR_CODE.QUOTE) {
            this.outputBuffer.push(byte)
            yield TOKEN.STRING
            this.state = STATE.IDLE
          } else if (byte === CHAR_CODE.BACKSLASH) {
            this.outputBuffer.push(byte)
            this.state = STATE.STRING_SLASH_CHAR
          } else {
            if (
              byte === CHAR_CODE.LF ||
              byte === CHAR_CODE.CR ||
              byte === CHAR_CODE.TAB ||
              byte === CHAR_CODE.DC2 ||
              byte === CHAR_CODE.BACKSPACE
            ) {
              throw new ParsingError("Invalid character", this.totalBufferIndex)
            }
            this.outputBuffer.push(byte)
          }
          continue

        case STATE.STRING_SLASH_CHAR: // a string after the "\"
          this.state = STATE.STRING
          this.outputBuffer.push(byte)
          continue

        case STATE.TRUE:
          if (byte === CHAR_CODE.R) this.state = STATE.TRUE2
          else
            throw new ParsingError(
              "Invalid true started with t",
              this.totalBufferIndex,
            )
          continue

        case STATE.TRUE2:
          if (byte === CHAR_CODE.U) this.state = STATE.TRUE3
          else
            throw new ParsingError(
              "Invalid true started with tr",
              this.totalBufferIndex,
            )
          continue

        case STATE.TRUE3:
          if (byte === CHAR_CODE.E) {
            yield TOKEN.TRUE
            this.state = STATE.IDLE
          } else
            throw new ParsingError(
              "Invalid true started with tru",
              this.totalBufferIndex,
            )
          continue

        case STATE.FALSE:
          if (byte === CHAR_CODE.A) this.state = STATE.FALSE2
          else
            throw new ParsingError(
              "Invalid false started with f",
              this.totalBufferIndex,
            )
          continue

        case STATE.FALSE2:
          if (byte === CHAR_CODE.L) this.state = STATE.FALSE3
          else
            throw new ParsingError(
              "Invalid false started with fa",
              this.totalBufferIndex,
            )
          continue

        case STATE.FALSE3:
          if (byte === CHAR_CODE.S) this.state = STATE.FALSE4
          else
            throw new ParsingError(
              "Invalid false started with fal",
              this.totalBufferIndex,
            )
          continue

        case STATE.FALSE4:
          if (byte === CHAR_CODE.E) {
            yield TOKEN.FALSE
            this.state = STATE.IDLE
          } else
            throw new ParsingError(
              "Invalid false started with fals",
              this.totalBufferIndex,
            )
          continue

        case STATE.NULL:
          if (byte === CHAR_CODE.U) this.state = STATE.NULL2
          else
            throw new ParsingError(
              "Invalid null started with n",
              this.totalBufferIndex,
            )
          continue

        case STATE.NULL2:
          if (byte === CHAR_CODE.L) this.state = STATE.NULL3
          else
            throw new ParsingError(
              "Invalid null started with nu",
              this.totalBufferIndex,
            )
          continue

        case STATE.NULL3:
          if (byte === CHAR_CODE.L) {
            yield TOKEN.NULL
            this.state = STATE.IDLE
          } else
            throw new ParsingError(
              "Invalid null started with nul",
              this.totalBufferIndex,
            )
          continue

        case STATE.NUMBER: // a number
          if (
            (CHAR_CODE.N0 <= byte && byte <= CHAR_CODE.N9) ||
            byte === CHAR_CODE.MINUS ||
            byte === CHAR_CODE.DOT ||
            byte === CHAR_CODE.E ||
            byte === CHAR_CODE.CAPITAL_E
          ) {
            this.outputBuffer.push(byte)
          } else {
            yield TOKEN.NUMBER
            this.state = STATE.IDLE
            currentBufferIndex--
          }
          continue

        default:
          throw new ParsingError(
            "Unknown state: " + this.state,
            this.totalBufferIndex,
          )
      }
    }
  }
}
