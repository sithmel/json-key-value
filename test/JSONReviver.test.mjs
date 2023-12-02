//@ts-check
import assert from "assert"
import pkg from "zunit"

import JSONReviver from "../src/JSONReviver.mjs"

const { describe, it, oit } = pkg

describe("JSONReviver", () => {
  it("works with no changes", () => {
    const obj = { p: 5 }
    assert.deepEqual(JSONReviver(obj), obj)
  })
  it("works with no changes", () => {
    const obj = { p: 5 }
    assert.deepEqual(
      JSONReviver(obj, (key, value) =>
        typeof value === "number" ? value * 2 : value,
      ),
      { p: 10 },
    )
  })
})
