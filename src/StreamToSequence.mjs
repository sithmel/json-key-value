//@ts-check

import { ParsingError } from "./utils.mjs"
import StreamJSONTokenizer, {
  TOKEN,
  CHAR_CODE,
} from "./StreamJSONTokenizer.mjs"
import parser from "./pathExp/parser.mjs"
import { MatcherContainer } from "./pathExp/matcher.mjs"
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
  SUB_OBJECT: "SUB_OBJECT", // maxDepth has been reached, storing object/array here
}

export default class StreamToSequence {
  /**
   * Convert a stream of characters (in chunks) to a sequence of path/value pairs
   * @param {{ maxDepth?: number, includes?: string }} options
   */
  constructor(options = {}) {
    const { maxDepth = Infinity } = options
    this.maxDepth = maxDepth
    this.currentDepthInObject = 0

    const { includes = null } = options
    this.matcher = includes ? parser(includes) : new MatcherContainer()
    if (this.matcher.maxLength() > this.maxDepth) {
      throw new Error(
        "The includes expression won't be able to fully match paths as they will be clamped to the chosen maxDepth",
      )
    }

    this.tokenizer = new StreamJSONTokenizer()
    this.state = STATE.VALUE
    /** @type {Array<STATE>} */
    this.stateStack = [STATE.END]
    /** @type {import("../types/baseTypes").JSONPathBufferType} */
    this.currentPath = [] // a combination of strings (object keys) and numbers (array index)
    this.stringBuffer = new Uint8Array() // this stores strings temporarily (keys and values)
    /** @type {Array<number>} */
    this.objectBuffer = [] // when currentDepth is > maxDepth I store things here
    this.decoder = new TextDecoder()
  }

  /**
   * add another segment to the path
   * @package
   * @param {TOKEN} token
   */
  _addToObjectBuffer(token) {
    switch (token) {
      case TOKEN.OPEN_BRACES:
        this.currentDepthInObject++
        this.objectBuffer.push(CHAR_CODE.OPEN_BRACES)
        return
      case TOKEN.CLOSED_BRACES:
        this.currentDepthInObject--
        this.objectBuffer.push(CHAR_CODE.CLOSED_BRACES)
        return
      case TOKEN.OPEN_BRACKET:
        this.currentDepthInObject++
        this.objectBuffer.push(CHAR_CODE.OPEN_BRACKETS)
        return
      case TOKEN.CLOSED_BRACKET:
        this.currentDepthInObject--
        this.objectBuffer.push(CHAR_CODE.CLOSED_BRACKETS)
        return
      case TOKEN.COMMA:
        this.objectBuffer.push(CHAR_CODE.COMMA)
        return
      case TOKEN.COLON:
        this.objectBuffer.push(CHAR_CODE.COLON)
        return
      case TOKEN.NUMBER:
      case TOKEN.STRING:
        this.objectBuffer.push(...this.tokenizer.getOutputBuffer())
        return
      case TOKEN.TRUE:
        this.objectBuffer.push(
          CHAR_CODE.T,
          CHAR_CODE.R,
          CHAR_CODE.U,
          CHAR_CODE.E,
        )
        return
      case TOKEN.FALSE:
        this.objectBuffer.push(
          CHAR_CODE.F,
          CHAR_CODE.A,
          CHAR_CODE.L,
          CHAR_CODE.S,
          CHAR_CODE.E,
        )
        return
      case TOKEN.NULL:
        this.objectBuffer.push(
          CHAR_CODE.N,
          CHAR_CODE.U,
          CHAR_CODE.L,
          CHAR_CODE.L,
        )
        return
    }
  }
  /**
   * convert JSONPathBufferType to JSONPathType
   * @package
   * @return {import("../types/baseTypes").JSONPathType}
   */
  _getEncodedCurrentPath() {
    return this.currentPath.map((n) => {
      if (typeof n === "number") {
        return n
      }
      return JSON.parse(this.decoder.decode(n))
    })
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
    if (this.matcher.isExhausted()) {
      return
    }
    for (const token of this.tokenizer.iter(chunk)) {
      switch (this.state) {
        case STATE.END: // last possible state
          throw new ParsingError(
            "Malformed JSON",
            this.tokenizer.totalBufferIndex,
          )

        case STATE.OPEN_KEY: // after the "," in an object
          if (token === TOKEN.STRING) {
            this.stringBuffer = new Uint8Array(this.tokenizer.getOutputBuffer())
            this.state = STATE.CLOSE_KEY
          } else {
            throw new ParsingError(
              'Malformed object. Key should start with " (after ",")',
              this.tokenizer.totalBufferIndex,
            )
          }
          break

        case STATE.OPEN_OBJECT: // after the "{" in an object
          if (token === TOKEN.CLOSED_BRACES) {
            this.state = this._popState()
            break
          }
          if (token === TOKEN.STRING) {
            this.stringBuffer = new Uint8Array(this.tokenizer.getOutputBuffer())
            this.state = STATE.CLOSE_KEY
          } else {
            throw new ParsingError(
              'Malformed object. Key should start with "',
              this.tokenizer.totalBufferIndex,
            )
          }
          break

        case STATE.CLOSE_KEY: // after the key is over
          if (token === TOKEN.COLON) {
            this.currentPath.push(this.stringBuffer)
            this._pushState(STATE.CLOSE_OBJECT)
            this.state = STATE.VALUE
          } else {
            throw new ParsingError(
              "Malformed object. Expecting ':' after object key",
              this.tokenizer.totalBufferIndex,
            )
          }
          break

        case STATE.CLOSE_OBJECT: // after the value is parsed and the object can be closed
          if (token === TOKEN.CLOSED_BRACES) {
            this.currentPath.pop()
            this.state = this._popState()
          } else if (token === TOKEN.COMMA) {
            this.currentPath.pop()
            this.state = STATE.OPEN_KEY
          } else {
            throw new ParsingError(
              "Malformed object. Expecting '}' or ',' after object value",
              this.tokenizer.totalBufferIndex,
            )
          }
          break

        case STATE.VALUE: // any value
          if (token === TOKEN.STRING) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this._getEncodedCurrentPath(),
                JSON.parse(
                  this.decoder.decode(
                    new Uint8Array(this.tokenizer.getOutputBuffer()),
                  ),
                ),
              ]
            }
            this.state = this._popState()
          } else if (token === TOKEN.OPEN_BRACES) {
            if (this.currentPath.length >= this.maxDepth) {
              this.currentDepthInObject = 0
              this.objectBuffer = []
              this._addToObjectBuffer(token)
              this.state = STATE.SUB_OBJECT
              break
            }
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [this._getEncodedCurrentPath(), {}]
            }
            this.state = STATE.OPEN_OBJECT
          } else if (token === TOKEN.OPEN_BRACKET) {
            if (this.currentPath.length >= this.maxDepth) {
              this.currentDepthInObject = 0
              this.objectBuffer = []
              this._addToObjectBuffer(token)
              this.state = STATE.SUB_OBJECT
              break
            }
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [this._getEncodedCurrentPath(), []]
            }
            this.currentPath.push(0)
            this.state = STATE.VALUE
            this._pushState(STATE.CLOSE_ARRAY)
          } else if (token === TOKEN.CLOSED_BRACKET) {
            this.currentPath.pop()
            this.state = this._popState()
            this.state = this._popState()
          } else if (token === TOKEN.TRUE) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [this._getEncodedCurrentPath(), true]
            }
            this.state = this._popState()
          } else if (token === TOKEN.FALSE) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [this._getEncodedCurrentPath(), false]
            }
            this.state = this._popState()
          } else if (token === TOKEN.NULL) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [this._getEncodedCurrentPath(), null]
            }
            this.state = this._popState()
          } else if (token === TOKEN.NUMBER) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this._getEncodedCurrentPath(),
                JSON.parse(
                  this.decoder.decode(
                    new Uint8Array(this.tokenizer.getOutputBuffer()),
                  ),
                ),
              ]
            }
            this.state = this._popState()
          } else {
            throw new ParsingError(
              "Invalid value",
              this.tokenizer.totalBufferIndex,
            )
          }
          break

        case STATE.CLOSE_ARRAY: // array ready to end, or restart after the comma
          if (token === TOKEN.COMMA) {
            const previousIndex = this.currentPath[this.currentPath.length - 1]
            if (typeof previousIndex !== "number") {
              throw new Error("Array index should be a number")
            }
            this.currentPath[this.currentPath.length - 1] = previousIndex + 1 // next item in the array
            this._pushState(STATE.CLOSE_ARRAY)
            this.state = STATE.VALUE
          } else if (token === TOKEN.CLOSED_BRACKET) {
            this.currentPath.pop() // array is over
            this.state = this._popState()
          } else {
            throw new ParsingError(
              "Invalid array: " + this.state,
              this.tokenizer.totalBufferIndex,
            )
          }
          break
        case STATE.SUB_OBJECT:
          this._addToObjectBuffer(token)
          if (this.currentDepthInObject === 0) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this._getEncodedCurrentPath(),
                JSON.parse(
                  this.decoder.decode(new Uint8Array(this.objectBuffer)),
                ),
              ]
            }
            this.state = this._popState()
          }
          break
        default:
          throw new ParsingError(
            "Unknown state: " + this.state,
            this.tokenizer.totalBufferIndex,
          )
      }
      if (this.matcher.isExhausted()) {
        return
      }
    }
  }
}
