//@ts-check
import assert from "assert"
import pkg from "zunit"

import {
  MATCHER,
  doesMatch,
  includeByPath,
  excludeByPath,
} from "../src/pathMatcher.mjs"

const { describe, it, oit, beforeEach } = pkg
describe("pathMatcher", () => {
  describe("doesMatch", () => {
    it("matches empty matcher", () =>
      assert.equal(doesMatch([], ["a", 0]), MATCHER.MATCHING))
    it("matches when common part matches", () =>
      assert.equal(
        doesMatch([{ type: "match", match: "a" }], ["a", 0]),
        MATCHER.MATCHING,
      ))
    it("matches when common part matches (2)", () =>
      assert.equal(
        doesMatch(
          [
            { type: "match", match: "a" },
            { type: "match", match: 0 },
          ],
          ["a", 0],
        ),
        MATCHER.MATCHING,
      ))
    it("does not match when common part do not match", () =>
      assert.equal(
        doesMatch([{ type: "match", match: "b" }], ["a", 0]),
        MATCHER.NOT_MATCHING,
      ))
    it("partially matches (1)", () =>
      assert.equal(
        doesMatch(
          [
            { type: "match", match: "a" },
            { type: "match", match: 1 },
          ],
          ["a", 0],
        ),
        MATCHER.PARTIAL_MATCHING,
      ))
    it("partially matches (2)", () =>
      assert.equal(
        doesMatch(
          [
            { type: "match", match: "a" },
            { type: "match", match: 1 },
            { type: "match", match: "b" },
          ],
          ["a", 0],
        ),
        MATCHER.PARTIAL_MATCHING,
      ))
    it("works with slice (not matching)", () =>
      assert.equal(
        doesMatch(
          [
            { type: "match", match: "a" },
            { type: "slice", sliceFrom: 1, sliceTo: 2 },
            { type: "match", match: "b" },
          ],
          ["a", 0, "b"],
        ),
        MATCHER.PARTIAL_MATCHING,
      ))
    it("works with slice (not matching 2)", () =>
      assert.equal(
        doesMatch(
          [
            { type: "match", match: "a" },
            { type: "slice", sliceFrom: 1, sliceTo: 2 },
            { type: "match", match: "b" },
          ],
          ["c", 0, "b"],
        ),
        MATCHER.NOT_MATCHING,
      ))
    it("works with slice (not matching 3)", () =>
      assert.equal(
        doesMatch(
          [
            { type: "match", match: "a" },
            { type: "slice", sliceFrom: 1, sliceTo: 2 },
          ],
          ["a", 2, "b"],
        ),
        MATCHER.PARTIAL_MATCHING,
      ))
    it("works with slice (not matching 3)", () =>
      assert.equal(
        doesMatch(
          [
            { type: "match", match: "a" },
            { type: "slice", sliceFrom: 1, sliceTo: 2 },
          ],
          ["a", 1, "b"],
        ),
        MATCHER.MATCHING,
      ))
  })
  describe("includeByPath", () => {
    it("includes none", () =>
      assert.deepEqual(
        Array.from(
          includeByPath(
            [],
            [
              [["a"], 1],
              [["b"], 2],
            ],
          ),
        ),
        [],
      ))
    it("includes one", () =>
      assert.deepEqual(
        Array.from(
          includeByPath(
            [[{ type: "match", match: "a" }]],
            [
              [["a"], 1],
              [["b"], 2],
            ],
          ),
        ),
        [[["a"], 1]],
      ))
    it("includes two", () =>
      assert.deepEqual(
        Array.from(
          includeByPath(
            [[{ type: "match", match: "a" }], [{ type: "match", match: "b" }]],
            [
              [["a"], 1],
              [["b"], 2],
            ],
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
            [],
            [
              [["a"], 1],
              [["b"], 2],
            ],
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
            [[{ type: "match", match: "a" }]],
            [
              [["a"], 1],
              [["b"], 2],
            ],
          ),
        ),
        [[["b"], 2]],
      ))
    it("exclude two", () =>
      assert.deepEqual(
        Array.from(
          excludeByPath(
            [[{ type: "match", match: "a" }], [{ type: "match", match: "b" }]],
            [
              [["a"], 1],
              [["b"], 2],
            ],
          ),
        ),
        [],
      ))
  })
})
