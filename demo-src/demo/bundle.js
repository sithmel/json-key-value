;(function () {
  "use strict"

  //@ts-check

  class ParsingError extends Error {
    /**
     * @param {string} message
     * @param {number} charNumber
     */
    constructor(message, charNumber) {
      super(message)

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ParsingError)
      }

      this.name = "ParsingError"
      this.charNumber = charNumber
    }
  }

  /**
   *
   * @param {any} value1
   * @param {any} value2
   * @returns {boolean}
   */
  function areDeeplyEqual(value1, value2) {
    // works with strings, numbers, booleans, null, undefined
    // works also with array and objects, if they are the same
    if (value1 === value2) {
      return true
    }
    // if either values are null or undefined, they are not equal
    if (value1 == null || value2 == null) {
      return false
    }

    // at this point we only have Object and Array left.
    // they must be of the same type to be equal

    // both arrays
    if (Array.isArray(value1) && Array.isArray(value2)) {
      if (value1.length !== value2.length) return false

      return value1.every((elem, index) => {
        return areDeeplyEqual(elem, value2[index])
      })
    }
    if (Array.isArray(value1) || Array.isArray(value2)) {
      // value1 is an array, value2 is an object
      return false
    }
    if (isArrayOrObject(value1) && isArrayOrObject(value2)) {
      // both objects
      const keys1 = Object.keys(value1)
      // different number of keys
      if (keys1.length !== Object.keys(value2).length) return false

      for (let key in value1) {
        if (!(key in value2)) return false
        const isEqual = areDeeplyEqual(value1[key], value2[key])
        if (!isEqual) return false
      }

      return true
    }
    // neither is an array or object
    return false
  }

  /**
   * Return true if value is an array or object
   * @private
   * @param {any} value
   * @returns {boolean}
   */
  function isArrayOrObject(value) {
    return value != null && typeof value === "object"
  }

  const decoder = new TextDecoder("utf8", { fatal: true, ignoreBOM: true })
  const encoder$1 = new TextEncoder()
  /**
   * @template T
   * @private
   * @param {Uint8Array} buffer
   * @returns {T}
   */
  function decodeAndParse(buffer) {
    return JSON.parse(decoder.decode(buffer))
  }

  /**
   * @private
   * @param {any} value
   * @returns {Uint8Array}
   */
  function stringifyAndEncode(value) {
    return encoder$1.encode(JSON.stringify(value))
  }

  //@ts-check

  const FALSE_BUFFER = stringifyAndEncode(false)
  const NULL_BUFFER = stringifyAndEncode(null)
  const TRUE_BUFFER = stringifyAndEncode(true)
  const EMPTY_OBJECT_BUFFER = stringifyAndEncode({})
  const EMPTY_ARRAY_BUFFER = stringifyAndEncode([])

  class Value {
    /** @return {any} */
    get decoded() {
      throw new Error("Not implemented")
    }
    /** @return {Uint8Array} */
    get encoded() {
      throw new Error("Not implemented")
    }

    /**
     * @param {Value} _value
     * @return {boolean} */
    isEqual(_value) {
      throw new Error("Not implemented")
    }
  }

  class True extends Value {
    /** @return {any} */
    get decoded() {
      return true
    }
    /** @return {Uint8Array} */
    get encoded() {
      return TRUE_BUFFER
    }

    /**
     * @param {Value} value
     * @return {boolean} */
    isEqual(value) {
      return value instanceof True
    }
  }

  class False extends Value {
    /** @return {any} */
    get decoded() {
      return false
    }
    /** @return {Uint8Array} */
    get encoded() {
      return FALSE_BUFFER
    }
    /**
     * @param {Value} value
     * @return {boolean} */
    isEqual(value) {
      return value instanceof False
    }
  }

  class Null extends Value {
    /** @return {any} */
    get decoded() {
      return null
    }
    /** @return {Uint8Array} */
    get encoded() {
      return NULL_BUFFER
    }
    /**
     * @param {Value} value
     * @return {boolean} */
    isEqual(value) {
      return value instanceof Null
    }
  }

  /**
   * @template T
   */
  class CachedValue extends Value {
    /** @param {Uint8Array} data */
    constructor(data) {
      super()
      this.data = data
      /** @type {?T} */
      this.cache = null
    }
    /** @return {T} */
    get decoded() {
      if (this.cache != null) {
        return this.cache
      }
      this.cache = decodeAndParse(this.data)
      if (this.cache == null) {
        throw new Error("Decoded value should not be null")
      }
      return this.cache
    }

    /** @return {Uint8Array} */
    get encoded() {
      return this.data
    }
  }

  /**
   * @extends {CachedValue<string>}
   */
  class CachedString extends CachedValue {
    /**
     * @param {Value} otherValue
     * @return {boolean} */
    isEqual(otherValue) {
      if (!(otherValue instanceof CachedString)) {
        return false
      }
      return (
        this.encoded.byteLength === otherValue.encoded.byteLength &&
        this.encoded.every(
          (value, index) => value === otherValue.encoded[index],
        )
      )
    }
  }

  /**
   * @extends {CachedValue<number>}
   */
  class CachedNumber extends CachedValue {
    /**
     * @param {Value} otherValue
     * @return {boolean} */
    isEqual(otherValue) {
      if (!(otherValue instanceof CachedNumber)) {
        return false
      }
      return (
        this.encoded.byteLength === otherValue.encoded.byteLength &&
        this.encoded.every(
          (value, index) => value === otherValue.encoded[index],
        )
      )
    }
  }

  /**
   * @extends {CachedValue<any>}
   */
  class CachedSubObject extends CachedValue {
    /**
     * @param {Value} otherValue
     * @return {boolean} */
    isEqual(otherValue) {
      if (!(otherValue instanceof CachedSubObject)) {
        return false
      }
      return areDeeplyEqual(this.decoded, otherValue.decoded)
    }
  }

  const falseValue = new False()
  const trueValue = new True()
  const nullValue = new Null()
  const emptyObjValue = new CachedSubObject(EMPTY_OBJECT_BUFFER)
  const emptyArrayValue = new CachedSubObject(EMPTY_ARRAY_BUFFER)

  //@ts-check

  /**
   * @typedef {CachedString|number} JSONSegmentPathEncodedType
   */

  /**
   * @typedef {string | number} JSONSegmentPathType
   */

  /**
   * @typedef {Array<JSONSegmentPathType>} JSONPathType
   */

  class Path {
    /**
     * @param {Array<JSONSegmentPathEncodedType>} [array]
     * @param {number} [offset]
     */
    constructor(array = [], offset = 0) {
      this.array = array
      this.offset = offset
    }

    /** @return {number}*/
    get length() {
      return this.array.length - this.offset
    }

    /**
     * Return a new Path with the last segment added
     * @param {JSONSegmentPathEncodedType} segment
     * @return {Path}
     */
    withSegmentAdded(segment) {
      return new Path([...this.array, segment])
    }

    /**
     * Return a new Path with the last segment removed
     * @return {Path}
     */
    withSegmentRemoved() {
      return new Path(this.array.slice(0, -1))
    }

    /**
     * @param {number} index
     * @return {?JSONSegmentPathEncodedType}
     */
    get(index) {
      return this.array[index + this.offset]
    }

    /**
     * @param {(arg0: JSONSegmentPathEncodedType) => any} func
     * @return {Array<any>}
     */
    map(func) {
      const length = this.length
      const output = new Array(length) // Preallocate array size
      for (let i = 0; i < length; i++) {
        const segment = this.get(i)
        if (segment == null) {
          throw new Error("Can't be null or undefined")
        }
        output[i] = func(segment)
      }
      return output
    }

    /**
     * @return {Path}
     * */
    rest() {
      return new Path(this.array, this.offset + 1)
    }

    /** @return {JSONPathType} */
    get decoded() {
      return this.map((segment) => {
        return segment instanceof CachedString ? segment.decoded : segment
      })
    }

    /** @return {Array<Uint8Array|number>} */
    get encoded() {
      return this.map((segment) => {
        return segment instanceof CachedString ? segment.encoded : segment
      })
    }

    /**
     * Yields item arrays from end back to index, yield true on last
     * @param {number} index
     * @returns {Iterable<[number, JSONSegmentPathEncodedType]>}
     */
    *fromEndToIndex(index) {
      for (let i = this.length - 1; i >= index; i--) {
        const segment = this.get(i)
        if (segment == null) {
          throw new Error("Path segment cannot be null")
        }
        yield [i, segment]
      }
    }

    /**
     * Yields item arrays from index to end, yield true on first
     * @param {number} index
     * @returns {Iterable<[number, JSONSegmentPathEncodedType]>}
     */
    *fromIndexToEnd(index) {
      for (let i = index; i < this.length; i++) {
        const segment = this.get(i)
        if (segment == null) {
          throw new Error("Path segment cannot be null")
        }
        yield [i, segment]
      }
    }
    /**
     * Return oldPath and newPath excluding the common part
     * @param {Path} newPath
     * @returns {number}
     */
    getCommonPathIndex(newPath) {
      const length = Math.min(this.length, newPath.length)
      for (let i = 0; i < length; i++) {
        if (!areSegmentsEqual(this.get(i), newPath.get(i))) {
          return i
        }
      }
      return length
    }

    /**
     * The paths are equal
     * @param {Path} newPath
     * @returns {boolean}
     */
    isEqual(newPath) {
      return (
        this.length === newPath.length &&
        this.getCommonPathIndex(newPath) === this.length
      )
    }
  }

  /**
   * Compare two pathSegments for equality
   * @param {JSONSegmentPathEncodedType|null} segment1
   * @param {JSONSegmentPathEncodedType|null} segment2
   * @returns {boolean}
   */
  function areSegmentsEqual(segment1, segment2) {
    if (segment1 === segment2) {
      // they are numbers
      return true
    }
    if (segment1 instanceof CachedString && segment2 instanceof CachedString) {
      return segment1.isEqual(segment2)
    }
    return false
  }

  //@ts-check

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
  const TOKEN = {
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
   * @private
   * @readonly
   * @enum {number}
   */
  const STATE$1 = {
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
   * @private
   */
  class StreamJSONTokenizer {
    constructor() {
      this.offsetIndexFromBeginning = 0
      this.state = STATE$1.IDLE

      /** @type number? */
      this.outputTokenStart = null

      this.currentBuffer = new Uint8Array()
      this.maxDepthReached = false
      this.currentDepthInSubObject = 0
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
          case STATE$1.STRING:
            if (byte === CHAR_CODE.QUOTE) {
              if (this.currentDepthInSubObject === 0) {
                this.maxDepthReached = yield [
                  TOKEN.STRING,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ]
              }
              this.state = STATE$1.IDLE
            } else if (byte === CHAR_CODE.BACKSLASH) {
              this.state = STATE$1.STRING_SLASH_CHAR
            }
            continue

          case STATE$1.IDLE:
            if (
              byte === CHAR_CODE.SPACE ||
              byte === CHAR_CODE.LF ||
              byte === CHAR_CODE.CR ||
              byte === CHAR_CODE.TAB
            ) {
              continue
            }
            if (byte === CHAR_CODE.QUOTE) {
              this.state = STATE$1.STRING
              if (this.currentDepthInSubObject === 0)
                this._startCaptureOutput(currentBufferIndex)
            } else if (byte === CHAR_CODE.T) {
              this.state = STATE$1.TRUE
              if (this.currentDepthInSubObject === 0)
                this._startCaptureOutput(currentBufferIndex)
            } else if (byte === CHAR_CODE.F) {
              this.state = STATE$1.FALSE
              if (this.currentDepthInSubObject === 0)
                this._startCaptureOutput(currentBufferIndex)
            } else if (byte === CHAR_CODE.N) {
              this.state = STATE$1.NULL
              if (this.currentDepthInSubObject === 0)
                this._startCaptureOutput(currentBufferIndex)
            } else if (
              byte === CHAR_CODE.MINUS ||
              (CHAR_CODE.N0 <= byte && byte <= CHAR_CODE.N9)
            ) {
              this.state = STATE$1.NUMBER
              if (this.currentDepthInSubObject === 0)
                this._startCaptureOutput(currentBufferIndex)
            } else if (byte === CHAR_CODE.OPEN_BRACES) {
              if (this.maxDepthReached) {
                if (this.currentDepthInSubObject === 0) {
                  this._startCaptureOutput(currentBufferIndex)
                }
                this.currentDepthInSubObject++
              } else {
                this.maxDepthReached = yield [
                  TOKEN.OPEN_BRACES,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ]
              }
            } else if (byte === CHAR_CODE.CLOSED_BRACES) {
              if (this.maxDepthReached && this.currentDepthInSubObject > 0) {
                this.currentDepthInSubObject--
                if (this.currentDepthInSubObject === 0) {
                  this.maxDepthReached = yield [
                    TOKEN.SUB_OBJECT,
                    this._getOutputTokenStart(),
                    currentBufferIndex + 1,
                  ]
                }
              } else {
                this.maxDepthReached = yield [
                  TOKEN.CLOSED_BRACES,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ]
              }
            } else if (byte === CHAR_CODE.OPEN_BRACKETS) {
              if (this.maxDepthReached) {
                if (this.currentDepthInSubObject === 0) {
                  this._startCaptureOutput(currentBufferIndex)
                }
                this.currentDepthInSubObject++
              } else {
                this.maxDepthReached = yield [
                  TOKEN.OPEN_BRACKET,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ]
              }
            } else if (byte === CHAR_CODE.CLOSED_BRACKETS) {
              if (this.maxDepthReached && this.currentDepthInSubObject > 0) {
                this.currentDepthInSubObject--
                if (this.currentDepthInSubObject === 0) {
                  this.maxDepthReached = yield [
                    TOKEN.SUB_OBJECT,
                    this._getOutputTokenStart(),
                    currentBufferIndex + 1,
                  ]
                }
              } else {
                this.maxDepthReached = yield [
                  TOKEN.CLOSED_BRACKET,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ]
              }
            } else if (byte === CHAR_CODE.COLON) {
              if (this.currentDepthInSubObject === 0) {
                this.maxDepthReached = yield [
                  TOKEN.COLON,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ]
              }
            } else if (byte === CHAR_CODE.COMMA) {
              if (this.currentDepthInSubObject === 0) {
                this.maxDepthReached = yield [
                  TOKEN.COMMA,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ]
              }
            } else {
              throw new ParsingError(
                "Invalid character",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            }
            continue

          case STATE$1.STRING_SLASH_CHAR:
            this.state = STATE$1.STRING
            continue

          case STATE$1.TRUE:
            if (byte === CHAR_CODE.R) this.state = STATE$1.TRUE2
            else
              throw new ParsingError(
                "Invalid true started with t",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.TRUE2:
            if (byte === CHAR_CODE.U) this.state = STATE$1.TRUE3
            else
              throw new ParsingError(
                "Invalid true started with tr",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.TRUE3:
            if (byte === CHAR_CODE.E) {
              if (this.currentDepthInSubObject === 0) {
                this.maxDepthReached = yield [
                  TOKEN.TRUE,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ]
              }
              this.state = STATE$1.IDLE
            } else
              throw new ParsingError(
                "Invalid true started with tru",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.FALSE:
            if (byte === CHAR_CODE.A) this.state = STATE$1.FALSE2
            else
              throw new ParsingError(
                "Invalid false started with f",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.FALSE2:
            if (byte === CHAR_CODE.L) this.state = STATE$1.FALSE3
            else
              throw new ParsingError(
                "Invalid false started with fa",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.FALSE3:
            if (byte === CHAR_CODE.S) this.state = STATE$1.FALSE4
            else
              throw new ParsingError(
                "Invalid false started with fal",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.FALSE4:
            if (byte === CHAR_CODE.E) {
              if (this.currentDepthInSubObject === 0) {
                this.maxDepthReached = yield [
                  TOKEN.FALSE,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ]
              }
              this.state = STATE$1.IDLE
            } else
              throw new ParsingError(
                "Invalid false started with fals",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.NULL:
            if (byte === CHAR_CODE.U) this.state = STATE$1.NULL2
            else
              throw new ParsingError(
                "Invalid null started with n",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.NULL2:
            if (byte === CHAR_CODE.L) this.state = STATE$1.NULL3
            else
              throw new ParsingError(
                "Invalid null started with nu",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.NULL3:
            if (byte === CHAR_CODE.L) {
              if (this.currentDepthInSubObject === 0) {
                this.maxDepthReached = yield [
                  TOKEN.NULL,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ]
              }
              this.state = STATE$1.IDLE
            } else
              throw new ParsingError(
                "Invalid null started with nul",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$1.NUMBER:
            if (
              (CHAR_CODE.N0 <= byte && byte <= CHAR_CODE.N9) ||
              byte === CHAR_CODE.DOT ||
              byte === CHAR_CODE.E ||
              byte === CHAR_CODE.CAPITAL_E ||
              byte === CHAR_CODE.MINUS
            );
            else {
              currentBufferIndex--
              if (this.currentDepthInSubObject === 0) {
                this.maxDepthReached = yield [
                  TOKEN.NUMBER,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ]
              }
              this.state = STATE$1.IDLE
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

  //@ts-check

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
     * @param {number} [options.maxDepth=null] - Max parsing depth
     * @param {(arg0: Path) => boolean} [options.isMaxDepthReached=null] - Max parsing depth
     * @param {import("./lib/path.js").JSONPathType} [options.startingPath] - The parser will consider this path as it is initial (useful to resume)
     */
    constructor(options = {}) {
      const {
        maxDepth = null,
        isMaxDepthReached = null,
        startingPath = [],
      } = options

      if (maxDepth != null && isMaxDepthReached != null) {
        throw new Error("You can only set one of maxDepth or isMaxDepthReached")
      }
      if (maxDepth != null) {
        /** @type {(arg0: Path) => boolean} */
        this._isMaxDepthReached = (path) => path.length >= maxDepth
      } else if (isMaxDepthReached != null) {
        this._isMaxDepthReached = isMaxDepthReached
      } else {
        this._isMaxDepthReached = () => false
      }

      this.maxDepthReached = false
      this.tokenizer = new StreamJSONTokenizer()
      this.state = STATE.VALUE
      /** @type {Array<STATE>}
       * @private
       */
      this.stateStack = this._initStateStack(startingPath)
      this.currentPath = new Path() // this is the current path
      this._initCurrentPath(startingPath) // a combination of buffers (object keys) and numbers (array index)
      this.stringBuffer = new Uint8Array() // this stores strings temporarily (keys and values)

      this.emptyObjectOrArrayStart = 0 // this is used to store the start of an empty object or array
    }

    /**
     * Check if the current path is at max depth
     * @param {number | CachedString} segment
     * @returns {void}
     */
    _pushCurrentPath(segment) {
      this.currentPath = this.currentPath.withSegmentAdded(segment)
      this.maxDepthReached = this._isMaxDepthReached(this.currentPath)
    }

    /**
     * Check if the current path is at max depth
     * @returns {void}
     */
    _popCurrentPath() {
      this.currentPath = this.currentPath.withSegmentRemoved()
      this.maxDepthReached = this._isMaxDepthReached(this.currentPath)
    }

    /**
     * Generate currentPath from a path
     * @private
     * @param {import("./lib/path.js").JSONPathType} path
     */
    _initCurrentPath(path) {
      for (const segment of path) {
        this._pushCurrentPath(
          typeof segment === "string"
            ? new CachedString(stringifyAndEncode(segment))
            : segment,
        )
      }
    }

    /**
     * generate statestack from a path
     * @private
     * @param {import("./lib/path.js").JSONPathType} path
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
     * Parse a json or json fragment from a buffer, split in chunks (ArrayBuffers)
     * and yields a sequence of path/value pairs
     * It also yields the starting and ending byte of each value
     * @param {AsyncIterable<Uint8Array> | Iterable<Uint8Array>} asyncIterable - an arraybuffer that is a chunk of a stream
     * @returns {AsyncIterable<Iterable<[Path, Value, number, number]>>} - path, value, byte start, and byte end when the value is in the buffer
     */
    async *iter(asyncIterable) {
      for await (const chunk of asyncIterable) {
        yield this.iterChunk(chunk)
      }
    }
    /**
     * Parse a json or json fragment from a buffer, split in chunks (ArrayBuffers)
     * and yields a sequence of path/value pairs
     * It also yields the starting and ending byte of each value
     * @param {Uint8Array} chunk - an arraybuffer that is a chunk of a stream
     * @returns {Iterable<[Path, Value, number, number]>} - path, value, byte start, and byte end when the value is in the buffer
     */
    *iterChunk(chunk) {
      const iterator = this.tokenizer.iter(chunk)[Symbol.iterator]()
      while (true) {
        const result = iterator.next(this.maxDepthReached)
        if (result.done) {
          break
        }
        const [token, startToken, endToken] = result.value
        switch (this.state) {
          case STATE.VALUE: // any value
            if (token === TOKEN.STRING) {
              yield [
                this.currentPath,
                new CachedString(
                  this.tokenizer.getOutputBuffer(startToken, endToken),
                ),
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
              this.state = this._popState()
            } else if (token === TOKEN.OPEN_BRACES) {
              this.emptyObjectOrArrayStart =
                startToken + this.tokenizer.offsetIndexFromBeginning
              this.state = STATE.OPEN_OBJECT
            } else if (token === TOKEN.OPEN_BRACKET) {
              this.emptyObjectOrArrayStart =
                startToken + this.tokenizer.offsetIndexFromBeginning
              this._pushCurrentPath(0)
              this.state = STATE.VALUE
              this._pushState(STATE.CLOSE_ARRAY)
            } else if (token === TOKEN.CLOSED_BRACKET) {
              // empty array
              this._popCurrentPath()
              yield [
                this.currentPath,
                emptyArrayValue,
                this.emptyObjectOrArrayStart,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
              this.stateStack.pop() // we are going back to levels in the state
              this.state = this._popState()
            } else if (token === TOKEN.TRUE) {
              yield [
                this.currentPath,
                trueValue,
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
              this.state = this._popState()
            } else if (token === TOKEN.FALSE) {
              yield [
                this.currentPath,
                falseValue,
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
              this.state = this._popState()
            } else if (token === TOKEN.NULL) {
              yield [
                this.currentPath,
                nullValue,
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
              this.state = this._popState()
            } else if (token === TOKEN.NUMBER) {
              yield [
                this.currentPath,
                new CachedNumber(
                  this.tokenizer.getOutputBuffer(startToken, endToken),
                ),
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
              this.state = this._popState()
            } else if (token === TOKEN.SUB_OBJECT) {
              yield [
                this.currentPath,
                new CachedSubObject(
                  this.tokenizer.getOutputBuffer(startToken, endToken),
                ),
                startToken + this.tokenizer.offsetIndexFromBeginning,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]
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
              yield [
                this.currentPath,
                emptyObjValue,
                this.emptyObjectOrArrayStart,
                endToken + this.tokenizer.offsetIndexFromBeginning,
              ]

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
              this._pushCurrentPath(new CachedString(this.stringBuffer))
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
              this._popCurrentPath()
              this.state = this._popState()
            } else if (token === TOKEN.COMMA) {
              this._popCurrentPath()
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
              const previousIndex = this.currentPath.get(
                this.currentPath.length - 1,
              )
              this._popCurrentPath()
              if (typeof previousIndex !== "number") {
                throw new Error("Array index should be a number")
              }
              this._pushCurrentPath(previousIndex + 1)
              this._pushState(STATE.CLOSE_ARRAY)
              this.state = STATE.VALUE
            } else if (token === TOKEN.CLOSED_BRACKET) {
              this._popCurrentPath()
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
      }
    }
  }

  //@ts-check
  /**
   * @private
   * @param {CachedString|number|null} pathSegment
   * @returns {{}|[]}
   */
  function initObject(pathSegment) {
    if (pathSegment == null) {
      throw new Error("Path cannot be empty")
    }
    return typeof pathSegment === "number" && pathSegment >= 0 ? [] : {}
  }

  /**
   * Convert a sequence to a js object
   */
  class SequenceToObject {
    /**
     * Convert a sequence to a js object
     * @param {any} [obj]
     * @param {boolean} [sparse=false] - if true, creates sparse arrays respecting original indexes
     */
    constructor(obj = undefined, sparse = false) {
      this.object = obj
      this.sparse = sparse
      this.previousPath = new Path()
    }

    /**
     * @private
     * @param {CachedString|number|null} pathSegment
     * @param {boolean} isPreviousCommonPathSegment
     * @param {any} currentObject
     * @returns {string|number}
     */
    _calculateRealIndex(
      pathSegment,
      isPreviousCommonPathSegment,
      currentObject,
    ) {
      if (pathSegment instanceof CachedString) {
        return pathSegment.decoded
      }

      if (Array.isArray(currentObject) && pathSegment != null) {
        if (this.sparse) {
          // In sparse mode, use the original index directly
          return pathSegment
        } else {
          // In compact mode, use length-based indexing
          if (isPreviousCommonPathSegment) {
            return currentObject.length - 1 // same element
          } else {
            return currentObject.length // new element
          }
        }
      }
      throw new Error("Invalid path segment")
    }

    /**
     * Returns the object built out of the sequence
     * It can be called multiple times and it will return the up to date object
     * @returns {any}
     */
    getObject() {
      return this.object
    }

    /**
     * Update the object with a new path value pairs
     * @param {Path} path - an array of path segments
     * @param {Value} value - the value corresponding to the path
     * @returns {this}
     */
    add(path, value) {
      if (path.length === 0) {
        this.object = value.decoded
        return this
      }
      if (this.object === undefined) {
        this.object = initObject(path.get(0))
      }

      const commonPathIndex = this.previousPath.getCommonPathIndex(path)
      let currentObject = this.object

      for (let i = 0; i < path.length - 1; i++) {
        const currentPathSegment = this._calculateRealIndex(
          path.get(i),
          i < commonPathIndex,
          currentObject,
        )
        const nextPathSegment = path.get(i + 1)
        if (currentObject[currentPathSegment] === undefined) {
          currentObject[currentPathSegment] = initObject(nextPathSegment)
        }
        currentObject = currentObject[currentPathSegment]
      }
      const currentPathSegment = this._calculateRealIndex(
        path.get(path.length - 1),
        path.length - 1 < commonPathIndex,
        currentObject,
      )
      currentObject[currentPathSegment] = value.decoded
      this.previousPath = path
      return this
    }
  }

  //@ts-check

  const encoder = new TextEncoder()

  encoder.encode("{")
  encoder.encode("}")
  encoder.encode("[")
  encoder.encode("]")
  encoder.encode(",")
  encoder.encode(":")

  const formElement = document.querySelector("form")
  const dataElement = document.querySelector("#data")
  const indexElement = document.querySelector("#index")
  const queryElement = document.querySelector("#query")
  const filenameElement = document.querySelector("#filename")

  async function fetchIndex(filename, index) {
    const indexFilename = `index_${filename}`
    const controller = new AbortController()
    const signal = controller.signal

    let response = await fetch(indexFilename, { signal })
    const readable = response.body
    const parser = new StreamToSequence({
      includes: `${index}`,
      maxDepth: 1,
    })
    const builder = new SequenceToObject()
    for await (const chunk of readable) {
      if (parser.isExhausted()) break
      for (const [path, value] of parser.iter(chunk)) {
        builder.add(path, value)
      }
    }
    controller.abort()

    return builder.object[0]
  }

  async function fetchRecord(filename, index, query) {
    const [startByte, endByte] = await fetchIndex(filename, index)
    const controller = new AbortController()
    const signal = controller.signal

    let response = await fetch(filename, {
      signal,
      headers: {
        Range: `bytes=${startByte}-${endByte - 1}`,
      },
    })
    const readable = response.body
    const options = query ? { includes: query } : undefined
    const parser = new StreamToSequence(options)

    const builder = new SequenceToObject()
    for await (const chunk of readable) {
      if (parser.isExhausted()) break
      for (const [path, value] of parser.iter(chunk)) {
        builder.add(path, value)
      }
    }
    controller.abort()

    return builder.object
  }

  formElement.addEventListener("submit", (e) => {
    e.preventDefault()
    const filename = filenameElement.value
    const index = parseInt(indexElement.value, 10)
    const queryRaw = queryElement.value.trim()
    const query = queryRaw === "" ? null : queryRaw

    fetchRecord(filename, index, query).then((json) => {
      dataElement.innerHTML = JSON.stringify(json, undefined, 2)
    })
  })
})()
