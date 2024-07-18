//@ts-check

import { ParsingError, isWhitespace } from "./utils.mjs"

/**
 * add another segment to the path
 * @package
 * @param {string} str
 * @param {number} index
 * @returns {number}
 */
function parseNumber(str, index) {
  const n = Number(str)
  if (isNaN(n)) {
    throw new ParsingError("Malformed Number", index)
  }
  return n
}

/**
 * Enum for parser state
 * @package
 * @readonly
 * @enum {string}
 */
const STATE = {
  IDLE: "IDLE", // general stuff
  TRUE: "TRUE", // r
  TRUE2: "TRUE2", // u
  TRUE3: "TRUE3", // e
  FALSE: "FALSE", // a
  FALSE2: "FALSE2", // l
  FALSE3: "FALSE3", // s
  FALSE4: "FALSE4", // e
  NULL: "NULL", // u
  NULL2: "NULL2", // l
  NULL3: "NULL3", // l
  NUMBER: "NUMBER", // [0-9]
  STRING: "STRING", // ""
  STRING_SLASH_CHAR: "STRING_SLASH_CHAR", // "\"
  STRING_UNICODE_CHAR: "STRING_UNICODE_CHAR", // "\u"
}

const SYMBOLS = {
  OPEN_BRACES: Symbol.for("{"),
  CLOSED_BRACES: Symbol.for("}"),
  OPEN_BRACKET: Symbol.for("["),
  CLOSED_BRACKET: Symbol.for("]"),
  COLON: Symbol.for(":"),
  COMMA: Symbol.for(","),
}
export default class StreamToSequenceTokenizer {
  /**
   * Convert a stream of characters (in chunks) to a sequence of path/value pairs
   */
  constructor() {
    this.state = STATE.IDLE
    this.char = ""
    this.stringBuffer = "" // this stores strings temporarily (keys and values)
    this.unicodeBuffer = "" // this stores unicode codes (\uxxx)
  }

  /**
   * Parse a json or json fragment, return a sequence of path/value pairs
   * @param {string} chunk
   * @returns {Iterable<string|boolean|null|number|Symbol>}
   */
  *iter(chunk) {
    for (let index = 0; index < chunk.length; index++) {
      this.char = chunk[index]
      switch (this.state) {
        case STATE.IDLE: // any value
          if (isWhitespace(this.char)) continue
          if (this.char === '"') {
            this.state = STATE.STRING
            this.stringBuffer = ""
          } else if (this.char === "t") {
            this.state = STATE.TRUE
          } else if (this.char === "f") {
            this.state = STATE.FALSE
          } else if (this.char === "n") {
            this.state = STATE.NULL
          } else if (
            this.char === "-" ||
            ("0" <= this.char && this.char <= "9")
          ) {
            // keep and continue
            this.state = STATE.NUMBER
            this.stringBuffer = this.char
          } else if (this.char === "{") {
            yield SYMBOLS.OPEN_BRACES
          } else if (this.char === "}") {
            yield SYMBOLS.CLOSED_BRACES
          } else if (this.char === "[") {
            yield SYMBOLS.OPEN_BRACKET
          } else if (this.char === "]") {
            yield SYMBOLS.CLOSED_BRACKET
          } else if (this.char === ":") {
            yield SYMBOLS.COLON
          } else if (this.char === ",") {
            yield SYMBOLS.COMMA
          } else {
            throw new ParsingError("Invalid character", index)
          }
          continue

        case STATE.STRING: // a string (either value or key)
          if (this.char === '"') {
            yield this.stringBuffer
            this.state = STATE.IDLE
          } else if (this.char === "\\") {
            this.state = STATE.STRING_SLASH_CHAR
          } else {
            if (
              this.char === "\n" ||
              this.char === "\r" ||
              this.char === "\t" ||
              this.char === "\f" ||
              this.char === "\b"
            ) {
              throw new ParsingError("Invalid character", index)
            }
            this.stringBuffer += this.char
          }
          continue

        case STATE.STRING_SLASH_CHAR: // a string after the "\"
          this.state = STATE.STRING
          if (this.char === "\\") {
            this.stringBuffer += "\\"
          } else if (this.char === '"') {
            this.stringBuffer += '"'
          } else if (this.char === "n") {
            this.stringBuffer += "\n"
          } else if (this.char === "r") {
            this.stringBuffer += "\r"
          } else if (this.char === "t") {
            this.stringBuffer += "\t"
          } else if (this.char === "f") {
            this.stringBuffer += "\f"
          } else if (this.char === "b") {
            this.stringBuffer += "\b"
          } else if (this.char === "u") {
            this.unicodeBuffer = ""
            this.state = STATE.STRING_UNICODE_CHAR
          } else {
            throw new ParsingError(`Invalid slash code ${this.char}`, index)
          }
          continue

        case STATE.STRING_UNICODE_CHAR: // a string after the "\u"
          this.unicodeBuffer += this.char
          const lowerChar = this.char.toLowerCase()
          if (
            !("0" <= lowerChar && lowerChar <= "9") &&
            !("a" <= lowerChar && lowerChar <= "f")
          ) {
            throw new ParsingError(
              `Bad unicode character ${this.unicodeBuffer}`,
              index,
            )
          }
          if (this.unicodeBuffer.length === 4) {
            this.stringBuffer += String.fromCharCode(
              parseInt(this.unicodeBuffer, 16),
            )
            this.state = STATE.STRING
            this.unicodeBuffer = ""
          }
          continue

        case STATE.TRUE:
          if (this.char === "r") this.state = STATE.TRUE2
          else
            throw new ParsingError(
              "Invalid true started with t" + this.char,
              index,
            )
          continue

        case STATE.TRUE2:
          if (this.char === "u") this.state = STATE.TRUE3
          else
            throw new ParsingError(
              "Invalid true started with tr" + this.char,
              index,
            )
          continue

        case STATE.TRUE3:
          if (this.char === "e") {
            yield true
            this.state = STATE.IDLE
          } else
            throw new ParsingError(
              "Invalid true started with tru" + this.char,
              index,
            )
          continue

        case STATE.FALSE:
          if (this.char === "a") this.state = STATE.FALSE2
          else
            throw new ParsingError(
              "Invalid false started with f" + this.char,
              index,
            )
          continue

        case STATE.FALSE2:
          if (this.char === "l") this.state = STATE.FALSE3
          else
            throw new ParsingError(
              "Invalid false started with fa" + this.char,
              index,
            )
          continue

        case STATE.FALSE3:
          if (this.char === "s") this.state = STATE.FALSE4
          else
            throw new ParsingError(
              "Invalid false started with fal" + this.char,
              index,
            )
          continue

        case STATE.FALSE4:
          if (this.char === "e") {
            yield false
            this.state = STATE.IDLE
          } else
            throw new ParsingError(
              "Invalid false started with fals" + this.char,
              index,
            )
          continue

        case STATE.NULL:
          if (this.char === "u") this.state = STATE.NULL2
          else
            throw new ParsingError(
              "Invalid null started with n" + this.char,
              index,
            )
          continue

        case STATE.NULL2:
          if (this.char === "l") this.state = STATE.NULL3
          else
            throw new ParsingError(
              "Invalid null started with nu" + this.char,
              index,
            )
          continue

        case STATE.NULL3:
          if (this.char === "l") {
            yield null
            this.state = STATE.IDLE
          } else
            throw new ParsingError(
              "Invalid null started with nul" + this.char,
              index,
            )
          continue

        case STATE.NUMBER: // a number
          if (
            ("0" <= this.char && this.char <= "9") ||
            this.char === "-" ||
            this.char === "." ||
            this.char === "e" ||
            this.char === "E"
          ) {
            this.stringBuffer += this.char
          } else {
            yield parseNumber(this.stringBuffer, index)
            this.state = STATE.IDLE
            index--
          }
          continue

        default:
          throw new ParsingError("Unknown state: " + this.state, index)
      }
    }
  }
}
