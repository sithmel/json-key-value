//@ts-check

import { ParsingError } from "./utils.mjs"
import StreamJSONTokenizer, { TOKEN } from "./StreamJSONTokenizer.mjs"

/**
 * Enum for parser state
 * @package
 * @readonly
 * @enum {string}
 */
const STATE = {
  VALUE: "VALUE", // general stuff
  OPEN_OBJECT: "OPEN_OBJECT", // {
  CLOSE_OBJECT: "CLOSE_OBJECT", // }
  CLOSE_ARRAY: "CLOSE_ARRAY", // ]
  OPEN_KEY: "OPEN_KEY", // , "a"
  CLOSE_KEY: "CLOSE_KEY", // :
  END: "END", // last state
}

export default class StreamToSequence {
  /**
   * Convert a stream of characters (in chunks) to a sequence of path/value pairs
   */
  constructor() {
    this.tokenizer = new StreamJSONTokenizer()
    this.state = STATE.VALUE
    /** @type {Array<STATE>} */
    this.stateStack = [STATE.END]
    this.char = ""
    /** @type {import("../types/baseTypes").JSONPathType} */
    this.currentPath = [] // a combination of strings (object keys) and numbers (array index)
    this.stringBuffer = "" // this stores strings temporarily (keys and values)
    this.pastChunksLength = 0
  }

  /**
   * add another segment to the path
   * @package
   * @param {string|number} segment
   */
  _pushPathSegment(segment) {
    this.currentPath = [...this.currentPath, segment]
  }

  /**
   * remove a segment from the path
   * @package
   * @returns {string|number}
   */
  _popPathSegment() {
    const lastElement = this.currentPath[this.currentPath.length - 1]
    this.currentPath = this.currentPath.slice(0, -1)
    return lastElement
  }

  /**
   * add another segment to the path
   * @package
   * @param {STATE} state
   */
  _pushState(state) {
    this.stateStack.push(state)
  }

  /**
   * pops the parser state
   * @package
   * @returns {string}
   */
  _popState() {
    const state = this.stateStack.pop()
    if (state == null) {
      throw new Error("Invalid state")
    }
    return state
  }

  /**
   * Check if the JSON parsing completed correctly
   * @returns {boolean}
   */
  isFinished() {
    return this.state === STATE.END
  }

  /**
   * Parse a json or json fragment, return a sequence of path/value pairs
   * @param {Uint8Array} chunk
   * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
   */
  *iter(chunk) {
    for (const token of this.tokenizer.iter(chunk)) {
      switch (this.state) {
        case STATE.END: // last possible state
          throw new ParsingError(
            "Malformed JSON",
            this.tokenizer.currentBufferIndex + this.pastChunksLength,
          )

        case STATE.OPEN_KEY: // after the "," in an object
          if (token === TOKEN.STRING) {
            this.stringBuffer = JSON.parse(
              this.tokenizer.getOutputBufferAsString(),
            )
            this.state = STATE.CLOSE_KEY
          } else {
            throw new ParsingError(
              'Malformed object. Key should start with " (after ",")',
              this.tokenizer.currentBufferIndex + this.pastChunksLength,
            )
          }
          continue

        case STATE.OPEN_OBJECT: // after the "{" in an object
          if (token === TOKEN.CLOSED_BRACES) {
            this.state = this._popState()
            continue
          }
          if (token === TOKEN.STRING) {
            this.stringBuffer = JSON.parse(
              this.tokenizer.getOutputBufferAsString(),
            )
            this.state = STATE.CLOSE_KEY
          } else {
            throw new ParsingError(
              'Malformed object. Key should start with "',
              this.tokenizer.currentBufferIndex + this.pastChunksLength,
            )
          }
          continue

        case STATE.CLOSE_KEY: // after the key is over
          if (token === TOKEN.COLON) {
            this._pushPathSegment(this.stringBuffer)
            this._pushState(STATE.CLOSE_OBJECT)
            this.state = STATE.VALUE
          } else {
            throw new ParsingError(
              "Malformed object. Expecting ':' after object key",
              this.tokenizer.currentBufferIndex + this.pastChunksLength,
            )
          }
          continue

        case STATE.CLOSE_OBJECT: // after the value is parsed and the object can be closed
          if (token === TOKEN.CLOSED_BRACES) {
            this._popPathSegment()
            this.state = this._popState()
          } else if (token === TOKEN.COMMA) {
            this._popPathSegment()
            this.state = STATE.OPEN_KEY
          } else {
            throw new ParsingError(
              "Malformed object. Expecting '}' or ',' after object value",
              this.tokenizer.currentBufferIndex + this.pastChunksLength,
            )
          }
          continue

        case STATE.VALUE: // any value
          if (token === TOKEN.STRING) {
            yield [
              this.currentPath,
              JSON.parse(this.tokenizer.getOutputBufferAsString()),
            ]
            this.state = this._popState()
          } else if (token === TOKEN.OPEN_BRACES) {
            yield [this.currentPath, {}]
            this.state = STATE.OPEN_OBJECT
          } else if (token === TOKEN.OPEN_BRACKET) {
            yield [this.currentPath, []]
            this._pushPathSegment(0)
            this.state = STATE.VALUE
            this._pushState(STATE.CLOSE_ARRAY)
          } else if (token === TOKEN.CLOSED_BRACKET) {
            this._popPathSegment()
            this.state = this._popState()
            this.state = this._popState()
          } else if (token === TOKEN.TRUE) {
            yield [this.currentPath, true]
            this.state = this._popState()
          } else if (token === TOKEN.FALSE) {
            yield [this.currentPath, false]
            this.state = this._popState()
          } else if (token === TOKEN.NULL) {
            yield [this.currentPath, null]
            this.state = this._popState()
          } else if (token === TOKEN.NUMBER) {
            yield [
              this.currentPath,
              JSON.parse(this.tokenizer.getOutputBufferAsString()),
            ]
            this.state = this._popState()
          } else {
            throw new ParsingError(
              "Invalid value",
              this.tokenizer.currentBufferIndex + this.pastChunksLength,
            )
          }
          continue

        case STATE.CLOSE_ARRAY: // array ready to end, or restart after the comma
          if (token === TOKEN.COMMA) {
            const formerIndex = this._popPathSegment()
            if (typeof formerIndex !== "number") {
              throw new Error("Array index should be a number")
            }
            this._pushPathSegment(formerIndex + 1) // next item in the array
            this._pushState(STATE.CLOSE_ARRAY)
            this.state = STATE.VALUE
          } else if (token === TOKEN.CLOSED_BRACKET) {
            this._popPathSegment() // array is over
            this.state = this._popState()
          } else {
            throw new ParsingError(
              "Invalid array: " + this.state,
              this.tokenizer.currentBufferIndex + this.pastChunksLength,
            )
          }
          continue

        default:
          throw new ParsingError(
            "Unknown state: " + this.state,
            this.tokenizer.currentBufferIndex + this.pastChunksLength,
          )
      }
    }
    this.pastChunksLength += chunk.length
  }
}
