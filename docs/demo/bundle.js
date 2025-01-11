(function () {
  'use strict';

  //@ts-check
  /**
   * @typedef {import("../types/baseTypes").JSONValueType} JSONValueType
   * @typedef {import("../types/baseTypes").JSONPathType} JSONPathType
   * @typedef {import("../types/baseTypes").JSONSegmentPathType} JSONSegmentPathType
   */

  /**
   * @private
   */
  class ParsingError extends Error {
    /**
     * @package
     * @param {string} message
     * @param {number} charNumber
     */
    constructor(message, charNumber) {
      super(message);

      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, ParsingError);
      }

      this.name = "ParsingError";
      this.charNumber = charNumber;
    }
  }

  /**
   * Check if there is a white space
   * @package
   * @private
   * @param {string} c
   * @returns {boolean}
   */
  function isWhitespace(c) {
    return c === "\n" || c === " " || c === "\r" || c === "\t"
  }

  const decoder = new TextDecoder("utf8", { fatal: true, ignoreBOM: true });
  /**
   * @package
   * @private
   * @param {Uint8Array} buffer
   * @returns {any}
   */
  function decodeAndParse(buffer) {
    return JSON.parse(decoder.decode(buffer))
  }

  new TextEncoder();

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
  };

  let token_enum = 0;
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
  };

  let state_enum = 0;
  /**
   * Enum for parser state
   * @package
   * @private
   * @readonly
   * @enum {number}
   */
  const STATE$2 = {
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
  };

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
      const { maxDepth = Infinity } = options;
      this.maxDepth = maxDepth;
      this.currentDepth = 0;

      this.offsetIndexFromBeginning = 0;
      this.state = STATE$2.IDLE;

      /** @type number? */
      this.outputTokenStart = null;

      this.currentBuffer = new Uint8Array();
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
      );
      return subarray
    }

    /**
     * save the buffer for the next call
     * @private
     * @param {number} outputTokenEnd
     */
    _saveBufferForNextCall(outputTokenEnd) {
      this.offsetIndexFromBeginning =
        this.offsetIndexFromBeginning + this.currentBuffer.byteLength;
      if (this.outputTokenStart != null) {
        this.currentBuffer = this.currentBuffer.subarray(
          this.outputTokenStart,
          outputTokenEnd,
        );
        this.outputTokenStart = 0;
      } else {
        this.currentBuffer = new Uint8Array();
      }
      this.offsetIndexFromBeginning -= this.currentBuffer.byteLength;
    }

    /**
     *
     * @private
     * @param {number} currentBufferIndex
     */
    _startCaptureOutput(currentBufferIndex) {
      this.outputTokenStart = currentBufferIndex;
    }

    /**
     *
     * @private
     * @returns {number}
     */
    _getOutputTokenStart() {
      const start = this.outputTokenStart;
      this.outputTokenStart = null;
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
      let currentBufferIndex;
      if (this.currentBuffer.byteLength === 0) {
        this.currentBuffer = new_buffer;
        currentBufferIndex = 0;
      } else {
        currentBufferIndex = this.currentBuffer.byteLength;
        // merge current_buffer in this.currentBuffer (if not empty)
        const buffer = new ArrayBuffer(
          this.currentBuffer.byteLength + new_buffer.byteLength,
        );
        const newTypedBuffer = new Uint8Array(buffer);
        newTypedBuffer.set(this.currentBuffer);
        newTypedBuffer.set(new_buffer, this.currentBuffer.byteLength);
        this.currentBuffer = newTypedBuffer;
      }

      for (
        ;
        currentBufferIndex < this.currentBuffer.length;
        currentBufferIndex++
      ) {
        let byte = this.currentBuffer[currentBufferIndex];

        switch (this.state) {
          case STATE$2.STRING:
            if (byte === CHAR_CODE.QUOTE) {
              if (this.currentDepth <= this.maxDepth) {
                yield [
                  TOKEN.STRING,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ];
              }
              this.state = STATE$2.IDLE;
            } else if (byte === CHAR_CODE.BACKSLASH) {
              this.state = STATE$2.STRING_SLASH_CHAR;
            }
            continue

          case STATE$2.IDLE:
            if (
              byte === CHAR_CODE.SPACE ||
              byte === CHAR_CODE.LF ||
              byte === CHAR_CODE.CR ||
              byte === CHAR_CODE.TAB
            ) {
              continue
            }
            if (byte === CHAR_CODE.QUOTE) {
              this.state = STATE$2.STRING;
              if (this.currentDepth <= this.maxDepth)
                this._startCaptureOutput(currentBufferIndex);
            } else if (byte === CHAR_CODE.T) {
              this.state = STATE$2.TRUE;
              if (this.currentDepth <= this.maxDepth)
                this._startCaptureOutput(currentBufferIndex);
            } else if (byte === CHAR_CODE.F) {
              this.state = STATE$2.FALSE;
              if (this.currentDepth <= this.maxDepth)
                this._startCaptureOutput(currentBufferIndex);
            } else if (byte === CHAR_CODE.N) {
              this.state = STATE$2.NULL;
              if (this.currentDepth <= this.maxDepth)
                this._startCaptureOutput(currentBufferIndex);
            } else if (
              byte === CHAR_CODE.MINUS ||
              (CHAR_CODE.N0 <= byte && byte <= CHAR_CODE.N9)
            ) {
              this.state = STATE$2.NUMBER;
              if (this.currentDepth <= this.maxDepth)
                this._startCaptureOutput(currentBufferIndex);
            } else if (byte === CHAR_CODE.OPEN_BRACES) {
              if (this.currentDepth === this.maxDepth) {
                this._startCaptureOutput(currentBufferIndex);
              } else if (this.currentDepth < this.maxDepth) {
                yield [
                  TOKEN.OPEN_BRACES,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ];
              }
              this.currentDepth++;
            } else if (byte === CHAR_CODE.CLOSED_BRACES) {
              this.currentDepth--;
              if (this.currentDepth === this.maxDepth) {
                yield [
                  TOKEN.SUB_OBJECT,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ];
              } else if (this.currentDepth < this.maxDepth) {
                yield [
                  TOKEN.CLOSED_BRACES,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ];
              }
            } else if (byte === CHAR_CODE.OPEN_BRACKETS) {
              if (this.currentDepth === this.maxDepth) {
                this._startCaptureOutput(currentBufferIndex);
              } else if (this.currentDepth < this.maxDepth) {
                yield [
                  TOKEN.OPEN_BRACKET,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ];
              }
              this.currentDepth++;
            } else if (byte === CHAR_CODE.CLOSED_BRACKETS) {
              this.currentDepth--;
              if (this.currentDepth === this.maxDepth) {
                yield [
                  TOKEN.SUB_OBJECT,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ];
              } else if (this.currentDepth < this.maxDepth) {
                yield [
                  TOKEN.CLOSED_BRACKET,
                  currentBufferIndex,
                  currentBufferIndex + 1,
                ];
              }
            } else if (byte === CHAR_CODE.COLON) {
              if (this.currentDepth <= this.maxDepth) {
                yield [TOKEN.COLON, currentBufferIndex, currentBufferIndex + 1];
              }
            } else if (byte === CHAR_CODE.COMMA) {
              if (this.currentDepth <= this.maxDepth) {
                yield [TOKEN.COMMA, currentBufferIndex, currentBufferIndex + 1];
              }
            } else {
              throw new ParsingError(
                "Invalid character",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            }
            continue

          case STATE$2.STRING_SLASH_CHAR:
            this.state = STATE$2.STRING;
            continue

          case STATE$2.TRUE:
            if (byte === CHAR_CODE.R) this.state = STATE$2.TRUE2;
            else
              throw new ParsingError(
                "Invalid true started with t",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.TRUE2:
            if (byte === CHAR_CODE.U) this.state = STATE$2.TRUE3;
            else
              throw new ParsingError(
                "Invalid true started with tr",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.TRUE3:
            if (byte === CHAR_CODE.E) {
              if (this.currentDepth <= this.maxDepth) {
                yield [
                  TOKEN.TRUE,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ];
              }
              this.state = STATE$2.IDLE;
            } else
              throw new ParsingError(
                "Invalid true started with tru",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.FALSE:
            if (byte === CHAR_CODE.A) this.state = STATE$2.FALSE2;
            else
              throw new ParsingError(
                "Invalid false started with f",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.FALSE2:
            if (byte === CHAR_CODE.L) this.state = STATE$2.FALSE3;
            else
              throw new ParsingError(
                "Invalid false started with fa",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.FALSE3:
            if (byte === CHAR_CODE.S) this.state = STATE$2.FALSE4;
            else
              throw new ParsingError(
                "Invalid false started with fal",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.FALSE4:
            if (byte === CHAR_CODE.E) {
              if (this.currentDepth <= this.maxDepth) {
                yield [
                  TOKEN.FALSE,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ];
              }
              this.state = STATE$2.IDLE;
            } else
              throw new ParsingError(
                "Invalid false started with fals",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.NULL:
            if (byte === CHAR_CODE.U) this.state = STATE$2.NULL2;
            else
              throw new ParsingError(
                "Invalid null started with n",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.NULL2:
            if (byte === CHAR_CODE.L) this.state = STATE$2.NULL3;
            else
              throw new ParsingError(
                "Invalid null started with nu",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.NULL3:
            if (byte === CHAR_CODE.L) {
              if (this.currentDepth <= this.maxDepth) {
                yield [
                  TOKEN.NULL,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ];
              }
              this.state = STATE$2.IDLE;
            } else
              throw new ParsingError(
                "Invalid null started with nul",
                this.offsetIndexFromBeginning + currentBufferIndex,
              )
            continue

          case STATE$2.NUMBER:
            if (
              (CHAR_CODE.N0 <= byte && byte <= CHAR_CODE.N9) ||
              byte === CHAR_CODE.DOT ||
              byte === CHAR_CODE.E ||
              byte === CHAR_CODE.CAPITAL_E ||
              byte === CHAR_CODE.MINUS
            ) ; else {
              currentBufferIndex--;
              if (this.currentDepth <= this.maxDepth) {
                yield [
                  TOKEN.NUMBER,
                  this._getOutputTokenStart(),
                  currentBufferIndex + 1,
                ];
              }
              this.state = STATE$2.IDLE;
            }
            continue

          default:
            throw new ParsingError(
              "Unknown state: " + this.state,
              this.offsetIndexFromBeginning + currentBufferIndex,
            )
        }
      }
      this._saveBufferForNextCall(currentBufferIndex + 1); // save leftovers for next call
    }
  }

  //@ts-check
  /**
   * @typedef {import("../../types/baseTypes").JSONSegmentPathType} JSONSegmentPathType
   * @typedef {import("../../types/baseTypes").JSONPathType} JSONPathType
   */


  /**
   * @private
   */
  class CachedStringBuffer {
    /** @param {Uint8Array} data */
    constructor(data) {
      this.data = data;
      /** @type {?string} */
      this.cache = null;
    }
    /** @return {JSONSegmentPathType} */
    toDecoded() {
      if (this.cache != null) {
        return this.cache
      }
      const cache = decodeAndParse(this.data);
      this.cache = cache;
      return cache
    }
    /** @return {Uint8Array} */
    get() {
      return this.data
    }
  }

  /**
   * @private
   */
  class Path {
    /**
     * @param {Array<CachedStringBuffer|number|string>} [array]
     * @param {number} [offset]
     */
    constructor(array = [], offset = 0) {
      this.array = array;
      this.offset = offset;
    }

    /** @return {number}*/
    get length() {
      return this.array.length - this.offset
    }

    /** @param {CachedStringBuffer|number|string} segment*/
    push(segment) {
      this.array.push(segment);
    }

    /** @return {?CachedStringBuffer|number|string}*/
    pop() {
      return this.array.pop() ?? null
    }

    /**
     * @param {number} index
     * @return {?CachedStringBuffer|number|string}
     */
    get(index) {
      return this.array[index + this.offset]
    }

    /**
     * @param {(arg0: CachedStringBuffer|number|string) => any} func
     * @return {Array<any>}
     */
    map(func) {
      const length = this.length;
      const output = new Array(length); // Preallocate array size
      for (let i = 0; i < length; i++) {
        const segment = this.get(i);
        if (segment == null) {
          throw new Error("Can't be null or undefined")
        }
        output[i] = func(segment);
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
    toDecoded() {
      return this.map((segment) => {
        return segment instanceof CachedStringBuffer
          ? segment.toDecoded()
          : segment
      })
    }
  }

  //@ts-check
  /**
   * @typedef {import("../../types/baseTypes").JSONSegmentPathType} JSONSegmentPathType
   */


  /**
   * create spaces for indentation
   * @private
   * @param {string} spacer
   * @param {number} level
   * @return string
   */
  function indentation(spacer, level) {
    return "\n" + spacer.repeat(level)
  }

  /**
   * This class is used as generic container of matchers
   */
  class MatcherContainer {
    /**
     * This class is used as generic container of matchers
     * @param {Array<BaseMatcher>} [matchers]
     */
    constructor(matchers) {
      this.matchers = matchers ?? [];
    }
    /**
     * Check for match
     * @param {Path} path
     * @return {boolean}
     */
    doesMatch(path) {
      if (this.matchers.length == 0) {
        return true
      }
      for (const matcher of this.matchers) {
        if (matcher.doesMatch(path, true)) {
          return true
        }
      }
      return false
    }
    /**
     * Check if matchers are exhausted
     * @return {boolean}
     */
    isExhausted() {
      if (this.matchers.length === 0) {
        return false
      }
      return this.matchers.every((m) => m.isExhausted())
    }

    /**
     * print as a string
     * @param {string?} [spacer]
     * @return {string}
     */
    stringify(spacer = null) {
      return this.matchers
        .map((m) => m.stringify(spacer, 0))
        .join(spacer == null ? " " : indentation(spacer, 0))
    }

    /**
     * return the length of the longest branch of the tree
     * @return {number}
     */
    maxLength() {
      const matcherMaxLength = this.matchers.map((m) => m.maxLength());
      return Math.max(...[0, ...matcherMaxLength])
    }
  }

  /**
   * @private
   */
  class BaseMatcher {
    /**
     * This class is used as:
     * - generic container of matchers
     * - base class for all matchers
     * - match *
     * @param {Array<BaseMatcher>} [matchers]
     */
    constructor(matchers) {
      this.matchers = matchers ?? [];
      this._isExhausted = false;
      this._isLastPossibleMatch = true;
    }

    /**
     * Check if this specific segment matches, without checking the children
     * @param {?CachedStringBuffer|number|string} _segment
     * @param {boolean} _parentLastPossibleMatch
     * @return {boolean}
     */
    doesSegmentMatch(_segment, _parentLastPossibleMatch) {
      return false
    }

    /**
     * Check for match
     * @param {Path} path
     * @param {boolean} [parentLastPossibleMatch]
     * @return {boolean}
     */
    doesMatch(path, parentLastPossibleMatch = true) {
      if (
        path.length === 0 ||
        this.isExhausted() ||
        !this.doesSegmentMatch(path.get(0), parentLastPossibleMatch)
      ) {
        return false
      }
      if (this.matchers.length == 0) {
        return true
      }
      const newPath = path.rest();
      for (const matcher of this.matchers) {
        if (matcher.doesMatch(newPath, this._isLastPossibleMatch)) {
          return true
        }
      }
      return false
    }
    /**
     * Check if matcher is exhausted (or children)
     * @return {boolean}
     */
    isExhausted() {
      if (this._isExhausted) {
        return true
      }
      if (this.matchers.length === 0) {
        return false
      }
      return this.matchers.every((m) => m.isExhausted())
    }

    /**
     * print as a string
     * @param {string?} [spacer]
     * @param {number} [level]
     * @return {string}
     */
    stringify(spacer = null, level = 0) {
      if (this.matchers.length === 0) return ""
      const spaceBefore = spacer == null ? "" : indentation(spacer, level + 1);
      const spaceBetween = spacer == null ? " " : indentation(spacer, level + 1);
      const spaceAfter = spacer == null ? "" : indentation(spacer, level);
      return `(${spaceBefore}${this.matchers
      .map((m) => m.stringify(spacer, level + 1))
      .join(spaceBetween)}${spaceAfter})`
    }

    /**
     * return the length of the longest branch of the tree
     * @return {number}
     */
    maxLength() {
      const matcherMaxLength = this.matchers.map((m) => m.maxLength());
      return Math.max(...[0, ...matcherMaxLength]) + 1
    }
  }

  /**
   * @private
   */
  class AnyMatcher extends BaseMatcher {
    /**
     * Check if this specific segment matches, without checking the children
     * @param {CachedStringBuffer|number|string} _segment
     * @param {boolean} _parentLastPossibleMatch
     * @return {boolean}
     */
    doesSegmentMatch(_segment, _parentLastPossibleMatch) {
      this._isLastPossibleMatch = false;
      return true
    }
    /**
     * print as a string
     * @param {string?} [spacer]
     * @param {number} [level]
     * @return {string}
     */
    stringify(spacer = null, level = 0) {
      return `*${super.stringify(spacer, level)}`
    }
  }

  /**
   * @private
   */
  class SegmentMatcher extends BaseMatcher {
    /**
     * direct match of a number of a string
     * @param {Array<BaseMatcher>} [matchers]
     * @param {JSONSegmentPathType} segmentMatch
     */
    constructor(segmentMatch, matchers) {
      super(matchers);
      this.hasMatchedForLastTime = false;
      this._isLastPossibleMatch = true;
      const encoder = new TextEncoder();

      this.segmentMatch = segmentMatch;
      this.segmentMatchEncoded =
        typeof segmentMatch === "string"
          ? encoder.encode(JSON.stringify(segmentMatch))
          : segmentMatch;
    }
    /**
     * Check if this specific segment matches, without checking the children
     * @param {CachedStringBuffer|number|string} segment
     * @return {boolean}
     */
    _doesMatch(segment) {
      if (
        typeof this.segmentMatchEncoded === "number" &&
        typeof segment === "number"
      ) {
        return segment === this.segmentMatchEncoded
      }
      if (typeof this.segmentMatch === "string" && typeof segment === "string") {
        return segment === this.segmentMatch
      }
      if (
        this.segmentMatchEncoded instanceof Uint8Array &&
        segment instanceof CachedStringBuffer
      ) {
        const buffer = segment.get();
        return (
          this.segmentMatchEncoded.byteLength === buffer.byteLength &&
          this.segmentMatchEncoded.every(
            (value, index) => value === buffer[index],
          )
        )
      }
      return false
    }
    /**
     * Check if this specific segment matches, without checking the children
     * @param {CachedStringBuffer|number|string} segment
     * @param {boolean} parentLastPossibleMatch
     * @return {boolean}
     */
    doesSegmentMatch(segment, parentLastPossibleMatch) {
      this._isLastPossibleMatch = parentLastPossibleMatch;

      const doesMatch = this._doesMatch(segment);

      if (!doesMatch && this.hasMatchedForLastTime) {
        this._isExhausted = true;
      }
      if (this._isLastPossibleMatch) {
        this.hasMatchedForLastTime = doesMatch;
      }
      return doesMatch
    }
    /**
     * print as a string
     * @param {string?} [spacer]
     * @param {number} [level]
     * @return {string}
     */
    stringify(spacer = null, level = 0) {
      let segmentStr;
      if (typeof this.segmentMatch === "string") {
        if (this.segmentMatch.includes("'")) {
          segmentStr = `"${this.segmentMatch}"`;
        } else {
          segmentStr = `'${this.segmentMatch}'`;
        }
      } else {
        segmentStr = this.segmentMatch.toString();
      }
      return `${segmentStr}${super.stringify(spacer, level)}`
    }
  }

  /**
   * @private
   */
  class SliceMatcher extends BaseMatcher {
    /**
     * Check for a slice (numbers only)
     * @param {{min: number, max: number}} options
     * @param {Array<BaseMatcher>} [matchers]
     */
    constructor(options, matchers) {
      super(matchers);
      this.hasMatchedForLastTime = false;
      this.min = options.min ?? 0;
      this.max = options.max ?? Infinity;
      if (this.min >= this.max) {
        throw new Error(
          "in a slice, the min value should be smaller than the max",
        )
      }
    }
    /**
     * Check if this specific segment matches, without checking the children
     * @param {CachedStringBuffer|number|string} segment
     * @param {boolean} parentLastPossibleMatch
     * @return {boolean}
     */
    doesSegmentMatch(segment, parentLastPossibleMatch) {
      if (typeof segment !== "number") {
        return false
      }
      this._isLastPossibleMatch =
        parentLastPossibleMatch && segment === this.max - 1;

      const doesMatch = segment >= this.min && segment < this.max;
      if (!doesMatch && this.hasMatchedForLastTime) {
        this._isExhausted = true;
      }
      if (this._isLastPossibleMatch) {
        this.hasMatchedForLastTime = doesMatch;
      }
      return doesMatch
    }
    /**
     * print as a string
     * @param {string?} [spacer]
     * @param {number} [level]
     * @return {string}
     */
    stringify(spacer = null, level = 0) {
      const min = this.min === 0 ? "" : this.min.toString();
      const max = this.max === Infinity ? "" : this.max.toString();
      return `${min}..${max}${super.stringify(spacer, level)}`
    }
  }

  //@ts-check


  const STATE$1 = {
    VALUE: "VALUE",
    STRING_SINGLE_QUOTE: "STRING_SINGLE_QUOTE",
    STRING_DOUBLE_QUOTE: "STRING_DOUBLE_QUOTE",
    NUMBER_OR_SLICE: "NUMBER_OR_SLICE",
    COMMENT: "COMMENT",
  };

  /**
   * parse and include expression and return a Matcher
   * @param {string} str - the include expression
   * @return {MatcherContainer}
   */
  function parseIncludes(str) {
    str += " "; // this simplifies parsing of numbers (the extra space act as a delimiter)
    const matcherStack = [new MatcherContainer()];
    const getLastMatcherChildren = () =>
      matcherStack[matcherStack.length - 1].matchers;

    let state = STATE$1.VALUE;
    let stringBuffer = "";
    for (let index = 0; index < str.length; index++) {
      const char = str[index];
      switch (state) {
        case STATE$1.VALUE:
          if (isWhitespace(char)) continue
          if (char === "(") {
            // add last matcher to the stack
            const lastMatcherChildren = getLastMatcherChildren();
            matcherStack.push(lastMatcherChildren[lastMatcherChildren.length - 1]);
          } else if (char === ")") {
            // remove last matcher from the stack
            matcherStack.pop();
            if (matcherStack.length === 0) {
              throw new ParsingError("Unpaired brackets: ", index)
            }
          } else if (char === "*") {
            getLastMatcherChildren().push(new AnyMatcher());
          } else if (char === '"') {
            state = STATE$1.STRING_DOUBLE_QUOTE;
            stringBuffer = "";
          } else if (char === "'") {
            state = STATE$1.STRING_SINGLE_QUOTE;
            stringBuffer = "";
          } else if (/[0-9\.]/.test(char)) {
            state = STATE$1.NUMBER_OR_SLICE;
            stringBuffer = char;
          } else if (char === "#") {
            state = STATE$1.COMMENT;
          } else {
            throw new ParsingError("Unknown token: " + char, index)
          }
          continue
        case STATE$1.COMMENT:
          if (char === "\n") {
            state = STATE$1.VALUE;
          }
          continue
        case STATE$1.STRING_SINGLE_QUOTE:
          if (char === "'") {
            getLastMatcherChildren().push(new SegmentMatcher(stringBuffer));
            state = STATE$1.VALUE;
          } else {
            stringBuffer += char;
          }
          continue
        case STATE$1.STRING_DOUBLE_QUOTE:
          if (char === '"') {
            getLastMatcherChildren().push(new SegmentMatcher(stringBuffer));
            state = STATE$1.VALUE;
          } else {
            stringBuffer += char;
          }
          continue

        case STATE$1.NUMBER_OR_SLICE:
          if (!/[0-9\.]/.test(char)) {
            if (stringBuffer.includes("..")) {
              const minAndMax = stringBuffer.split("..");
              if (minAndMax.length !== 2) {
                throw new ParsingError("Invalid slice: " + state, index)
              }
              const min = minAndMax[0].length !== 0 ? parseInt(minAndMax[0]) : 0;
              const max =
                minAndMax[1].length !== 0 ? parseInt(minAndMax[1]) : Infinity;
              getLastMatcherChildren().push(new SliceMatcher({ min, max }));
            } else if (/[0-9]+/.test(stringBuffer)) {
              getLastMatcherChildren().push(
                new SegmentMatcher(parseInt(stringBuffer)),
              );
            } else {
              throw new ParsingError("Invalid index: " + state, index)
            }
            state = STATE$1.VALUE;
            index--;
          } else {
            stringBuffer += char;
          }
          continue
        default:
          throw new ParsingError("Unknown state: " + state, index)
      }
    }
    return matcherStack[0]
  }

  //@ts-check
  /**
   * @typedef {import("../types/baseTypes").JSONValueType} JSONValueType
   * @typedef {import("../types/baseTypes").JSONPathType} JSONPathType
   */


  /**
   * Enum for parser state
   * @package
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
  };

  /**
   * Convert a stream of characters (in chunks) to a sequence of path/value pairs
   */
  class StreamToSequence {
    /**
     * Convert a stream of bytes (in chunks) into a sequence of path/value pairs
     * @param {Object} [options]
     * @param {number} [options.maxDepth=Infinity] - Max parsing depth
     * @param {string} [options.includes=null] - Expression using the includes syntax
     * @param {JSONPathType} [options.startingPath] - The parser will consider this path as it is initial (useful to resume)
     */
    constructor(options = {}) {
      const { maxDepth = Infinity } = options;
      this.currentDepthInObject = 0;

      const { includes = null } = options;
      this.matcher = includes ? parseIncludes(includes) : new MatcherContainer();
      if (this.matcher.maxLength() > maxDepth) {
        throw new Error(
          "The includes expression won't be able to fully match paths as they will be clamped to the chosen maxDepth",
        )
      }
      const { startingPath = [] } = options;

      this.tokenizer = new StreamJSONTokenizer({ maxDepth });
      this.state = STATE.VALUE;
      /** @type {Array<STATE>}
       * @private
       */
      this.stateStack = this._initStateStack(startingPath);
      this.currentPath = this._initCurrentPath(startingPath); // a combination of buffers (object keys) and numbers (array index)
      this.stringBuffer = new Uint8Array(); // this stores strings temporarily (keys and values)
    }

    /**
     * Generate currentPath from a path
     * @package
     * @private
     * @param {JSONPathType} path
     * @returns {Path}
     */
    _initCurrentPath(path) {
      const encoder = new TextEncoder();
      const currentPath = new Path();
      for (const segment of path) {
        currentPath.push(
          typeof segment === "string"
            ? new CachedStringBuffer(encoder.encode(`"${segment}"`))
            : segment,
        );
      }
      return currentPath
    }

    /**
     * generate statestack from a path
     * @package
     * @private
     * @param {JSONPathType} path
     * @returns {Array<STATE>}
     */
    _initStateStack(path) {
      const stateStack = [STATE.END];
      for (const segment of path.reverse()) {
        stateStack.push(
          typeof segment === "string" ? STATE.CLOSE_OBJECT : STATE.CLOSE_ARRAY,
        );
      }
      return stateStack
    }

    /**
     * add another segment to the path
     * @package
     * @private
     * @param {STATE} state
     */
    _pushState(state) {
      this.stateStack.push(state);
    }

    /**
     * pops the parser state
     * @package
     * @private
     * @returns {string}
     */
    _popState() {
      const state = this.stateStack.pop();
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
     * @returns {Iterable<[JSONPathType, JSONValueType, number, number]>} - path, value, byte start, and byte end when the value is in the buffer
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
                ];
              }
              this.state = this._popState();
            } else if (token === TOKEN.OPEN_BRACES) {
              if (this.matcher.doesMatch(this.currentPath)) {
                yield [
                  this.currentPath.toDecoded(),
                  {},
                  startToken + this.tokenizer.offsetIndexFromBeginning,
                  endToken + this.tokenizer.offsetIndexFromBeginning,
                ];
              }
              this.state = STATE.OPEN_OBJECT;
            } else if (token === TOKEN.OPEN_BRACKET) {
              if (this.matcher.doesMatch(this.currentPath)) {
                yield [
                  this.currentPath.toDecoded(),
                  [],
                  startToken + this.tokenizer.offsetIndexFromBeginning,
                  endToken + this.tokenizer.offsetIndexFromBeginning,
                ];
              }
              this.currentPath.push(0);
              this.state = STATE.VALUE;
              this._pushState(STATE.CLOSE_ARRAY);
            } else if (token === TOKEN.CLOSED_BRACKET) {
              this.currentPath.pop();
              this.state = this._popState();
              this.state = this._popState();
            } else if (token === TOKEN.TRUE) {
              if (this.matcher.doesMatch(this.currentPath)) {
                yield [
                  this.currentPath.toDecoded(),
                  true,
                  startToken + this.tokenizer.offsetIndexFromBeginning,
                  endToken + this.tokenizer.offsetIndexFromBeginning,
                ];
              }
              this.state = this._popState();
            } else if (token === TOKEN.FALSE) {
              if (this.matcher.doesMatch(this.currentPath)) {
                yield [
                  this.currentPath.toDecoded(),
                  false,
                  startToken + this.tokenizer.offsetIndexFromBeginning,
                  endToken + this.tokenizer.offsetIndexFromBeginning,
                ];
              }
              this.state = this._popState();
            } else if (token === TOKEN.NULL) {
              if (this.matcher.doesMatch(this.currentPath)) {
                yield [
                  this.currentPath.toDecoded(),
                  null,
                  startToken + this.tokenizer.offsetIndexFromBeginning,
                  endToken + this.tokenizer.offsetIndexFromBeginning,
                ];
              }
              this.state = this._popState();
            } else if (token === TOKEN.NUMBER) {
              if (this.matcher.doesMatch(this.currentPath)) {
                yield [
                  this.currentPath.toDecoded(),
                  decodeAndParse(
                    this.tokenizer.getOutputBuffer(startToken, endToken),
                  ),
                  startToken + this.tokenizer.offsetIndexFromBeginning,
                  endToken + this.tokenizer.offsetIndexFromBeginning,
                ];
              }
              this.state = this._popState();
            } else if (token === TOKEN.SUB_OBJECT) {
              if (this.matcher.doesMatch(this.currentPath)) {
                yield [
                  this.currentPath.toDecoded(),
                  decodeAndParse(
                    this.tokenizer.getOutputBuffer(startToken, endToken),
                  ),
                  startToken + this.tokenizer.offsetIndexFromBeginning,
                  endToken + this.tokenizer.offsetIndexFromBeginning,
                ];
              }
              this.state = this._popState();
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
              );
              this.state = STATE.CLOSE_KEY;
            } else {
              throw new ParsingError(
                'Malformed object. Key should start with " (after ",")',
                startToken + this.tokenizer.offsetIndexFromBeginning,
              )
            }
            break

          case STATE.OPEN_OBJECT: // after the "{" in an object
            if (token === TOKEN.CLOSED_BRACES) {
              this.state = this._popState();
              break
            }
            if (token === TOKEN.STRING) {
              this.stringBuffer = this.tokenizer.getOutputBuffer(
                startToken,
                endToken,
              );
              this.state = STATE.CLOSE_KEY;
            } else {
              throw new ParsingError(
                'Malformed object. Key should start with "',
                startToken + this.tokenizer.offsetIndexFromBeginning,
              )
            }
            break

          case STATE.CLOSE_KEY: // after the key is over
            if (token === TOKEN.COLON) {
              this.currentPath.push(new CachedStringBuffer(this.stringBuffer));
              this._pushState(STATE.CLOSE_OBJECT);
              this.state = STATE.VALUE;
            } else {
              throw new ParsingError(
                "Malformed object. Expecting ':' after object key",
                startToken + this.tokenizer.offsetIndexFromBeginning,
              )
            }
            break

          case STATE.CLOSE_OBJECT: // after the value is parsed and the object can be closed
            if (token === TOKEN.CLOSED_BRACES) {
              this.currentPath.pop();
              this.state = this._popState();
            } else if (token === TOKEN.COMMA) {
              this.currentPath.pop();
              this.state = STATE.OPEN_KEY;
            } else {
              throw new ParsingError(
                "Malformed object. Expecting '}' or ',' after object value",
                startToken + this.tokenizer.offsetIndexFromBeginning,
              )
            }
            break

          case STATE.CLOSE_ARRAY: // array ready to end, or restart after the comma
            if (token === TOKEN.COMMA) {
              const previousIndex = this.currentPath.pop();
              if (typeof previousIndex !== "number") {
                throw new Error("Array index should be a number")
              }
              this.currentPath.push(previousIndex + 1); // next item in the array
              this._pushState(STATE.CLOSE_ARRAY);
              this.state = STATE.VALUE;
            } else if (token === TOKEN.CLOSED_BRACKET) {
              this.currentPath.pop(); // array is over
              this.state = this._popState();
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

  //@ts-check

  /**
   * @typedef {import("../types/baseTypes").JSONSegmentPathType} JSONSegmentPathType
   * @typedef {import("../types/baseTypes").JSONValueType} JSONValueType
   * @typedef {import("../types/baseTypes").JSONPathType} JSONPathType
   */

  /**
   * @package
   * @private
   * @param {JSONSegmentPathType} pathSegment
   * @returns {{}|[]}
   */
  function initObject(pathSegment) {
    return typeof pathSegment === "number" && pathSegment >= 0 ? [] : {}
  }

  /**
   * Convert a sequence to a js object
   */
  class SequenceToObject {
    /**
     * Convert a sequence to a js object
     * @param {Object} options
     * @param {boolean} [options.compactArrays=false] - if true ignore array index and generates arrays without gaps
     */
    constructor(options = {}) {
      const { compactArrays } = options;
      this.object = undefined;
      this.compactArrays = compactArrays ?? false;

      this.lastArray = undefined;
      this.lastArrayIndex = undefined;
    }

    /**
     * @package
     * @private
     * @param {JSONSegmentPathType} pathSegment
     * @param {JSONValueType} currentObject
     * @returns {JSONSegmentPathType}
     */
    _calculateRealIndex(pathSegment, currentObject) {
      if (typeof pathSegment === "string" || !this.compactArrays) {
        return pathSegment
      }
      if (Array.isArray(currentObject)) {
        // copy values locally
        const lastArray = this.lastArray;
        const lastArrayIndex = this.lastArrayIndex;
        // update with new values
        this.lastArray = currentObject;
        this.lastArrayIndex = pathSegment;
        if (currentObject === lastArray && lastArrayIndex === pathSegment) {
          return currentObject.length - 1
        }
        return currentObject.length
      }
      return 0
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
     * @param {JSONPathType} path - an array of path segments
     * @param {JSONValueType} value - the value corresponding to the path
     * @returns {void}
     */
    add(path, value) {
      if (path.length === 0) {
        this.object = value;
        return
      }
      if (this.object === undefined) {
        this.object = initObject(path[0]);
      }
      let currentObject = this.object;
      for (let i = 0; i < path.length - 1; i++) {
        // ignoring type errors here:
        // if path is inconsistent with data, it should throw an exception
        const currentPathSegment = this._calculateRealIndex(
          path[i],
          currentObject,
        );
        const nextPathSegment = path[i + 1];
        // @ts-ignore
        if (currentObject[currentPathSegment] === undefined) {
          // @ts-ignore
          currentObject[currentPathSegment] = initObject(nextPathSegment);
        }
        // @ts-ignore
        currentObject = currentObject[currentPathSegment];
      }
      // @ts-ignore
      const currentPathSegment = this._calculateRealIndex(
        path[path.length - 1],
        currentObject,
      );
      // @ts-ignore
      currentObject[currentPathSegment] = value;
    }
  }

  const formElement = document.querySelector("form");
  const dataElement = document.querySelector("#data");
  const indexElement = document.querySelector("#index");
  const queryElement = document.querySelector("#query");
  const filenameElement = document.querySelector("#filename");

  async function fetchIndex(filename, index) {
    const indexFilename = `index_${filename}`;
    const controller = new AbortController();
    const signal = controller.signal;

    let response = await fetch(indexFilename, { signal });
    const readable = response.body;
    const parser = new StreamToSequence({
      includes: `${index}`,
      maxDepth: 1,
    });
    const builder = new SequenceToObject({ compactArrays: true });
    for await (const chunk of readable) {
      if (parser.isExhausted()) break
      for (const [path, value] of parser.iter(chunk)) {
        builder.add(path, value);
      }
    }
    controller.abort();

    return builder.object[0]
  }

  async function fetchRecord(filename, index, query) {
    const [startByte, endByte] = await fetchIndex(filename, index);
    const controller = new AbortController();
    const signal = controller.signal;

    let response = await fetch(filename, {
      signal,
      headers: {
        Range: `bytes=${startByte}-${endByte - 1}`,
      },
    });
    const readable = response.body;
    const options = query ? { includes: query } : undefined;
    const parser = new StreamToSequence(options);

    const builder = new SequenceToObject({ compactArrays: true });
    for await (const chunk of readable) {
      if (parser.isExhausted()) break
      for (const [path, value] of parser.iter(chunk)) {
        builder.add(path, value);
      }
    }
    controller.abort();

    return builder.object
  }

  formElement.addEventListener("submit", (e) => {
    e.preventDefault();
    const filename = filenameElement.value;
    const index = parseInt(indexElement.value, 10);
    const queryRaw = queryElement.value.trim();
    const query = queryRaw === "" ? null : queryRaw;

    fetchRecord(filename, index, query).then((json) => {
      dataElement.innerHTML = JSON.stringify(json, undefined, 2);
    });
  });

})();
