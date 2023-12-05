//@ts-check
import assert from "assert"
import pkg from "zunit"

import JSONParser from "../src/JSONParser.mjs"

const { describe, it, oit, beforeEach } = pkg

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
    it("works with an empty object", () =>
      assert.deepEqual(Array.from(parser.parse("{}")), [[[], {}]]))
    it("works with a minimal object", () =>
      assert.deepEqual(Array.from(parser.parse(`{"test":1}`)), [
        [[], {}],
        [["test"], 1],
      ]))
    it("works with an object with multiple prop", () =>
      assert.deepEqual(Array.from(parser.parse(`{"test":1, "test1":"xyz"}`)), [
        [[], {}],
        [["test"], 1],
        [["test1"], "xyz"],
      ]))
  })
})
