//@ts-check
import assert from "assert"
import pkg from "zunit"

import ObjBuilder from "../src/ObjBuilder.mjs"

const { describe, it } = pkg

describe("ObjBuilder", () => {
  it("works on simple attributes", () => {
    const objBuilder = new ObjBuilder()
    objBuilder.addAttribute("a", 1)
    objBuilder.addAttribute("b", 2)
    assert.deepEqual(objBuilder.object, { a: 1, b: 2 })
  })
  it("works with objects", () => {
    const objBuilder = new ObjBuilder()
    objBuilder.addAttribute("a", 1)
    objBuilder.openObject("obj")
    objBuilder.addAttribute("nested", 1)
    objBuilder.close()
    objBuilder.addAttribute("b", 2)
    assert.deepEqual(objBuilder.object, { a: 1, b: 2, obj: { nested: 1 } })
  })
  it("works with arrays", () => {
    const objBuilder = new ObjBuilder()
    objBuilder.addAttribute("a", 1)
    objBuilder.openArray("array")
    objBuilder.addAttribute(0, 1)
    objBuilder.close()
    objBuilder.addAttribute("b", 2)
    assert.deepEqual(objBuilder.object, { a: 1, b: 2, array: [1] })
  })
})
