//@ts-check
import assert from "assert"
import pkg from "zunit"

import { isArrayOrObject, reversed } from "../src/utils.mjs"

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
  describe("reversed", () => {
    it("works", () =>
      assert.deepEqual(Array.from(reversed([1, 2, 3])), [3, 2, 1]))
  })
})
