//@ts-check
import assert from "assert"
import pkg from "zunit"

import { stringToPathExp, pathExpToString } from "../src/pathExp.mjs"

const { describe, it, oit } = pkg

describe("pathExp", () => {
  describe("stringToPathExp", () => {
    it("can emit single match", () => {
      assert.deepEqual(stringToPathExp("test"), [
        [{ type: "match", match: "test" }],
      ])
    })
    it("can emit single match with an index", () => {
      assert.deepEqual(stringToPathExp("3"), [[{ type: "match", match: 3 }]])
    })
    it("can emit single match with a string", () => {
      assert.deepEqual(stringToPathExp('"test 123"'), [
        [{ type: "match", match: "test 123" }],
      ])
    })
    it("can emit double match with a string", () => {
      assert.deepEqual(stringToPathExp('"test 123"."abc\\t"'), [
        [
          { type: "match", match: "test 123" },
          { type: "match", match: "abc\\t" },
        ],
      ])
    })
    it("can emit double match", () => {
      assert.deepEqual(stringToPathExp("test.data"), [
        [
          { type: "match", match: "test" },
          { type: "match", match: "data" },
        ],
      ])
    })
    it("can emit double match with an index", () => {
      assert.deepEqual(stringToPathExp("39.2"), [
        [
          { type: "match", match: 39 },
          { type: "match", match: 2 },
        ],
      ])
    })
    it("can emit single slice", () => {
      assert.deepEqual(stringToPathExp("3:10"), [
        [{ type: "slice", sliceFrom: 3, sliceTo: 10 }],
      ])
    })
    it("can emit double slice", () => {
      assert.deepEqual(stringToPathExp("3:10.10:300"), [
        [
          { type: "slice", sliceFrom: 3, sliceTo: 10 },
          { type: "slice", sliceFrom: 10, sliceTo: 300 },
        ],
      ])
    })
    it("works with brackets", () => {
      assert.deepEqual(stringToPathExp("[3:10]"), [
        [{ type: "slice", sliceFrom: 3, sliceTo: 10 }],
      ])
    })
    it("can emit double slice with brackets", () => {
      assert.deepEqual(stringToPathExp("[3:10][10:300]"), [
        [
          { type: "slice", sliceFrom: 3, sliceTo: 10 },
          { type: "slice", sliceFrom: 10, sliceTo: 300 },
        ],
      ])
    })
    it("works mixing up all", () => {
      assert.deepEqual(
        stringToPathExp('hello.1[word].1:3[6]."again"["hello 123"]'),
        [
          [
            {
              match: "hello",
              type: "match",
            },
            {
              match: 1,
              type: "match",
            },
            {
              match: "word",
              type: "match",
            },
            {
              sliceFrom: 1,
              sliceTo: 3,
              type: "slice",
            },
            {
              match: 6,
              type: "match",
            },
            {
              match: "again",
              type: "match",
            },
            {
              match: "hello 123",
              type: "match",
            },
          ],
        ],
      )
    })
    it("emits multiple expressions (1)", () => {
      assert.deepEqual(stringToPathExp("hello, world"), [
        [{ type: "match", match: "hello" }],
        [{ type: "match", match: "world" }],
      ])
    })
    it("emits multiple expressions (2)", () => {
      assert.deepEqual(stringToPathExp("hello[world], 0.world"), [
        [
          { type: "match", match: "hello" },
          { type: "match", match: "world" },
        ],
        [
          { type: "match", match: 0 },
          { type: "match", match: "world" },
        ],
      ])
    })
  })
  describe("pathExpToString", () => {
    it("can convert", () => {
      const str = pathExpToString([
        [
          {
            match: "hello",
            type: "match",
          },
          {
            match: 1,
            type: "match",
          },
          {
            match: "word",
            type: "match",
          },
          {
            sliceFrom: 1,
            sliceTo: 3,
            type: "slice",
          },
          {
            match: 6,
            type: "match",
          },
          {
            match: "again",
            type: "match",
          },
          {
            match: "hello 123",
            type: "match",
          },
        ],
      ])
      assert.equal(str, '"hello".1."word".1:3.6."again"."hello 123"')
    })
  })
})
