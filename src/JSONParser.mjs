// https://github.com/dscape/clarinet/blob/master/clarinet.js

let S = 0
const STATE = {
  BEGIN: S++,
  VALUE: S++, // general stuff
  OPEN_OBJECT: S++, // {
  CLOSE_OBJECT: S++, // }
  OPEN_ARRAY: S++, // [
  CLOSE_ARRAY: S++, // ]
  TEXT_ESCAPE: S++, // \ stuff
  STRING: S++, // ""
  BACKSLASH: S++,
  END: S++, // No more stack
  OPEN_KEY: S++, // , "a"
  CLOSE_KEY: S++, // :
  TRUE: S++, // r
  TRUE2: S++, // u
  TRUE3: S++, // e
  FALSE: S++, // a
  FALSE2: S++, // l
  FALSE3: S++, // s
  FALSE4: S++, // e
  NULL: S++, // u
  NULL2: S++, // l
  NULL3: S++, // l
  NUMBER_DECIMAL_POINT: S++, // .
  NUMBER_DIGIT: S++, // [0-9]
}

function isWhitespace(c) {
  return c === "\r" || c === "\n" || c === " " || c === "\t"
}

export default class JSONParser {
  constructor() {
    this.state = STATE.BEGIN
    this.stack = []
    this.numberNode = ""
    this.textNode = ""
    // this.remainingStr = ""
    this.currentPath = []
  }

  *parse(str) {
    for (const char of str) {
      switch (this.state) {
        case STATE.BEGIN: // TODO: This should accept regular value (STATE.VALUE)
          if (char === "{") {
            yield [this.currentPath, {}]
            this.state = STATE.OPEN_OBJECT
          } else if (char === "[") {
            yield [this.currentPath, []]
            this.state = STATE.OPEN_ARRAY
          } else if (!isWhitespace(char))
            throw new Error("Non-whitespace before {[.")
          continue

        case STATE.OPEN_KEY:
        case STATE.OPEN_OBJECT:
          if (isWhitespace(char)) continue
          if (this.state === STATE.OPEN_KEY) this.stack.push(STATE.CLOSE_KEY)
          else {
            if (char === "}") {
              this.currentPath.pop()
              this.state = this.stack.pop() || STATE.VALUE
              continue
            } else this.stack.push(STATE.CLOSE_OBJECT)
          }
          if (char === '"') this.state = STATE.STRING
          else throw new Error('Malformed object key should start with "')
          continue

        case STATE.CLOSE_KEY:
        case STATE.CLOSE_OBJECT:
          if (isWhitespace(char)) continue
          // var event = this.state === STATE.CLOSE_KEY ? "key" : "object"
          if (char === ":") {
            if (this.state === STATE.CLOSE_OBJECT) {
              this.stack.push(STATE.CLOSE_OBJECT)
              // closeValue(parser, "onopenobject")
            } else {
              // closeValue(parser, "onkey")
            }
            this.state = STATE.VALUE
          } else if (char === "}") {
            // emitNode(parser, "oncloseobject")
            this.state = this.stack.pop() || STATE.VALUE
          } else if (char === ",") {
            if (this.state === STATE.CLOSE_OBJECT)
              this.stack.push(STATE.CLOSE_OBJECT)
            // closeValue(parser)
            this.state = STATE.OPEN_KEY
          } else throw new Error("Bad object")
          continue

        case STATE.OPEN_ARRAY: // after an array there always a value
        case STATE.VALUE:
          if (isWhitespace(char)) continue
          if (this.state === STATE.OPEN_ARRAY) {
            emit(parser, "onopenarray")
            this.state = STATE.VALUE
            if (char === "]") {
              emit(parser, "onclosearray")
              this.state = this.stack.pop() || STATE.VALUE
              continue
            } else {
              this.stack.push(STATE.CLOSE_ARRAY)
            }
          }
          if (char === '"') this.state = STATE.STRING
          else if (char === "{") this.state = STATE.OPEN_OBJECT
          else if (char === "[") this.state = STATE.OPEN_ARRAY
          else if (char === "t") this.state = STATE.TRUE
          else if (char === "f") this.state = STATE.FALSE
          else if (char === "n") this.state = STATE.NULL
          else if (char === "-") {
            // keep and continue
            this.numberNode += "-"
          } else if ("0" <= char && char <= "9") {
            this.numberNode += char
            this.state = STATE.NUMBER_DIGIT
          } else throw new Error("Bad value")
          continue

        case STATE.CLOSE_ARRAY:
          if (char === ",") {
            this.stack.push(STATE.CLOSE_ARRAY)
            // closeValue(parser, "onvalue")
            this.state = STATE.VALUE
          } else if (char === "]") {
            // emitNode(parser, "onclosearray")
            this.state = this.stack.pop() || STATE.VALUE
          } else if (isWhitespace(char)) continue
          else throw new Error("Bad array")
          continue

        case STATE.STRING:
          if (this.textNode === undefined) {
            this.textNode = ""
          }

          var starti = i - 1,
            slashed = parser.slashed

          while (true) {
            if (char === '"' && !slashed) {
              this.state = this.stack.pop() || STATE.VALUE
              this.textNode += chunk.substring(starti, i - 1)
              parser.position += i - 1 - starti
              break
            }
            if (char === "\\" && !slashed) {
              slashed = true
              this.textNode += chunk.substring(starti, i - 1)
              parser.position += i - 1 - starti
              c = chunk.charCodeAt(i++)
              parser.position++
              if (!c) break
            }
            if (slashed) {
              slashed = false
              if (c === "n") {
                this.textNode += "\n"
              } else if (char === "r") {
                this.textNode += "\r"
              } else if (char === "t") {
                this.textNode += "\t"
              } else if (char === "f") {
                this.textNode += "\f"
              } else if (char === "b") {
                this.textNode += "\b"
              } else if (char === "u") {
                // \uxxxx. meh!
                unicodeI = 1
                parser.unicodeS = ""
              } else {
                this.textNode += char
              }
              char = chunk.charCodeAt(i++)
              parser.position++
              starti = i - 1
              if (!char) break
              else continue
            }

            stringTokenPattern.lastIndex = i
            var reResult = stringTokenPattern.exec(chunk)
            if (reResult === null) {
              i = chunk.length + 1
              this.textNode += chunk.substring(starti, i - 1)
              parser.position += i - 1 - starti
              break
            }
            i = reResult.index + 1
            c = chunk.charCodeAt(reResult.index)
            if (!c) {
              this.textNode += chunk.substring(starti, i - 1)
              parser.position += i - 1 - starti
              break
            }
          }
          parser.slashed = slashed
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
            emit(parser, "onvalue", true)
            this.state = this.stack.pop() || STATE.VALUE
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
            emit(parser, "onvalue", false)
            this.state = this.stack.pop() || STATE.VALUE
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
            emit(parser, "onvalue", null)
            this.state = this.stack.pop() || STATE.VALUE
          } else throw new Error("Invalid null started with nul" + c)
          continue

        case STATE.NUMBER_DECIMAL_POINT:
          if (char === ".") {
            this.numberNode += "."
            this.state = STATE.NUMBER_DIGIT
          } else throw new Error("Leading zero not followed by .")
          continue

        case STATE.NUMBER_DIGIT:
          if ("0" <= char && char <= "9") this.numberNode += char
          else if (char === ".") {
            if (this.numberNode.indexOf(".") !== -1)
              throw new Error("Invalid number has two dots")
            this.numberNode += "."
          } else if (char === "e" || char === "E") {
            if (
              this.numberNode.indexOf("e") !== -1 ||
              this.numberNode.indexOf("E") !== -1
            )
              throw new Error("Invalid number has two exponential")
            this.numberNode += "e"
          } else if (char === "+" || char === "-") {
            if (!(p === "e" || p === "E"))
              throw new Error("Invalid symbol in number")
            this.numberNode += char
          } else {
            closeNumber(parser) //parseFloat(parser.numberNode)
            i-- // go back one
            lockIncrements = true // do not apply increments for a single cycle
            this.state = this.stack.pop() || STATE.VALUE
          }
          continue

        default:
          throw new Error("Unknown state: " + this.state)
      }
    }
  }
}
