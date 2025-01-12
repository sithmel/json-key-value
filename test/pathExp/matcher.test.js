//@ts-check
import assert from "assert"
import pkg from "zunit"

import {
  AnyMatcher,
  SegmentMatcher,
  SliceMatcher,
  MatcherContainer,
} from "../../src/pathExp/matcher.js"

import { CachedStringBuffer, Path } from "../../src/pathExp/path.js"

const { describe, odescribe, it, oit, beforeEach } = pkg

const encoder = new TextEncoder()
const encodePath = (path) => {
  const obj = new Path()
  obj.array = path.map((v) =>
    typeof v === "string"
      ? new CachedStringBuffer(encoder.encode(JSON.stringify(v)))
      : v,
  )
  return obj
}

describe("Matchers", () => {
  let matcher
  describe("AnyMatcher", () => {
    beforeEach(() => {
      matcher = new AnyMatcher([])
    })
    it("counts maxlength", () => {
      assert.equal(matcher.maxLength(), 1)
    })
    it("always matches", () => {
      assert.equal(matcher.doesMatch(encodePath(["test"])), true)
      assert.equal(matcher.isExhausted(), false)
    })
    it("does not matches empty path", () => {
      assert.equal(matcher.doesMatch(encodePath([])), false)
      assert.equal(matcher.isExhausted(), false)
    })
    it("stringifies", () => {
      assert.equal(matcher.stringify(), "*")
    })
  })
  describe("SegmentMatcher", () => {
    beforeEach(() => {
      matcher = new SegmentMatcher(1, [])
    })
    it("does not match", () => {
      assert.equal(matcher.doesMatch(encodePath([2])), false)
      assert.equal(matcher.isExhausted(), false)
    })
    it("does match", () => {
      assert.equal(matcher.doesMatch(encodePath([1, 2])), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath([2, 2])), false)
      assert.equal(matcher.isExhausted(), true)
    })
    it("stringifies numbers", () => {
      assert.equal(matcher.stringify(), "1")
    })
    it("stringifies strings", () => {
      matcher = new SegmentMatcher("A")
      assert.equal(matcher.stringify(), "'A'")

      matcher = new SegmentMatcher("hello'world")
      assert.equal(matcher.stringify(), `"hello'world"`)

      matcher = new SegmentMatcher('hello"world')
      assert.equal(matcher.stringify(), `'hello"world'`)
    })
  })
  describe("SliceMatcher", () => {
    beforeEach(() => {
      matcher = new SliceMatcher({ min: 1, max: 3 }, [])
    })
    it("does not match with strings", () => {
      assert.equal(matcher.doesMatch(encodePath(["hello"])), false)
      assert.equal(matcher.isExhausted(), false)
    })
    it("does not match", () => {
      assert.equal(matcher.doesMatch(encodePath([0])), false)
      assert.equal(matcher.isExhausted(), false)
    })
    it("does match", () => {
      assert.equal(matcher.doesMatch(encodePath([1, 2])), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath([2, 2])), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath([3, 2])), false)
      assert.equal(matcher.isExhausted(), true)
    })
    it("stringifies slices", () => {
      assert.equal(matcher.stringify(), "1..3")
    })
    it("stringifies slices 2", () => {
      matcher = new SliceMatcher({ min: 0, max: 3 }, [])
      assert.equal(matcher.stringify(), "..3")
      matcher = new SliceMatcher({ min: 1, max: Infinity }, [])
      assert.equal(matcher.stringify(), "1..")
    })
  })
  describe("Combine matchers 1", () => {
    beforeEach(() => {
      matcher = new MatcherContainer([
        new SegmentMatcher("A", [
          new SegmentMatcher("B", [
            new SegmentMatcher("C"),
            new SegmentMatcher("D"),
          ]),
          new SegmentMatcher("E"),
        ]),
        new SegmentMatcher("F"),
      ])
    })
    it("counts maxlength", () => {
      assert.equal(matcher.maxLength(), 3)
    })

    it("does not match", () => {
      assert.equal(matcher.doesMatch(encodePath([1, 2])), false)
      assert.equal(matcher.isExhausted(), false)
    })
    it("matches", () => {
      assert.equal(matcher.doesMatch(encodePath(["F", 2])), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", 2])), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", "B"])), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", "D"])), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", "E", "Y"])), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", "X", "Y"])), false)
      assert.equal(matcher.isExhausted(), true)
    })
    it("stringifies", () => {
      assert.equal(matcher.stringify(), "'A'('B'('C' 'D') 'E') 'F'")
    })
    it("stringifies pretty", () => {
      assert.equal(
        matcher.stringify("  "),
        `'A'(
  'B'(
    'C'
    'D'
  )
  'E'
)
'F'`,
      )
    })
  })
  describe("Combine matchers 2", () => {
    beforeEach(() => {
      matcher = new MatcherContainer([
        new SegmentMatcher("A", [
          new AnyMatcher([new SegmentMatcher("C"), new SegmentMatcher("D")]),
        ]),
      ])
    })
    it("counts maxlength", () => {
      assert.equal(matcher.maxLength(), 3)
    })

    it("matches", () => {
      assert.equal(matcher.doesMatch(encodePath(["Z", 2])), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", "B"])), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", "B", "C"])), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", "B", "Y"])), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", "B", "D"])), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["A", "X", "C"])), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(encodePath(["B", "X"])), false)
      assert.equal(matcher.isExhausted(), true)
    })
    it("stringifies slices", () => {
      assert.equal(matcher.stringify(), "'A'(*('C' 'D'))")
    })
  })
})
