//@ts-check
import assert from "assert"
import pkg from "zunit"

import ObjParser from "../src/ObjParser.mjs"
import ObjBuilder from "../src/ObjBuilder.mjs"

const { describe, it, beforeEach } = pkg

describe("ObjParser", () => {
  let parse
  let builder
  beforeEach(() => {
    builder = new ObjBuilder()
    const parser = new ObjParser()
    parse = (obj) => {
      for (const [path, value] of parser.parse(obj)) {
        builder.add(path, value)
      }
    }
  })
  it("works parsing nested objects", () => {
    const obj = { a: 1, b: 2, obj: { nested: 1 } }
    parse(obj)
    assert.deepEqual(builder.object, obj)
  })
  it("works parsing nested arrays", () => {
    const obj = { a: 1, b: 2, array: [0, 1, 2] }
    parse(obj)
    assert.deepEqual(builder.object, obj)
  })
})
