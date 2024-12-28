//@ts-check
import assert from "assert"
import pkg from "zunit"

import {
  isArrayOrObject,
  getCommonPathIndex,
  valueToString,
  fromEndToIndex,
  fromIndexToEnd,
  isPreviousPathInNewPath,
  decodeAndParse,
  stringifyAndEncode,
} from "../src/utils.mjs"

const { describe, it, oit, beforeEach } = pkg
describe("utils", () => {
  describe("isArrayOrObject", () => {
    it("works with plain objects", () =>
      assert.equal(isArrayOrObject({}), true))
    it("works with arrays", () => assert.equal(isArrayOrObject([]), true))
    it("works with undefined", () =>
      assert.equal(isArrayOrObject(undefined), false))
    it("works with null", () => assert.equal(isArrayOrObject(null), false))
    it("works with 0", () => assert.equal(isArrayOrObject(0), false))
    it("works with 1", () => assert.equal(isArrayOrObject(1), false))
    it("works with empty strings", () =>
      assert.equal(isArrayOrObject(""), false))
    it("works with strings", () => assert.equal(isArrayOrObject("xyz"), false))
    it("works with objects", () =>
      assert.equal(isArrayOrObject(new Date()), true))
  })
  describe("getCommonPathIndex", () => {
    it("works with empty paths", () =>
      assert.equal(getCommonPathIndex([], []), 0))
    it("works with same paths", () =>
      assert.equal(getCommonPathIndex(["a", "b", "c"], ["a", "b", "c"]), 3))
    it("works with common paths (1)", () =>
      assert.equal(getCommonPathIndex(["a", "b"], ["a", "b", "c"]), 2))
    it("works with common paths (2)", () =>
      assert.equal(getCommonPathIndex([], ["a", "b", "c"]), 0))
    it("works with common paths (3)", () =>
      assert.equal(getCommonPathIndex(["a", "b", "c"], ["a", "b"]), 2))
    it("works with different paths (1)", () =>
      assert.equal(getCommonPathIndex(["a", "b", "c"], ["x", "y"]), 0))
    it("works with different paths (2)", () =>
      assert.equal(getCommonPathIndex(["a", "b"], ["x", "y", "z"]), 0))
    it("works with different paths (3)", () =>
      assert.equal(getCommonPathIndex(["x", "a", "b"], ["x", "y", "z"]), 1))
  })
  describe("valueToString", () => {
    it("works with obj", () => assert.equal(valueToString({}), "{"))
    it("works with array", () => assert.equal(valueToString([]), "["))
    it("works with null", () => assert.equal(valueToString(null), "null"))
    it("works with string", () =>
      assert.equal(valueToString("hello"), '"hello"'))
    it("works with boolean", () => assert.equal(valueToString(false), "false"))
    it("works with number", () => assert.equal(valueToString(1.24), "1.24"))
  })
  describe("fromEndToIndex", () => {
    it("index 0", () =>
      assert.deepEqual(Array.from(fromEndToIndex(["a", "b", "c"], 0)), [
        [2, "c"],
        [1, "b"],
        [0, "a"],
      ]))
    it("index 1", () =>
      assert.deepEqual(Array.from(fromEndToIndex(["a", "b", "c"], 1)), [
        [2, "c"],
        [1, "b"],
      ]))
    it("index 2", () =>
      assert.deepEqual(Array.from(fromEndToIndex(["a", "b", "c"], 2)), [
        [2, "c"],
      ]))
    it("index 3", () =>
      assert.deepEqual(Array.from(fromEndToIndex(["a", "b", "c"], 3)), []))
  })

  describe("fromIndexToEnd", () => {
    it("index 0", () =>
      assert.deepEqual(Array.from(fromIndexToEnd(["a", "b", "c"], 0)), [
        [0, "a"],
        [1, "b"],
        [2, "c"],
      ]))
    it("index 1", () =>
      assert.deepEqual(Array.from(fromIndexToEnd(["a", "b", "c"], 1)), [
        [1, "b"],
        [2, "c"],
      ]))
    it("index 3", () =>
      assert.deepEqual(Array.from(fromIndexToEnd(["a", "b", "c"], 3)), []))
  })

  describe("isPreviousPathInNewPath", () => {
    it("works on same path", () =>
      assert.equal(isPreviousPathInNewPath(["x"], ["x"]), true))
    it("works with empty paths", () =>
      assert.equal(isPreviousPathInNewPath([], []), true))
    it("works with empty paths (2)", () =>
      assert.equal(isPreviousPathInNewPath([], ["x"]), true))
    it("works with empty paths (3)", () =>
      assert.equal(isPreviousPathInNewPath(["x"], []), false))
    it("works with common path", () =>
      assert.equal(isPreviousPathInNewPath(["x", "y"], ["x", "y", 1]), true))
    it("works with uncommon path", () =>
      assert.equal(
        isPreviousPathInNewPath(["x", "y", 2], ["x", "y", 1]),
        false,
      ))
    it("works with uncommon path (2)", () =>
      assert.equal(isPreviousPathInNewPath(["x", "y"], ["x"]), false))
  })
  describe("decodeAndParse stringifyAndEncode", () => {
    it("encodes", () =>
      assert.deepEqual(
        stringifyAndEncode("hello"),
        new Uint8Array([34, 104, 101, 108, 108, 111, 34]),
      ))
    it("decodes", () =>
      assert.deepEqual(
        "hello",
        decodeAndParse(new Uint8Array([34, 104, 101, 108, 108, 111, 34])),
      ))
  })
})
