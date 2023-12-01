//@ts-check
import assert from "assert"
import pkg from "zunit"

import ObjParser from "../src/ObjParser.mjs"
import ObjBuilder from "../src/ObjBuilder.mjs"

const { describe, it, beforeEach } = pkg

describe("ObjParser", () => {
  let parser
  let builder
  beforeEach(() => {
    parser = new ObjParser({
      onInit(value) {
        builder = new ObjBuilder(value)
      },
      onAddAttribute(path, value) {
        const pathSegment = path[path.length - 1]
        builder.addAttribute(pathSegment, value)
      },
      onOpenArray(path) {
        const pathSegment = path[path.length - 1]
        builder.openArray(pathSegment)
      },
      onOpenObject(path) {
        const pathSegment = path[path.length - 1]
        builder.openObject(pathSegment)
      },
      onClose(path) {
        // const pathSegment = path[path.length - 1]
        builder.close()
      },
    })
  })
  it("works parsing nested objects", () => {
    const obj = { a: 1, b: 2, obj: { nested: 1 } }
    parser.parse(obj)
    assert.deepEqual(builder.object, obj)
  })
  it("works parsing nested arrays", () => {
    const obj = { a: 1, b: 2, array: [0, 1, 2] }
    parser.parse(obj)
    assert.deepEqual(builder.object, obj)
  })
})
