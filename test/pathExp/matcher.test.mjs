//@ts-check
import assert from "assert"
import pkg from "zunit"

import {
  AnyMatcher,
  SegmentMatcher,
  SliceMatcher,
  MatcherContainer,
} from "../../src/pathExp/matcher.mjs"

const { describe, odescribe, it, oit, beforeEach } = pkg

describe("Matchers", () => {
  let matcher
  describe("AnyMatcher", () => {
    beforeEach(() => {
      matcher = new AnyMatcher([])
    })
    it("always matches", () => {
      assert.equal(matcher.doesMatch(["test"]), true)
      assert.equal(matcher.isExhausted(), false)
    })
    it("does not matches empty path", () => {
      assert.equal(matcher.doesMatch([]), false)
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
      assert.equal(matcher.doesMatch([2]), false)
      assert.equal(matcher.isExhausted(), false)
    })
    it("does match", () => {
      assert.equal(matcher.doesMatch([1, 2]), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch([2, 2]), false)
      assert.equal(matcher.isExhausted(), true)
    })
    it("stringifies numbers", () => {
      assert.equal(matcher.stringify(), "1")
    })
    it("stringifies strings", () => {
      matcher = new SegmentMatcher("A")
      assert.equal(matcher.stringify(), '"A"')

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
      assert.equal(matcher.doesMatch(["hello"]), false)
      assert.equal(matcher.isExhausted(), false)
    })
    it("does not match", () => {
      assert.equal(matcher.doesMatch([0]), false)
      assert.equal(matcher.isExhausted(), false)
    })
    it("does match", () => {
      assert.equal(matcher.doesMatch([1, 2]), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch([2, 2]), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch([3, 2]), false)
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
    it("does not match", () => {
      assert.equal(matcher.doesMatch([1, 2]), false)
      assert.equal(matcher.isExhausted(), false)
    })
    it("matches", () => {
      assert.equal(matcher.doesMatch(["F", 2]), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", 2]), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", "B"]), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", "D"]), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", "E", "Y"]), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", "X", "Y"]), false)
      assert.equal(matcher.isExhausted(), true)
    })
    it("stringifies", () => {
      assert.equal(matcher.stringify(), '"A"{"B"{"C" "D"} "E"} "F"')
    })
    oit("stringifies pretty", () => {
      console.log(matcher.stringify(true))
      assert.equal(matcher.stringify(true), '"A"{"B"{"C" "D"} "E"} "F"')
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
    it("matches", () => {
      assert.equal(matcher.doesMatch(["Z", 2]), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", "B"]), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", "B", "C"]), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", "B", "Y"]), false)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", "B", "D"]), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["A", "X", "C"]), true)
      assert.equal(matcher.isExhausted(), false)
      assert.equal(matcher.doesMatch(["B", "X"]), false)
      assert.equal(matcher.isExhausted(), true)
    })
    it("stringifies slices", () => {
      assert.equal(matcher.stringify(), '"A"{*{"C" "D"}}')
    })
  })
})
