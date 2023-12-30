//@ts-check
import assert from "assert"
import pkg from "zunit"

import ObjectToSequence from "../src/ObjectToSequence.mjs"
import SequenceToObject from "../src/SequenceToObject.mjs"

const { describe, it, beforeEach } = pkg

describe("ObjParser", () => {
  let parse
  let builder
  beforeEach(() => {
    builder = new SequenceToObject()
    const parser = new ObjectToSequence()
    parse = (obj) => {
      for (const [path, value] of parser.iter(obj)) {
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
