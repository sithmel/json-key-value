//@ts-check

import { ParsingError, isWhitespace } from "../utils.mjs"

import {
  AnyMatcher,
  SegmentMatcher,
  SliceMatcher,
  MatcherContainer,
} from "./matcher.mjs"

const STATE = {
  VALUE: "VALUE",
  STRING_SINGLE_QUOTE: "STRING_SINGLE_QUOTE",
  STRING_DOUBLE_QUOTE: "STRING_DOUBLE_QUOTE",
  NUMBER_OR_SLICE: "NUMBER_OR_SLICE",
}

/**
 * direct match of a number of a string
 * @param {string} str
 * @return {MatcherContainer}
 */
export default function pathExpParse(str) {
  str += " " // this simplifies parsing of numbers (the extra space act as a delimiter)
  const matcherStack = [new MatcherContainer()]
  const getLastMatcherChildren = () =>
    matcherStack[matcherStack.length - 1].matchers
  const pushMatcher = (newMatcher) => {
    const lastMatcherChildren = getLastMatcherChildren()
    lastMatcherChildren.push(newMatcher)
  }
  const addLastMatcherToStack = () => {
    const lastMatcherChildren = getLastMatcherChildren()
    matcherStack.push(lastMatcherChildren[lastMatcherChildren.length - 1])
  }
  const removeLastMatcherToStack = (index) => {
    matcherStack.pop()
    if (matcherStack.length === 0) {
      throw new ParsingError("Unpaired brackets: ", index)
    }
  }
  let state = STATE.VALUE
  let stringBuffer = ""
  for (let index = 0; index < str.length; index++) {
    const char = str[index]
    switch (state) {
      case STATE.VALUE:
        if (isWhitespace(char)) continue
        if (char === "{") {
          addLastMatcherToStack()
        } else if (char === "}") {
          removeLastMatcherToStack(index)
        } else if (char === "*") {
          pushMatcher(new AnyMatcher())
        } else if (char === '"') {
          state = STATE.STRING_DOUBLE_QUOTE
          stringBuffer = ""
        } else if (char === "'") {
          state = STATE.STRING_QUOTE
          stringBuffer = ""
        } else if (/[0-9\.]/.test(char)) {
          state = STATE.NUMBER_OR_SLICE
          stringBuffer = char
        } else {
          throw new ParsingError("Unknown token: " + char, index)
        }
        continue
      case STATE.STRING_QUOTE:
        if (char === "'") {
          pushMatcher(new SegmentMatcher(stringBuffer))
          state = STATE.VALUE
        } else {
          stringBuffer += char
        }
        continue
      case STATE.STRING_DOUBLE_QUOTE:
        if (char === '"') {
          pushMatcher(new SegmentMatcher(stringBuffer))
          state = STATE.VALUE
        } else {
          stringBuffer += char
        }
        continue

      case STATE.NUMBER_OR_SLICE:
        if (!/[0-9\.]/.test(char)) {
          if (stringBuffer.includes("..")) {
            const minAndMax = stringBuffer.split("..")
            if (minAndMax.length !== 2) {
              throw new ParsingError("Invalid slice: " + state, index)
            }
            const min = minAndMax[0].length !== 0 ? parseInt(minAndMax[0]) : 0
            const max =
              minAndMax[1].length !== 0 ? parseInt(minAndMax[1]) : Infinity
            pushMatcher(new SliceMatcher({ min, max }))
          } else if (/[0-9]+/.test(stringBuffer)) {
            pushMatcher(new SegmentMatcher(parseInt(stringBuffer)))
          } else {
            throw new ParsingError("Invalid index: " + state, index)
          }
          state = STATE.VALUE
          index--
        } else {
          stringBuffer += char
        }
        continue
      default:
        throw new ParsingError("Unknown state: " + state, index)
    }
  }
  return matcherStack[0]
}
