//@ts-check
import assert from "assert"
import pkg from "zunit"

import SequenceToObject from "../src/SequenceToObject.mjs"

const { describe, it, oit } = pkg

describe("SequenceToObject", () => {
  it("works with scalars", () => {
    const builder = new SequenceToObject()
    builder.add([], true)
    assert.deepEqual(builder.object, true)
  })
  it("works with simple attributes", () => {
    const builder = new SequenceToObject()
    builder.add([], {})
    builder.add(["b"], 2)
    assert.deepEqual(builder.object, { b: 2 })
  })
  it("works with simple attributes, with structure reconstruction", () => {
    const builder = new SequenceToObject()
    builder.add(["a", 0, "b"], 1)
    assert.deepEqual(builder.object, { a: [{ b: 1 }] })
  })
  it("works in more complicated cases", () => {
    const builder = new SequenceToObject()
    builder.add(["a", 0, "b"], 1)
    builder.add(["c", "b"], 3)
    assert.deepEqual(builder.object, { a: [{ b: 1 }], c: { b: 3 } })
  })
  it("silently convert numbers", () => {
    const builder = new SequenceToObject()
    builder.add(["a"], {})
    builder.add(["a", 0], 3)
    assert.deepEqual(builder.object, { a: { 0: 3 } })
  })
  it("reconstructs arrays", () => {
    const builder = new SequenceToObject()
    builder.add(["a"], [])
    builder.add(["a", 3], 3)
    assert.deepEqual(builder.object, { a: [, , , 3] })
  })
  it("compacts arrays", () => {
    const builder = new SequenceToObject({ compactArrays: true })
    builder.add(["a"], [])
    builder.add(["a", 3], 3)
    assert.deepEqual(builder.object, { a: [3] })
  })
  it("compacts arrays (2)", () => {
    const builder = new SequenceToObject({ compactArrays: true })
    builder.add(["collection", 2], {})
    builder.add(["collection", 2, "brand"], "Rolls Royce")
    builder.add(["collection", 2, "number"], 8)
    assert.deepEqual(builder.object, {
      collection: [{ brand: "Rolls Royce", number: 8 }],
    })
  })

  it("compacts arrays (3)", () => {
    const builder = new SequenceToObject({ compactArrays: true })
    builder.add(["collection", 2], {})
    builder.add(["collection", 3, "brand"], "Rolls Royce")
    builder.add(["collection", 3, "number"], 8)
    assert.deepEqual(builder.object, {
      collection: [{}, { brand: "Rolls Royce", number: 8 }],
    })
  })
  it("compacts arrays (4)", () => {
    const builder = new SequenceToObject({ compactArrays: true })
    builder.add(["collection", 2], {})
    builder.add(["collection2", 3, "brand"], "Rolls Royce")
    builder.add(["collection2", 4, "number"], 8)
    assert.deepEqual(builder.object, {
      collection2: [
        {
          brand: "Rolls Royce",
        },
        {
          number: 8,
        },
      ],
      collection: [{}],
    })
  })
})
