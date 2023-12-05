//@ts-check
import assert from "assert"
import pkg from "zunit"
import fs from "fs/promises"
import path from "path"

import ObjBuilder from "../src/ObjBuilder.mjs"
import JSONParser from "../src/JSONParser.mjs"

const { describe, it, oit, beforeEach, before } = pkg

describe("JSONParser", () => {
  let parser
  beforeEach(() => {
    parser = new JSONParser()
  })
  it("can resume", () => {
    const kv = []
    for (const str of ['"t', "es", "t", '"']) {
      for (const [k, v] of parser.parse(str)) {
        kv.push([k, v])
      }
    }
    assert.deepEqual(kv, [[[], "test"]])
    assert.equal(parser.isFinished(), true)
  })

  describe("strings", () => {
    it("works with a simple string", () =>
      assert.deepEqual(Array.from(parser.parse('"test"')), [[[], "test"]]))
    it("works with slashes", () =>
      assert.deepEqual(Array.from(parser.parse('"hello\\nworld"')), [
        [[], "hello\nworld"],
      ]))
    it("works with unicode", () =>
      assert.deepEqual(Array.from(parser.parse('"hell\\u006f"')), [
        [[], "hello"],
      ]))
  })
  describe("numbers", () => {
    it("does not work without trailing space ", () =>
      assert.deepEqual(Array.from(parser.parse("100")), []))

    it("works with a number", () =>
      assert.deepEqual(Array.from(parser.parse("100 ")), [[[], 100]]))

    it("works with decimals", () =>
      assert.deepEqual(Array.from(parser.parse("10.05 ")), [[[], 10.05]]))

    it("works with exp", () =>
      assert.deepEqual(Array.from(parser.parse("10e2 ")), [[[], 1000]]))

    it("works with decimals exp", () =>
      assert.deepEqual(Array.from(parser.parse("10.3e2 ")), [[[], 1030]]))

    it("works with exp and sign", () =>
      assert.deepEqual(Array.from(parser.parse("10e-1 ")), [[[], 1]]))
  })
  describe("booleans and null", () => {
    it("works with true", () =>
      assert.deepEqual(Array.from(parser.parse("true")), [[[], true]]))
    it("works with false", () =>
      assert.deepEqual(Array.from(parser.parse("false")), [[[], false]]))
    it("works with null", () =>
      assert.deepEqual(Array.from(parser.parse("null")), [[[], null]]))
  })
  describe("object", () => {
    it("works with an empty object", () => {
      assert.deepEqual(Array.from(parser.parse("{}")), [[[], {}]])
      assert.equal(parser.isFinished(), true)
    })
    it("works with a minimal object", () => {
      assert.deepEqual(Array.from(parser.parse(`{"test":1}`)), [
        [[], {}],
        [["test"], 1],
      ])
      assert.equal(parser.isFinished(), true)
    })
    it("works with an object with multiple prop", () => {
      assert.deepEqual(Array.from(parser.parse(`{"test":1, "test1":"xyz"}`)), [
        [[], {}],
        [["test"], 1],
        [["test1"], "xyz"],
      ])
      assert.equal(parser.isFinished(), true)
    })
  })
  describe("array", () => {
    it("works with an empty array", () => {
      assert.deepEqual(Array.from(parser.parse("[]")), [[[], []]])
      assert.equal(parser.isFinished(), true)
    })
    it("works with a minimal array", () => {
      assert.deepEqual(Array.from(parser.parse(`[1]`)), [
        [[], []],
        [[0], 1],
      ])
      assert.equal(parser.isFinished(), true)
    })
    it("works with an array with multiple items", () => {
      assert.deepEqual(Array.from(parser.parse(`[1,"xyz"]`)), [
        [[], []],
        [[0], 1],
        [[1], "xyz"],
      ])
      assert.equal(parser.isFinished(), true)
    })
  })
  describe("nesting", () => {
    it("works with object nested into object (1)", () => {
      assert.deepEqual(Array.from(parser.parse('{"test1":{"test2":1}}')), [
        [[], {}],
        [["test1"], {}],
        [["test1", "test2"], 1],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into object (2)", () => {
      assert.deepEqual(
        Array.from(parser.parse('{"test1":{"test2":1}, "test3":2}')),
        [
          [[], {}],
          [["test1"], {}],
          [["test1", "test2"], 1],
          [["test3"], 2],
        ],
      )
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (1)", () => {
      assert.deepEqual(Array.from(parser.parse('[{"test1":1}, {"test2":2}]')), [
        [[], []],
        [[0], {}],
        [[0, "test1"], 1],
        [[1], {}],
        [[1, "test2"], 2],
      ])
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (2)", () => {
      assert.deepEqual(
        Array.from(parser.parse('[{"test1":[1, "xyz"]}, {"test2":2}]')),
        [
          [[], []],
          [[0], {}],
          [[0, "test1"], []],
          [[0, "test1", 0], 1],
          [[0, "test1", 1], "xyz"],
          [[1], {}],
          [[1, "test2"], 2],
        ],
      )
      assert.equal(parser.isFinished(), true)
    })

    it("works with object nested into arrays (3)", () => {
      assert.deepEqual(Array.from(parser.parse("[[1, 2, 3], [4, 5, 6]]")), [
        [[], []],
        [[0], []],
        [[0, 0], 1],
        [[0, 1], 2],
        [[0, 2], 3],
        [[1], []],
        [[1, 0], 4],
        [[1, 1], 5],
        [[1, 2], 6],
      ])
      assert.equal(parser.isFinished(), true)
    })
  })

  describe("sample files", () => {
    for (const filename of [
      "creationix.json",
      "npm.json",
      "wikipedia.json",
      "twitter.json",
    ]) {
      it(`works with ${filename}`, async () => {
        const objBuilder = new ObjBuilder()
        const json = await fs.readFile(path.join("test", "samples", filename), {
          encoding: "utf-8",
        })
        for (const [k, v] of parser.parse(json)) {
          objBuilder.add(k, v)
        }
        assert.equal(parser.isFinished(), true)
        assert.deepEqual(objBuilder.object, JSON.parse(json))
      })
    }
  })
})
