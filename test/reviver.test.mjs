//@ts-check
import assert from "assert"
import pkg from "zunit"

import reviver from "../src/reviver.mjs"

const { describe, it, oit } = pkg

describe("JSONReviver", () => {
  it("works with no changes", () => {
    const obj = { p: 5 }
    assert.deepEqual(reviver(obj), obj)
  })
  it("works with no changes", () => {
    const obj = { p: 5 }
    assert.deepEqual(
      reviver(obj, (key, value) =>
        typeof value === "number" ? value * 2 : value,
      ),
      { p: 10 },
    )
  })
})
