//@ts-check
import assert from "assert"
import { describe, it } from "node:test"
import { toPathObject } from "../src/lib/path.js"
import { toValueObject } from "../src/lib/value.js"
import SequenceToObject from "../src/SequenceToObject.js"

describe("SequenceToObject", () => {
  it("works with scalars", () => {
    const builder = new SequenceToObject()
    builder.add(toPathObject([]), toValueObject(true))
    assert.deepEqual(builder.object, true)
  })
  it("works with simple attributes", () => {
    const builder = new SequenceToObject()
    builder.add(toPathObject(["b"]), toValueObject(2))
    assert.deepEqual(builder.object, { b: 2 })
  })
  it("works with simple attributes, with structure reconstruction", () => {
    const builder = new SequenceToObject()
    builder.add(toPathObject(["a", 0, "b"]), toValueObject(1))
    assert.deepEqual(builder.object, { a: [{ b: 1 }] })
  })
  it("works in more complicated cases", () => {
    const builder = new SequenceToObject()
    builder.add(toPathObject(["a", 0, "b"]), toValueObject(1))
    builder.add(toPathObject(["c", "b"]), toValueObject(3))
    assert.deepEqual(builder.object, { a: [{ b: 1 }], c: { b: 3 } })
  })
  it("compacts arrays", () => {
    const builder = new SequenceToObject()
    builder.add(toPathObject(["a", 3]), toValueObject(3))
    assert.deepEqual(builder.object, { a: [3] })
  })
  it("compacts arrays (2)", () => {
    const builder = new SequenceToObject()
    builder.add(
      toPathObject(["collection", 2, "brand"]),
      toValueObject("Rolls Royce"),
    )
    builder.add(toPathObject(["collection", 2, "number"]), toValueObject(8))
    assert.deepEqual(builder.object, {
      collection: [{ brand: "Rolls Royce", number: 8 }],
    })
  })

  it("compacts arrays (3)", () => {
    const builder = new SequenceToObject()
    builder.add(toPathObject(["collection", 1]), toValueObject({}))
    builder.add(
      toPathObject(["collection", 3, "brand"]),
      toValueObject("Rolls Royce"),
    )
    builder.add(toPathObject(["collection", 3, "number"]), toValueObject(8))
    assert.deepEqual(builder.object, {
      collection: [{}, { brand: "Rolls Royce", number: 8 }],
    })
  })
  it("compacts arrays (4)", () => {
    const builder = new SequenceToObject()
    builder.add(toPathObject(["collection", 2]), toValueObject({}))
    builder.add(
      toPathObject(["collection2", 3, "brand"]),
      toValueObject("Rolls Royce"),
    )
    builder.add(toPathObject(["collection2", 4, "number"]), toValueObject(8))
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

  describe("sparse arrays", () => {
    it("creates sparse arrays when sparse=true", () => {
      const builder = new SequenceToObject(undefined, true)
      builder.add(toPathObject(["a", 3]), toValueObject(3))
      assert.deepEqual(builder.object, { a: [, , , 3] })
      assert.equal(builder.object.a.length, 4)
      assert.equal(builder.object.a[0], undefined)
      assert.equal(builder.object.a[1], undefined)
      assert.equal(builder.object.a[2], undefined)
      assert.equal(builder.object.a[3], 3)
    })

    it("creates sparse arrays with multiple elements", () => {
      const builder = new SequenceToObject(undefined, true)
      builder.add(toPathObject(["collection", 2]), toValueObject({}))
      builder.add(
        toPathObject(["collection", 5, "brand"]),
        toValueObject("Rolls Royce"),
      )
      builder.add(toPathObject(["collection", 5, "number"]), toValueObject(8))

      assert.equal(builder.object.collection.length, 6)
      assert.deepEqual(builder.object.collection[2], {})
      assert.deepEqual(builder.object.collection[5], {
        brand: "Rolls Royce",
        number: 8,
      })
      assert.equal(builder.object.collection[0], undefined)
      assert.equal(builder.object.collection[1], undefined)
      assert.equal(builder.object.collection[3], undefined)
      assert.equal(builder.object.collection[4], undefined)
    })

    it("still compacts arrays when sparse=false (default behavior)", () => {
      const builder = new SequenceToObject()
      builder.add(toPathObject(["a", 3]), toValueObject(3))
      assert.deepEqual(builder.object, { a: [3] })
    })
  })

  describe("chunks", () => {
    it("works with object nested into object (1)", () => {
      const builder = new SequenceToObject()
      builder.add(toPathObject(["test1"]), toValueObject({ test2: 1 }))
      assert.deepEqual(builder.object, { test1: { test2: 1 } })
    })
    it("works with object nested into object (2)", () => {
      const builder = new SequenceToObject()
      builder.add(toPathObject(["test1"]), toValueObject({ test2: 1 }))
      builder.add(toPathObject(["test3"]), toValueObject(2))
      assert.deepEqual(builder.object, { test1: { test2: 1 }, test3: 2 })
    })
    it("works with object nested into arrays (1)", () => {
      const builder = new SequenceToObject()
      builder.add(toPathObject([0]), toValueObject({ test1: 1 }))
      builder.add(toPathObject([1]), toValueObject({ test2: 2 }))
      assert.deepEqual(builder.object, [{ test1: 1 }, { test2: 2 }])
    })

    it("works with object nested into arrays (2)", () => {
      const builder = new SequenceToObject()
      builder.add(toPathObject([0]), toValueObject({ test1: [1, "xyz"] }))
      builder.add(toPathObject([1]), toValueObject({ test2: 2 }))
      assert.deepEqual(builder.object, [{ test1: [1, "xyz"] }, { test2: 2 }])
    })
  })
})
