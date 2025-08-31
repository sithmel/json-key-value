//@ts-check
import assert from "assert"
import { describe, it } from "node:test"
import jsonPatch from "fast-json-patch"
const { compare, applyPatch } = jsonPatch

import { streamToIterable, objectToIterable } from "../src/index.js"

/**
 * @param {Array<string>} array
 * @returns {Iterable<Uint8Array>}
 */
function arrayOfStringsToStream(array) {
  const encoder = new TextEncoder()
  return array.map((text) => encoder.encode(text))
}

/**
 * Convert fast-json-patch operations to our library format
 * @param {Array<any>} fastJsonPatchOps
 * @returns {Array<{op: "add", path: Array<string|number>, value: any} | {op: "remove", path: Array<string|number>} | {op: "replace", path: Array<string|number>, value: any} | {op: "test", path: Array<string|number>, value: any}>}
 */
function convertPatchOperations(fastJsonPatchOps) {
  return fastJsonPatchOps.map(op => {
    // Convert JSON Pointer path to array format
    const pathArray = op.path === "" ? [] : op.path.split("/").slice(1).map(segment => {
      // Convert numeric strings to numbers for array indices
      const num = parseInt(segment, 10)
      return isNaN(num) ? segment : num
    })
    
    if (op.op === "add" || op.op === "replace" || op.op === "test") {
      return {
        op: op.op,
        path: pathArray,
        value: op.value
      }
    } else if (op.op === "remove") {
      return {
        op: op.op,
        path: pathArray
      }
    } else {
      throw new Error(`Unsupported operation: ${op.op}`)
    }
  })
}

describe("JSONPatch integration with fast-json-patch", () => {
  describe("objectToIterable patch operations", () => {
    it("should apply add operations correctly", async () => {
      const original = { a: 1, c: 3 }
      const target = { a: 1, b: 2, c: 3 }
      
      // Generate patch using fast-json-patch
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      // Apply patch using our library
      const result = await objectToIterable(original)
        .patch(convertedPatch)
        .toObject()
      
      // Verify result matches target
      assert.deepEqual(result, target)
      
      // Also verify it matches what fast-json-patch would produce
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })

    it("should apply remove operations correctly", async () => {
      const original = { a: 1, b: 2, c: 3 }
      const target = { a: 1, c: 3 }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const result = await objectToIterable(original)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })

    it("should apply replace operations correctly", async () => {
      const original = { a: 1, b: 2, c: 3 }
      const target = { a: 1, b: 99, c: 3 }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const result = await objectToIterable(original)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })

    it("should handle complex nested object changes", async () => {
      const original = {
        user: {
          name: "John",
          age: 30,
          address: {
            street: "123 Main St",
            city: "New York"
          }
        },
        settings: {
          theme: "dark",
          notifications: true
        }
      }
      
      const target = {
        user: {
          name: "Jane", // changed
          age: 30,
          address: {
            street: "456 Oak Ave", // changed
            city: "New York",
            zipCode: "10001" // added
          }
        },
        settings: {
          theme: "light", // changed
          notifications: true
        },
        newProperty: "added" // added
      }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const result = await objectToIterable(original)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })

    it("should handle array operations", async () => {
      const original = {
        items: [1, 2, 3],
        metadata: { count: 3 }
      }
      
      const target = {
        items: [1, 99, 3, 4], // replaced index 1, added index 3
        metadata: { count: 4 }
      }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const result = await objectToIterable(original)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })
  })

  describe("streamToIterable patch operations", () => {
    it("should apply add operations correctly", async () => {
      const original = { a: 1, c: 3 }
      const target = { a: 1, b: 2, c: 3 }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const streamLike = arrayOfStringsToStream([JSON.stringify(original)])
      const result = await streamToIterable(streamLike)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })

    it("should apply remove operations correctly", async () => {
      const original = { a: 1, b: 2, c: 3 }
      const target = { a: 1, c: 3 }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const streamLike = arrayOfStringsToStream([JSON.stringify(original)])
      const result = await streamToIterable(streamLike)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })

    it("should apply replace operations correctly", async () => {
      const original = { a: 1, b: 2, c: 3 }
      const target = { a: 1, b: 99, c: 3 }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const streamLike = arrayOfStringsToStream([JSON.stringify(original)])
      const result = await streamToIterable(streamLike)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })

    it("should handle complex nested object changes", async () => {
      const original = {
        user: {
          name: "John",
          age: 30,
          address: {
            street: "123 Main St",
            city: "New York"
          }
        },
        settings: {
          theme: "dark",
          notifications: true
        }
      }
      
      const target = {
        user: {
          name: "Jane",
          age: 30,
          address: {
            street: "456 Oak Ave",
            city: "New York",
            zipCode: "10001"
          }
        },
        settings: {
          theme: "light",
          notifications: true
        },
        newProperty: "added"
      }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const streamLike = arrayOfStringsToStream([JSON.stringify(original)])
      const result = await streamToIterable(streamLike)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })

    it("should handle streamed JSON input with patches", async () => {
      const original = { a: 1, b: 2, c: 3 }
      const target = { a: 1, b: 99, c: 3, d: 4 }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      // Test with chunked streaming
      const streamLike = arrayOfStringsToStream(['{"a":1,', '"b":2,"c":', '3}'])
      const result = await streamToIterable(streamLike)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })

    it("should handle array operations", async () => {
      const original = {
        items: [1, 2, 3],
        metadata: { count: 3 }
      }
      
      const target = {
        items: [1, 99, 3, 4],
        metadata: { count: 4 }
      }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const streamLike = arrayOfStringsToStream([JSON.stringify(original)])
      const result = await streamToIterable(streamLike)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })
  })

  describe("edge cases and error handling", () => {
    it("should handle empty patches", async () => {
      const original = { a: 1, b: 2 }
      const target = { a: 1, b: 2 } // no changes
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      // Should be empty patch
      assert.deepEqual(convertedPatch, [])
      
      const result = await objectToIterable(original)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, original)
    })

    it("should handle test operations that pass", async () => {
      const original = { a: 1, b: 2, c: 3 }
      
      // Create a patch with test operations
      /** @type {Array<{op: "test", path: Array<string>, value: any} | {op: "replace", path: Array<string>, value: any}>} */
      const patch = [
        { op: "test", path: ["b"], value: 2 },
        { op: "replace", path: ["b"], value: 99 }
      ]
      
      const result = await objectToIterable(original)
        .patch(patch)
        .toObject()
      
      assert.deepEqual(result, { a: 1, b: 99, c: 3 })
    })

    it("should handle test operations that fail", async () => {
      const original = { a: 1, b: 2, c: 3 }
      
      /** @type {Array<{op: "test", path: Array<string>, value: any} | {op: "replace", path: Array<string>, value: any}>} */
      const patch = [
        { op: "test", path: ["b"], value: 99 }, // This should fail
        { op: "replace", path: ["b"], value: 77 }
      ]
      
      await assert.rejects(async () => {
        await objectToIterable(original)
          .patch(patch)
          .toObject()
      })
    })

    it("should handle complex path conversions", async () => {
      const original = {
        "user-data": {
          "first-name": "John",
          "items": [{ "item-id": 1 }, { "item-id": 2 }]
        }
      }
      
      const target = {
        "user-data": {
          "first-name": "Jane",
          "items": [{ "item-id": 1 }, { "item-id": 3 }] // changed second item
        }
      }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const result = await objectToIterable(original)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
      
      const fastResult = applyPatch(structuredClone(original), fastPatch).newDocument
      assert.deepEqual(result, fastResult)
    })
  })

  describe("performance and compatibility tests", () => {
    it("should handle large objects efficiently", async () => {
      // Create a moderately large object
      const original = {
        data: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item${i}` })),
        metadata: { count: 100, version: 1 }
      }
      
      const target = {
        ...original,
        data: [
          ...original.data.slice(0, 50),
          { id: 50, value: "modified item" }, // replace one item
          ...original.data.slice(51)
        ],
        metadata: { count: 100, version: 2 }, // update version
        newField: "added" // add new field
      }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      const result = await objectToIterable(original)
        .patch(convertedPatch)
        .toObject()
      
      assert.deepEqual(result, target)
    })

    it("should maintain consistency between stream and object processing", async () => {
      const original = {
        nested: {
          array: [1, 2, 3],
          object: { x: 10, y: 20 }
        }
      }
      
      const target = {
        nested: {
          array: [1, 99, 3, 4], // modify and add
          object: { x: 10, z: 30 } // remove y, add z
        }
      }
      
      const fastPatch = compare(original, target)
      const convertedPatch = convertPatchOperations(fastPatch)
      
      // Test with objectToIterable
      const objectResult = await objectToIterable(original)
        .patch(convertedPatch)
        .toObject()
      
      // Test with streamToIterable
      const streamLike = arrayOfStringsToStream([JSON.stringify(original)])
      const streamResult = await streamToIterable(streamLike)
        .patch(convertedPatch)
        .toObject()
      
      // Both should produce the same result
      assert.deepEqual(objectResult, streamResult)
      assert.deepEqual(objectResult, target)
    })

    it("should handle multiple sequential patches", async () => {
      let current = { a: 1, b: 2, c: 3 }
      
      // Apply multiple sequential changes
      const changes = [
        { a: 1, b: 99, c: 3 }, // replace b
        { a: 1, b: 99, c: 3, d: 4 }, // add d
        { a: 1, c: 3, d: 4 } // remove b
      ]
      
      for (const target of changes) {
        const fastPatch = compare(current, target)
        const convertedPatch = convertPatchOperations(fastPatch)
        
        const result = await objectToIterable(current)
          .patch(convertedPatch)
          .toObject()
        
        assert.deepEqual(result, target)
        current = result
      }
    })
  })
})