//@ts-check
import assert from "assert"
import pkg from "zunit"

import { Matcher, includeByPath, excludeByPath } from "../src/filterByPath.mjs"

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
  describe("includeByPath", () => {
    it("includes none", () =>
      assert.deepEqual(
        Array.from(
          includeByPath(
            [
              [["a"], 1],
              [["b"], 2],
            ],
            [],
          ),
        ),
        [],
      ))
    it("includes one", () =>
      assert.deepEqual(
        Array.from(
          includeByPath(
            [
              [["a"], 1],
              [["b"], 2],
            ],
            [[{ type: "match", match: "a" }]],
          ),
        ),
        [[["a"], 1]],
      ))
    it("includes two", () =>
      assert.deepEqual(
        Array.from(
          includeByPath(
            [
              [["a"], 1],
              [["b"], 2],
            ],
            [[{ type: "match", match: "a" }], [{ type: "match", match: "b" }]],
          ),
        ),
        [
          [["a"], 1],
          [["b"], 2],
        ],
      ))
  })
  describe("excludeByPath", () => {
    it("exclude none", () =>
      assert.deepEqual(
        Array.from(
          excludeByPath(
            [
              [["a"], 1],
              [["b"], 2],
            ],
            [],
          ),
        ),
        [
          [["a"], 1],
          [["b"], 2],
        ],
      ))
    it("exclude one", () =>
      assert.deepEqual(
        Array.from(
          excludeByPath(
            [
              [["a"], 1],
              [["b"], 2],
            ],
            [[{ type: "match", match: "a" }]],
          ),
        ),
        [[["b"], 2]],
      ))
    it("exclude two", () =>
      assert.deepEqual(
        Array.from(
          excludeByPath(
            [
              [["a"], 1],
              [["b"], 2],
            ],
            [[{ type: "match", match: "a" }], [{ type: "match", match: "b" }]],
          ),
        ),
        [],
      ))
  })
})
