//@ts-check
import { ParsingError, decodeAndParse } from "./utils.js"
import StreamJSONTokenizer, { TOKEN } from "./StreamJSONTokenizer.js"
import parser from "./pathExp/parser.js"
import { MatcherContainer } from "./pathExp/matcher.js"
import { Path, CachedStringBuffer } from "./pathExp/path.js"

/**
 * Enum for parser state
 * @private
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

/**
 * Convert a stream of characters (in chunks) to a sequence of path/value pairs
 */
class StreamToSequence {
  /**
   * Convert a stream of bytes (in chunks) into a sequence of path/value pairs
   * @param {Object} [options]
   * @param {number} [options.maxDepth=Infinity] - Max parsing depth
   * @param {string} [options.includes=null] - Expression using the includes syntax
   * @param {import("./baseTypes").JSONPathType} [options.startingPath] - The parser will consider this path as it is initial (useful to resume)
   */
  constructor(options = {}) {
    const { maxDepth = Infinity } = options
    this.currentDepthInObject = 0

    const { includes = null } = options
    this.matcher = includes ? parser(includes) : new MatcherContainer()
    if (this.matcher.maxLength() > maxDepth) {
      throw new Error(
        "The includes expression won't be able to fully match paths as they will be clamped to the chosen maxDepth",
      )
    }
    const { startingPath = [] } = options

    this.tokenizer = new StreamJSONTokenizer({ maxDepth })
    this.state = STATE.VALUE
    /** @type {Array<STATE>}
     * @private
     */
    this.stateStack = this._initStateStack(startingPath)
    this.currentPath = this._initCurrentPath(startingPath) // a combination of buffers (object keys) and numbers (array index)
    this.stringBuffer = new Uint8Array() // this stores strings temporarily (keys and values)
  }

  /**
   * Generate currentPath from a path
   * @private
   * @param {import("./baseTypes").JSONPathType} path
   * @returns {Path}
   */
  _initCurrentPath(path) {
    const encoder = new TextEncoder()
    const currentPath = new Path()
    for (const segment of path) {
      currentPath.push(
        typeof segment === "string"
          ? new CachedStringBuffer(encoder.encode(`"${segment}"`))
          : segment,
      )
    }
    return currentPath
  }

  /**
   * generate statestack from a path
   * @private
   * @param {import("./baseTypes").JSONPathType} path
   * @returns {Array<STATE>}
   */
  _initStateStack(path) {
    const stateStack = [STATE.END]
    for (const segment of path.reverse()) {
      stateStack.push(
        typeof segment === "string" ? STATE.CLOSE_OBJECT : STATE.CLOSE_ARRAY,
      )
    }
    return stateStack
  }

  /**
   * add another segment to the path
   * @private
   * @param {STATE} state
   */
  _pushState(state) {
    this.stateStack.push(state)
  }

  /**
   * pops the parser state
   * @private
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
   * Check if there are no data to extract left considering the "includes" parameter
   * @returns {boolean}
   */
  isExhausted() {
    return this.matcher.isExhausted()
  }

  /**
   * Parse a json or json fragment from a buffer, split in chunks (ArrayBuffers)
   * and yields a sequence of path/value pairs
   * It also yields the starting and ending byte of each value
   * @param {Uint8Array} chunk - an arraybuffer that is a chunk of a stream
   * @returns {Iterable<[import("./baseTypes").JSONPathType, import("./baseTypes").JSONValueType, number, number]>} - path, value, byte start, and byte end when the value is in the buffer
   */
  *iter(chunk) {
    if (this.matcher.isExhausted()) {
      return
    }
    for (const [token, startToken, endToken] of this.tokenizer.iter(chunk)) {
      switch (this.state) {
        case STATE.VALUE: // any value
          if (token === TOKEN.STRING) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this.currentPath.toDecoded(),
                decodeAndParse(
                  this.tokenizer.getOutputBuffer(startToken, endToken),
                ),
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
            }
            this.state = this._popState()
          } else if (token === TOKEN.OPEN_BRACES) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this.currentPath.toDecoded(),
                {},
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
            }
            this.state = STATE.OPEN_OBJECT
          } else if (token === TOKEN.OPEN_BRACKET) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this.currentPath.toDecoded(),
                [],
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
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
              yield [
                this.currentPath.toDecoded(),
                true,
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
            }
            this.state = this._popState()
          } else if (token === TOKEN.FALSE) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this.currentPath.toDecoded(),
                false,
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
            }
            this.state = this._popState()
          } else if (token === TOKEN.NULL) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this.currentPath.toDecoded(),
                null,
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
            }
            this.state = this._popState()
          } else if (token === TOKEN.NUMBER) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this.currentPath.toDecoded(),
                decodeAndParse(
                  this.tokenizer.getOutputBuffer(startToken, endToken),
                ),
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
            }
            this.state = this._popState()
          } else if (token === TOKEN.SUB_OBJECT) {
            if (this.matcher.doesMatch(this.currentPath)) {
              yield [
                this.currentPath.toDecoded(),
                decodeAndParse(
                  this.tokenizer.getOutputBuffer(startToken, endToken),
                ),
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
            }
            this.state = this._popState()
          } else {
            throw new ParsingError(
              `Invalid value ${token}`,
              startToken + this.tokenizer.offsetIndexFromBeginning,
            )
          }
          break

        case STATE.OPEN_KEY: // after the "," in an object
          if (token === TOKEN.STRING) {
            this.stringBuffer = this.tokenizer.getOutputBuffer(
              startToken,
              endToken,
            )
            this.state = STATE.CLOSE_KEY
          } else {
            throw new ParsingError(
              'Malformed object. Key should start with " (after ",")',
              startToken + this.tokenizer.offsetIndexFromBeginning,
            )
          }
          break

        case STATE.OPEN_OBJECT: // after the "{" in an object
          if (token === TOKEN.CLOSED_BRACES) {
            this.state = this._popState()
            break
          }
          if (token === TOKEN.STRING) {
            this.stringBuffer = this.tokenizer.getOutputBuffer(
              startToken,
              endToken,
            )
            this.state = STATE.CLOSE_KEY
          } else {
            throw new ParsingError(
              'Malformed object. Key should start with "',
              startToken + this.tokenizer.offsetIndexFromBeginning,
            )
          }
          break

        case STATE.CLOSE_KEY: // after the key is over
          if (token === TOKEN.COLON) {
            this.currentPath.push(new CachedStringBuffer(this.stringBuffer))
            this._pushState(STATE.CLOSE_OBJECT)
            this.state = STATE.VALUE
          } else {
            throw new ParsingError(
              "Malformed object. Expecting ':' after object key",
              startToken + this.tokenizer.offsetIndexFromBeginning,
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
              startToken + this.tokenizer.offsetIndexFromBeginning,
            )
          }
          break

        case STATE.CLOSE_ARRAY: // array ready to end, or restart after the comma
          if (token === TOKEN.COMMA) {
            const previousIndex = this.currentPath.pop()
            if (typeof previousIndex !== "number") {
              throw new Error("Array index should be a number")
            }
            this.currentPath.push(previousIndex + 1) // next item in the array
            this._pushState(STATE.CLOSE_ARRAY)
            this.state = STATE.VALUE
          } else if (token === TOKEN.CLOSED_BRACKET) {
            this.currentPath.pop() // array is over
            this.state = this._popState()
          } else {
            throw new ParsingError(
              "Invalid array: " + this.state,
              startToken + this.tokenizer.offsetIndexFromBeginning,
            )
          }
          break
        case STATE.END: // last possible state
          throw new ParsingError(
            "Malformed JSON",
            startToken + this.tokenizer.offsetIndexFromBeginning,
          )
        default:
          throw new ParsingError(
            "Unknown state: " + this.state,
            startToken + this.tokenizer.offsetIndexFromBeginning,
          )
      }
      if (this.matcher.isExhausted()) {
        return
      }
    }
  }
}
export default StreamToSequence
