//@ts-check
import assert from "assert"
import pkg from "zunit"

import ObjBuilder from "../src/ObjBuilder.mjs"

const { describe, it } = pkg

describe("ObjBuilder", () => {
  it("works with scalars", () => {
    const objBuilder = new ObjBuilder()
    objBuilder.add([], true)
    assert.deepEqual(objBuilder.object, true)
  })
  it("works with simple attributes", () => {
    const objBuilder = new ObjBuilder()
    objBuilder.add([], {})
    objBuilder.add(["b"], 2)
    assert.deepEqual(objBuilder.object, { b: 2 })
  })
  it("works with simple attributes, with structure reconstruction", () => {
    const objBuilder = new ObjBuilder()
    objBuilder.add(["a", 0, "b"], 1)
    assert.deepEqual(objBuilder.object, { a: [{ b: 1 }] })
  })
  it("works in more complicated cases", () => {
    const objBuilder = new ObjBuilder()
    objBuilder.add(["a", 0, "b"], 1)
    objBuilder.add(["c", "b"], 3)
    assert.deepEqual(objBuilder.object, { a: [{ b: 1 }], c: { b: 3 } })
  })
  it("silently convert numbers", () => {
    const objBuilder = new ObjBuilder()
    objBuilder.add(["a"], {})
    objBuilder.add(["a", 0], 3)
    assert.deepEqual(objBuilder.object, { a: { 0: 3 } })
  })
  it("reconstructs arrays", () => {
    const objBuilder = new ObjBuilder()
    objBuilder.add(["a"], [])
    objBuilder.add(["a", 3], 3)
    assert.deepEqual(objBuilder.object, { a: [, , , 3] })
  })
})
