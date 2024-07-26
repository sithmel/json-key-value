//@ts-check
import assert from "assert"
import pkg from "zunit"

import { Matcher, PathMatcher } from "../src/pathExp/PathMatcher.mjs"

const { describe, it, oit, beforeEach } = pkg
describe("pathMatcher", () => {
  describe("Matcher", () => {
    it("matches empty matcher", () => {
      const matcher = new Matcher([])
      matcher.nextMatch(["a", 0])
      assert.equal(matcher.doesMatch, true)
      assert.equal(matcher.isExhausted, false)
    })
    it("matches when common part matches", () => {
      const matcher = new Matcher([{ type: "match", match: "a" }])
      matcher.nextMatch(["a", 0])
      assert.equal(matcher.doesMatch, true)
      assert.equal(matcher.isExhausted, false)
    })
    it("matches when common part matches (2)", () => {
      const matcher = new Matcher([
        { type: "match", match: "a" },
        { type: "match", match: 0 },
      ])
      matcher.nextMatch(["a", 0])
      assert.equal(matcher.doesMatch, true)
      assert.equal(matcher.isExhausted, false)
    })
    it("does not match when common part do not match", () => {
      const matcher = new Matcher([{ type: "match", match: "b" }])
      matcher.nextMatch(["a", 0])
      assert.equal(matcher.doesMatch, false)
      assert.equal(matcher.isExhausted, false)
    })
    it("works with slice (not matching)", () => {
      const matcher = new Matcher([
        { type: "match", match: "a" },
        { type: "slice", sliceFrom: 1, sliceTo: 2 },
        { type: "match", match: "b" },
      ])
      matcher.nextMatch(["a", 0, "b"])
      assert.equal(matcher.doesMatch, false)
      assert.equal(matcher.isExhausted, false)
    })
    it("works with slice (not matching 2)", () => {
      const matcher = new Matcher([
        { type: "match", match: "a" },
        { type: "slice", sliceFrom: 1, sliceTo: 2 },
        { type: "match", match: "b" },
      ])
      matcher.nextMatch(["c", 0, "b"])
      assert.equal(matcher.doesMatch, false)
      assert.equal(matcher.isExhausted, false)
    })
    it("works with slice (not matching 3)", () => {
      const matcher = new Matcher([
        { type: "match", match: "a" },
        { type: "slice", sliceFrom: 1, sliceTo: 2 },
      ])
      matcher.nextMatch(["a", 2, "b"])
      assert.equal(matcher.doesMatch, false)
      assert.equal(matcher.isExhausted, true)
    })
    it("works with slice (matching)", () => {
      const matcher = new Matcher([
        { type: "match", match: "a" },
        { type: "slice", sliceFrom: 1, sliceTo: 2 },
      ])
      matcher.nextMatch(["a", 1, "b"])
      assert.equal(matcher.doesMatch, true)
      assert.equal(matcher.isExhausted, false)
    })
  })
  describe("PathMatcher", () => {
    it("matches one", () => {
      const matchers = new PathMatcher([[{ type: "match", match: "a" }]])
      matchers.nextMatch(["a"])
      assert.equal(matchers.doesMatch, true)
      assert.equal(matchers.isExhausted, false)
      matchers.nextMatch(["b"])
      assert.equal(matchers.doesMatch, false)
      assert.equal(matchers.isExhausted, true)
    })
    it("matches one and finish", () => {
      const matchers = new PathMatcher([
        [{ type: "match", match: "a" }],
        [{ type: "match", match: "b" }],
      ])
      matchers.nextMatch(["a"])
      assert.equal(matchers.doesMatch, true)
      assert.equal(matchers.isExhausted, false)
      matchers.nextMatch(["b"])
      assert.equal(matchers.doesMatch, true)
      assert.equal(matchers.isExhausted, false)
      matchers.nextMatch(["c"])
      assert.equal(matchers.doesMatch, false)
      assert.equal(matchers.isExhausted, true)
    })
  })
})
