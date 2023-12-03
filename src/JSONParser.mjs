// https://github.com/dscape/clarinet/blob/master/clarinet.js

let stateCounter = 0
const STATE = {
  VALUE: stateCounter++, // general stuff
  OPEN_OBJECT: stateCounter++, // {
  CLOSE_OBJECT: stateCounter++, // }
  OPEN_ARRAY: stateCounter++, // [
  CLOSE_ARRAY: stateCounter++, // ]
  STRING: stateCounter++, // ""
  OPEN_KEY: stateCounter++, // , "a"
  CLOSE_KEY: stateCounter++, // :
  TRUE: stateCounter++, // r
  TRUE2: stateCounter++, // u
  TRUE3: stateCounter++, // e
  FALSE: stateCounter++, // a
  FALSE2: stateCounter++, // l
  FALSE3: stateCounter++, // s
  FALSE4: stateCounter++, // e
  NULL: stateCounter++, // u
  NULL2: stateCounter++, // l
  NULL3: stateCounter++, // l
  NUMBER: stateCounter++, // [0-9]
}

const STATE_STRING = {
  NEW_CHAR: stateCounter++,
  SLASH_CHAR: stateCounter++,
  UNICODE_CHAR: stateCounter++,
}

const STATE_NUMBER = {
  INTEGER: stateCounter++,
  DECIMAL: stateCounter++,
  EXPONENT_SIGN: stateCounter++,
  EXPONENT_NUMBER: stateCounter++,
}

function isWhitespace(c) {
  return c === "\r" || c === "\n" || c === " " || c === "\t"
}

export default class JSONParser {
  constructor() {
    this.state = STATE.VALUE
    this.stateStack = []
    this.currentPath = []
    this.resetStringBuffer()
  }

  resetStringBuffer() {
    this.stateString = STATE_STRING.NEW_CHAR
    this.unicodeBuffer = ""
    this.stringBuffer = "" // this stores strings temporarily (keys and values)
  }

  resetNumberBuffer() {
    this.stateNumber = STATE_NUMBER.INTEGER
    this.exponentBuffer = ""
    this.decimalBuffer = ""
    this.integerBuffer = ""
  }

  *parse(str) {
    for (const char of str) {
      if (
        this.state === STATE.VALUE ||
        this.state === STATE.OPEN_ARRAY ||
        this.state === STATE.CLOSE_ARRAY ||
        this.state === STATE.OPEN_OBJECT ||
        this.state === STATE.CLOSE_OBJECT ||
        this.state === STATE.OPEN_KEY ||
        this.state === STATE.CLOSE_KEY
      ) {
        if (isWhitespace(char)) continue
      }

      switch (this.state) {
        case STATE.OPEN_KEY:
          if (char === '"') {
            this.stateStack.push(STATE.CLOSE_KEY)
            this.resetStringBuffer()
            this.state = STATE.STRING
          } else {
            throw new Error('Malformed object key should start with "')
          }
          continue

        case STATE.OPEN_OBJECT:
          yield [this.currentPath, {}]
          if (char === "}") {
            this.currentPath.pop()
            this.state = this.stateStack.pop() || STATE.VALUE
            continue
          }
          if (char === '"') {
            this.stateStack.push(STATE.CLOSE_OBJECT)
            this.state = STATE.STRING
            this.resetStringBuffer()
          } else {
            throw new Error('Malformed object key should start with "')
          }
          continue

        case STATE.CLOSE_KEY:
          if (char === ":") {
            this.currentPath.push(this.stringBuffer)
            this.stringBuffer = ""
            this.state = STATE.VALUE
          } else if (char === "}") {
            this.currentPath.pop()
            this.state = this.stateStack.pop() || STATE.VALUE
          } else if (char === ",") {
            yield [this.currentPath, this.stringBuffer]
            this.stringBuffer = ""
            this.currentPath.pop()
            this.state = STATE.OPEN_KEY
          } else {
            throw new Error("Bad object")
          }
          continue

        case STATE.CLOSE_OBJECT:
          if (char === ":") {
            this.stateStack.push(STATE.CLOSE_OBJECT)
            this.state = STATE.VALUE
          } else if (char === "}") {
            this.currentPath.pop()
            this.state = this.stateStack.pop() || STATE.VALUE
          } else if (char === ",") {
            this.stateStack.push(STATE.CLOSE_OBJECT)
            yield [this.currentPath, this.stringBuffer]
            this.stringBuffer = ""
            this.currentPath.pop()
            this.state = STATE.OPEN_KEY
          } else {
            throw new Error("Bad object")
          }
          continue

        case STATE.OPEN_ARRAY: // after an array there always a value
          yield [this.currentPath, []]
          this.currentPath.push(0)
          if (char === "]") {
            this.currentPath.pop()
            this.state = this.stateStack.pop() || STATE.VALUE
            continue
          } else {
            this.state = STATE.VALUE
            this.stateStack.push(STATE.CLOSE_ARRAY)
          }
        // after an array there always a value
        case STATE.VALUE:
          if (char === '"') {
            this.state = STATE.STRING
            this.resetStringBuffer()
          } else if (char === "{") {
            this.state = STATE.OPEN_OBJECT
          } else if (char === "[") {
            this.state = STATE.OPEN_ARRAY
          } else if (char === "t") {
            this.state = STATE.TRUE
          } else if (char === "f") {
            this.state = STATE.FALSE
          } else if (char === "n") {
            this.state = STATE.NULL
          } else if (char === "-" || ("0" <= char && char <= "9")) {
            // keep and continue
            this.resetNumberBuffer()
            this.state = STATE.NUMBER
            this.integerBuffer += char
          } else {
            throw new Error("Bad value")
          }
          continue

        case STATE.CLOSE_ARRAY:
          if (char === ",") {
            this.currentPath.push(this.currentPath.pop() + 1) // next item in the array
            this.stateStack.push(STATE.CLOSE_ARRAY)
            // closeValue(parser, "onvalue")
            this.state = STATE.VALUE
          } else if (char === "]") {
            this.currentPath.pop() // array is over
            // emitNode(parser, "onclosearray")
            this.state = this.stateStack.pop() || STATE.VALUE
          } else {
            throw new Error("Bad array")
          }
          continue

        case STATE.STRING:
          switch (this.stateString) {
            case STATE_STRING.UNICODE_CHAR:
              this.unicodeBuffer += char
              const lowerChar = char.toLowercase()
              if (
                !("0" <= lowerChar && lowerChar <= "9") &&
                !("a" <= lowerChar && lowerChar <= "f")
              ) {
                throw new Error(`Bad unicode character ${this.unicodeBuffer}`)
              }
              if (this.unicodeBuffer.length === 4) {
                this.unicodeCharacter = false
                this.stringBuffer += String.fromCharCode(
                  parseInt(this.unicodeBuffer, 16),
                )
                this.unicodeBuffer = ""
              }
              continue
            case STATE_STRING.SLASH_CHAR:
              this.stateString = STATE_STRING.NEW_CHAR
              if (char === "n") {
                this.stringBuffer += "\n"
              } else if (char === "r") {
                this.stringBuffer += "\r"
              } else if (char === "t") {
                this.stringBuffer += "\t"
              } else if (char === "f") {
                this.stringBuffer += "\f"
              } else if (char === "b") {
                this.stringBuffer += "\b"
              } else if (char === "u") {
                this.stateString = STATE_STRING.UNICODE_CHAR
              } else {
                throw new Error(`Invalid slash code ${char}`)
              }
              continue
            case STATE_STRING.NEW_CHAR:
              if (char === '"') {
                this.state = this.stateStack.pop() || STATE.VALUE
              } else if (char === "\\") {
                this.stateString = STATE_STRING.SLASH_CHAR
              } else {
                if (
                  char === "\n" ||
                  char === "\r" ||
                  char === "\t" ||
                  char === "\f" ||
                  char === "\b"
                ) {
                  throw new Error(`Invalid slash code ${char}`)
                }
                this.stringBuffer += char
              }
          }
          continue

        case STATE.TRUE:
          if (char === "r") this.state = STATE.TRUE2
          else throw new Error("Invalid true started with t" + c)
          continue

        case STATE.TRUE2:
          if (char === "u") this.state = STATE.TRUE3
          else throw new Error("Invalid true started with tr" + c)
          continue

        case STATE.TRUE3:
          if (char === "e") {
            yield [this.currentPath, true]
            this.state = this.stateStack.pop() || STATE.VALUE
          } else throw new Error("Invalid true started with tru" + c)
          continue

        case STATE.FALSE:
          if (char === "a") this.state = STATE.FALSE2
          else throw new Error("Invalid false started with f" + c)
          continue

        case STATE.FALSE2:
          if (char === "l") this.state = STATE.FALSE3
          else throw new Error("Invalid false started with fa" + c)
          continue

        case STATE.FALSE3:
          if (char === "s") this.state = STATE.FALSE4
          else throw new Error("Invalid false started with fal" + c)
          continue

        case STATE.FALSE4:
          if (char === "e") {
            yield [this.currentPath, false]
            this.state = this.stateStack.pop() || STATE.VALUE
          } else throw new Error("Invalid false started with fals" + c)
          continue

        case STATE.NULL:
          if (char === "u") this.state = STATE.NULL2
          else throw new Error("Invalid null started with n" + c)
          continue

        case STATE.NULL2:
          if (char === "l") this.state = STATE.NULL3
          else throw new Error("Invalid null started with nu" + c)
          continue

        case STATE.NULL3:
          if (char === "l") {
            yield [this.currentPath, null]
            this.state = this.stateStack.pop() || STATE.VALUE
          } else throw new Error("Invalid null started with nul" + c)
          continue

        case STATE.NUMBER:
          switch (this.stateNumber) {
            case STATE_NUMBER.INTEGER:
              if ("0" <= char && char <= "9") {
                this.integerBuffer += char
                // check trailing 0
              } else if (char === ".") {
                // check integerBuffer === -
                this.decimalBuffer = "."
                this.stateNumber = STATE_NUMBER.DECIMAL
              } else if (char === "e" || char === "E") {
                // check integerBuffer === -
                this.exponentBufferBuffer = "e"
                this.stateNumber = STATE_NUMBER.EXPONENT_SIGN
              }
              throw new Error("")
              continue
            case STATE_NUMBER.DECIMAL:
              if ("0" <= char && char <= "9") {
                this.decimalBuffer += char
              } else if (char === "e" || char === "E") {
                // check decimalbuffer empty
                this.exponentBufferBuffer = "e"
                this.stateNumber = STATE_NUMBER.EXPONENT_SIGN
              }
              throw new Error("")
              continue
            case STATE_NUMBER.EXPONENT_SIGN:
              if ("0" <= char && char <= "9") {
                this.exponentBufferBuffer += char
                this.stateNumber = STATE_NUMBER.EXPONENT_NUMBER
              } else if (char === "+" || char === "-") {
                this.exponentBufferBuffer += char
                this.stateNumber = STATE_NUMBER.EXPONENT_NUMBER
              }
              throw new Error("")
              continue
            case STATE_NUMBER.EXPONENT_NUMBER:
              if ("0" <= char && char <= "9") {
                this.exponentBufferBuffer += char
              }
              throw new Error("")
              continue
          }
        // if ("0" <= char && char <= "9") {
        //   this.stringBuffer += char
        // } else if (char === ".") {
        //   if (this.stringBuffer.indexOf(".") !== -1)
        //     throw new Error("Invalid number has two dots")
        //   this.stringBuffer += "."
        // } else if (char === "e" || char === "E") {
        //   if (
        //     this.stringBuffer.indexOf("e") !== -1 ||
        //     this.stringBuffer.indexOf("E") !== -1
        //   )
        //     throw new Error("Invalid number has two exponential")
        //   this.stringBuffer += "e"
        // } else if (char === "+" || char === "-") {
        //   if (!(p === "e" || p === "E"))
        //     throw new Error("Invalid symbol in number")
        //   this.stringBuffer += char
        // } else {
        //   yield [this.currentPath, parseFloat(this.stringBuffer)]
        //   i-- // go back one
        //   lockIncrements = true // do not apply increments for a single cycle
        //   this.state = this.stateStack.pop() || STATE.VALUE
        // }
        // continue

        default:
          throw new Error("Unknown state: " + this.state)
      }
    }
  }
}
