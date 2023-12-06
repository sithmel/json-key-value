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
 * Enum for parser state
 * @readonly
 * @enum {string}
 */
const STATE = {
  VALUE: "VALUE", // general stuff
  OPEN_OBJECT: "OPEN_OBJECT", // {
  CLOSE_OBJECT: "CLOSE_OBJECT", // }
  OPEN_ARRAY: "OPEN_ARRAY", // [
  CLOSE_ARRAY: "CLOSE_ARRAY", // ]
  OPEN_KEY: "OPEN_KEY", // , "a"
  CLOSE_KEY: "CLOSE_KEY", // :
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
  NUMBER_DECIMAL: "NUMBER_DECIMAL", // .
  NUMBER_EXPONENT_SIGN: "NUMBER_EXPONENT_SIGN", // e[+-]
  NUMBER_EXPONENT_NUMBER: "NUMBER_EXPONENT_NUMBER", // e10
  STRING: "STRING", // ""
  STRING_SLASH_CHAR: "STRING_SLASH_CHAR", // "\"
  STRING_UNICODE_CHAR: "STRING_UNICODE_CHAR", // "\u"
  END: "END", // last state
}

/**
 * Check if there is a white space
 * @param {string} c
 * @returns {boolean}
 */
function isWhitespace(c) {
  return c === "\r" || c === "\n" || c === " " || c === "\t"
}

export default class JSONParser {
  constructor() {
    this.state = STATE.VALUE
    /** @type {Array<STATE>} */
    this.stateStack = [STATE.END]
    this.char = ""
    /** @type {import("../types/baseTypes").JSONPathType} */
    this.currentPath = [] // a combination of strings (object keys) and numbers (array index)
    this.stringBuffer = "" // this stores strings temporarily (keys and values)
    this.unicodeBuffer = "" // this stores unicode codes (\uxxx)
  }

  /**
   * add another segment to the path
   * @param {string|number} segment
   */
  pushPathSegment(segment) {
    this.currentPath = [...this.currentPath, segment]
  }

  /**
   * remove a segment from the path
   * @returns {string|number}
   */
  popPathSegment() {
    const lastElement = this.currentPath[this.currentPath.length - 1]
    this.currentPath = this.currentPath.slice(0, -1)
    return lastElement
  }

  /**
   * add another segment to the path
   * @param {STATE} state
   */
  pushState(state) {
    this.stateStack.push(state)
  }

  /**
   * pops the parser state
   * @returns {string}
   */
  popState() {
    const state = this.stateStack.pop()
    if (state == null) {
      throw new Error("Invalid state")
    }
    return state
  }

  /**
   * Check if there is a white space
   * @returns {boolean}
   */
  isFinished() {
    return this.state === STATE.END
  }

  /**
   * parse a json or json fragment
   * @param {string} str
   * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
   */
  *parse(str) {
    for (let index = 0; index < str.length; index++) {
      this.char = str[index]
      // console.log(this.state, this.stateStack, this.char)
      switch (this.state) {
        case STATE.END: // last possible state
          if (isWhitespace(this.char)) continue
          throw new ParsingError("Malformed JSON", index)

        case STATE.OPEN_KEY: // after the "," in an object
          if (isWhitespace(this.char)) continue
          if (this.char === '"') {
            this.pushState(STATE.CLOSE_KEY)
            this.state = STATE.STRING
            this.stringBuffer = ""
          } else {
            throw new ParsingError(
              'Malformed object key should start with "',
              index,
            )
          }
          continue

        case STATE.OPEN_OBJECT: // after the "{" in an object
          if (isWhitespace(this.char)) continue
          if (this.char === "}") {
            this.state = this.popState()
            continue
          }
          if (this.char === '"') {
            this.pushState(STATE.CLOSE_KEY)
            this.state = STATE.STRING
            this.stringBuffer = ""
          } else {
            throw new ParsingError(
              'Malformed object key should start with "',
              index,
            )
          }
          continue

        case STATE.CLOSE_KEY: // after the key is over
          if (isWhitespace(this.char)) continue
          if (this.char === ":") {
            this.pushPathSegment(this.stringBuffer)
            this.pushState(STATE.CLOSE_OBJECT)
            this.state = STATE.VALUE
          } else {
            throw new ParsingError("Bad object", index)
          }
          continue

        case STATE.CLOSE_OBJECT: // after the value is parsed and the object can be closed
          if (isWhitespace(this.char)) continue
          if (this.char === "}") {
            this.popPathSegment()
            this.state = this.popState()
          } else if (this.char === ",") {
            this.popPathSegment()
            this.state = STATE.OPEN_KEY
          } else {
            throw new ParsingError("Bad object", index)
          }
          continue

        case STATE.OPEN_ARRAY: // after an array is open
          if (isWhitespace(this.char)) continue
          this.pushPathSegment(0)
          if (this.char === "]") {
            this.popPathSegment()
            this.state = this.popState()
            continue
          } else {
            this.state = STATE.VALUE
            this.pushState(STATE.CLOSE_ARRAY)
            index-- // after an array there always a value straight away
          }
          continue

        case STATE.VALUE: // any value
          if (isWhitespace(this.char)) continue
          if (this.char === '"') {
            this.state = STATE.STRING
            this.stringBuffer = ""
          } else if (this.char === "{") {
            yield [this.currentPath, {}]
            this.state = STATE.OPEN_OBJECT
          } else if (this.char === "[") {
            yield [this.currentPath, []]
            this.state = STATE.OPEN_ARRAY
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
          } else {
            throw new ParsingError("Bad value", index)
          }
          continue

        case STATE.CLOSE_ARRAY: // array ready to end, or restart after the comma
          if (isWhitespace(this.char)) continue
          if (this.char === ",") {
            const formerIndex = this.popPathSegment()
            if (typeof formerIndex !== "number") {
              throw new ParsingError("Array index should be a number", index)
            }
            this.pushPathSegment(formerIndex + 1) // next item in the array
            this.pushState(STATE.CLOSE_ARRAY)
            this.state = STATE.VALUE
          } else if (this.char === "]") {
            this.popPathSegment() // array is over
            this.state = this.popState()
          } else {
            throw new ParsingError("Bad array", index)
          }
          continue

        case STATE.STRING: // a string (either value or key)
          if (this.char === '"') {
            this.state = this.popState()
            if (this.state !== STATE.CLOSE_KEY) {
              yield [this.currentPath, this.stringBuffer]
            }
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
            yield [this.currentPath, true]
            this.state = this.popState()
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
            yield [this.currentPath, false]
            this.state = this.popState()
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
            yield [this.currentPath, null]
            this.state = this.popState()
          } else
            throw new ParsingError(
              "Invalid null started with nul" + this.char,
              index,
            )
          continue

        case STATE.NUMBER: // a number
          if ("0" <= this.char && this.char <= "9") {
            this.stringBuffer += this.char
            if (
              (this.stringBuffer.length === 2 &&
                this.stringBuffer[0] === "0") ||
              (this.stringBuffer.length === 3 &&
                this.stringBuffer.slice(0, 2) === "-0")
            ) {
              throw new ParsingError(
                "Leading zeros are not allowed in numbers",
                index,
              )
            }
          } else if (this.char === ".") {
            if (this.stringBuffer === "-") {
              throw new ParsingError("Missing whole number", index)
            }
            this.stringBuffer += "."
            this.state = STATE.NUMBER_DECIMAL
          } else if (this.char === "e" || this.char === "E") {
            if (this.stringBuffer === "-") {
              throw new ParsingError("Missing whole number", index)
            }
            this.stringBuffer += "e"
            this.state = STATE.NUMBER_EXPONENT_SIGN
          } else if (
            isWhitespace(this.char) ||
            this.char === "," ||
            this.char === "]" ||
            this.char === "}"
          ) {
            if (this.stringBuffer === "-") {
              throw new ParsingError("Missing whole number", index)
            }
            yield [this.currentPath, parseFloat(this.stringBuffer)]
            this.state = this.popState()
            index--
          } else {
            throw new ParsingError(
              `Not a valid this.character inside a number ${this.char}`,
              index,
            )
          }
          continue

        case STATE.NUMBER_DECIMAL:
          if ("0" <= this.char && this.char <= "9") {
            this.stringBuffer += this.char
          } else if (this.char === "e" || this.char === "E") {
            if (this.stringBuffer[this.stringBuffer.length - 1] === ".") {
              throw new ParsingError(
                `Not a valid this.character inside a number ${this.char}`,
                index,
              )
            }
            this.stringBuffer += "e"
            this.state = STATE.NUMBER_EXPONENT_SIGN
          } else if (
            isWhitespace(this.char) ||
            this.char === "," ||
            this.char === "]" ||
            this.char === "}"
          ) {
            if (this.stringBuffer[this.stringBuffer.length - 1] === ".") {
              throw new ParsingError(
                `Not a valid this.character inside a number ${this.char}`,
                index,
              )
            }
            yield [this.currentPath, parseFloat(this.stringBuffer)]
            this.state = this.popState()
            index--
          } else {
            throw new ParsingError(
              `Not a valid this.character inside a number ${this.char}`,
              index,
            )
          }
          continue

        case STATE.NUMBER_EXPONENT_SIGN:
          if ("0" <= this.char && this.char <= "9") {
            this.stringBuffer += this.char
            this.state = STATE.NUMBER_EXPONENT_NUMBER
          } else if (this.char === "+" || this.char === "-") {
            this.stringBuffer += this.char
            this.state = STATE.NUMBER_EXPONENT_NUMBER
          } else if (
            isWhitespace(this.char) ||
            this.char === "," ||
            this.char === "]" ||
            this.char === "}"
          ) {
            yield [this.currentPath, parseFloat(this.stringBuffer)]
            this.state = this.popState()
            index--
          } else {
            throw new ParsingError(
              `Not a valid this.character inside a number ${this.char}`,
              index,
            )
          }
          continue

        case STATE.NUMBER_EXPONENT_NUMBER:
          if ("0" <= this.char && this.char <= "9") {
            this.stringBuffer += this.char
          } else if (
            isWhitespace(this.char) ||
            this.char === "," ||
            this.char === "]" ||
            this.char === "}"
          ) {
            const lastChar = this.stringBuffer[this.stringBuffer.length - 1]
            if (lastChar === "+" || lastChar === "-") {
              throw new ParsingError(
                `Not a valid this.character inside a number ${this.char}`,
                index,
              )
            }

            yield [this.currentPath, parseFloat(this.stringBuffer)]
            this.state = this.popState()
            index--
          } else {
            throw new ParsingError(
              `Not a valid this.character inside a number ${this.char}`,
              index,
            )
          }
          continue

        default:
          throw new ParsingError("Unknown state: " + this.state, index)
      }
    }
  }
}
