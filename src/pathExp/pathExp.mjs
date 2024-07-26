//@ts-check

import {
  ParsingError,
  isWhitespace,
  strToMatchSegment,
  match,
} from "../utils.mjs"

/*
Syntax:
Array index:
- 2
Object key:
- "key": any character using string escaping
- key  : only letters and number
Slice:
- 1:3
- :3
- 1:
- : 

Fragment separators:
"hello".1."world"
"hello"[1].world[2:3]

Separator:
"hello".1,"world".2
*/

/**
 * Enum for parser state
 * @readonly
 * @enum {string}
 */
const STATE = {
  START_PATH_EXPRESSION: "START_PATH_EXPRESSION", // (
  CONTINUE_PATH_EXPRESSION: "CONTINUE_PATH_EXPRESSION", // (
  END_PATH_EXPRESSION: "END_PATH_EXPRESSION",
  FRAGMENT: "FRAGMENT", // "hello" hello 1 1:2
  IN_BRACKET_FRAGMENT: "IN_BRACKET_FRAGMENT", // ["hello"] [hello] [1] [1:2]
  IN_BRACKET_FRAGMENT_END: "IN_BRACKET_FRAGMENT_END", // ["hello"] [hello] [1] [1:2]
  STRING: "STRING", // "hello"
  STRING_ESCAPE: "STRING_ESCAPE", // "hello"
  NON_STRING: "NON_STRING", // hello 1 1:2
}

const NON_STRING_RE = /^[0-9a-zA-Z_:]$/

/**
 * @package
 * @param {string} pathStr
 * @returns {Array<import("../../types/baseTypes").MatchPathType>}
 */
function pathExpToMatcherData(pathStr) {
  const tokens = pathStr.split("")
  const stateStack = []
  /** @type {Array<import("../../types/baseTypes").MatchPathType>} */
  let matcherPaths = []
  /** @type {import("../../types/baseTypes").MatchPathType} */
  let currentMatcherPath = []
  let fragmentBuffer = ""
  let state = STATE.START_PATH_EXPRESSION
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    switch (state) {
      case STATE.START_PATH_EXPRESSION:
        if (isWhitespace(token)) continue
        if (token === ".") {
          throw new ParsingError("Expression cannot begin with a dot", index)
        }
        if (NON_STRING_RE.test(token)) {
          state = STATE.FRAGMENT
          index--
          continue
        }
      // this flows to the next state
      case STATE.CONTINUE_PATH_EXPRESSION:
        if (token === ".") {
          state = STATE.FRAGMENT
          continue
        }
        if (token === "[") {
          state = STATE.IN_BRACKET_FRAGMENT
          continue
        }
        if (token === ",") {
          matcherPaths.push(currentMatcherPath)
          currentMatcherPath = []
          state = STATE.START_PATH_EXPRESSION
          continue
        }
        if (token === '"') {
          state = STATE.FRAGMENT
          index--
          continue
        }
        throw new ParsingError("Malformed Expression", index)
      case STATE.IN_BRACKET_FRAGMENT:
        stateStack.push(STATE.IN_BRACKET_FRAGMENT_END)
        if (token === '"') {
          state = STATE.STRING
          fragmentBuffer = ""
          continue
        }
        if (NON_STRING_RE.test(token)) {
          state = STATE.NON_STRING
          fragmentBuffer = ""
          index--
          continue
        }
        throw new ParsingError(
          `Bracket fragment cannot start with ${token}`,
          index,
        )
      case STATE.IN_BRACKET_FRAGMENT_END:
        if (token === "]") {
          state = STATE.CONTINUE_PATH_EXPRESSION
          continue
        }
        throw new ParsingError('Bracket fragment should end with "]"', index)

      case STATE.FRAGMENT:
        stateStack.push(STATE.CONTINUE_PATH_EXPRESSION)
        if (token === '"') {
          state = STATE.STRING
          fragmentBuffer = ""
          continue
        }
        if (NON_STRING_RE.test(token)) {
          state = STATE.NON_STRING
          fragmentBuffer = ""
          index--
          continue
        }
        throw new ParsingError(`Fragment cannot start with ${token}`, index)

      case STATE.NON_STRING:
        if (NON_STRING_RE.test(token)) {
          fragmentBuffer += token
          continue
        }
        currentMatcherPath = [
          ...currentMatcherPath,
          strToMatchSegment(fragmentBuffer, index),
        ]
        fragmentBuffer = ""
        state = stateStack.pop() ?? STATE.CONTINUE_PATH_EXPRESSION
        index--
        continue

      case STATE.STRING:
        if (token === "\\") {
          fragmentBuffer += token
          state = STATE.STRING_ESCAPE
        }
        if (token === '"') {
          let fragment
          try {
            fragment = JSON.parse(`"${fragmentBuffer}"`)
          } catch (_e) {
            throw new ParsingError(
              `Malformed string "${fragmentBuffer}"`,
              index,
            )
          }
          currentMatcherPath = [...currentMatcherPath, match(fragment)]
          fragmentBuffer = ""
          state = stateStack.pop() ?? STATE.CONTINUE_PATH_EXPRESSION
          continue
        }
        fragmentBuffer += token
        continue
      case STATE.STRING_ESCAPE:
        fragmentBuffer += token
        state = STATE.STRING
        continue
      default:
        throw new ParsingError("Unknown state: " + state, index)
    }
  }
  if (fragmentBuffer) {
    currentMatcherPath = [
      ...currentMatcherPath,
      strToMatchSegment(fragmentBuffer, tokens.length),
    ]
  }
  matcherPaths.push(currentMatcherPath)
  return matcherPaths
}

/**
 * Convert a path expression to array
 * @param {Array<import("../../types/baseTypes").MatchPathType> | string | null} paths
 * @returns {Array<import("../../types/baseTypes").MatchPathType>}
 */
export function stringToPathExp(paths) {
  if (paths === null) return []
  if (typeof paths === "string") return pathExpToMatcherData(paths)
  return paths
}

/**
 * Convert a path expression to string
 * @param {Array<import("../../types/baseTypes").MatchPathType> | string | null} paths
 * @returns {string}
 */
export function pathExpToString(paths) {
  if (paths === null) return ""
  if (typeof paths === "string") return paths
  return paths
    .map((path) => {
      return path
        .map((pathSegment) => {
          if (pathSegment.type === "slice") {
            const sliceFrom =
              pathSegment.sliceFrom === 0
                ? ""
                : pathSegment.sliceFrom.toString()
            const sliceTo =
              pathSegment.sliceTo === Infinity
                ? ""
                : pathSegment.sliceTo.toString()
            return `${sliceFrom}:${sliceTo}`
          }
          return JSON.stringify(pathSegment.match) // match
        })
        .join(".")
    })
    .join(",")
}
