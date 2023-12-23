//@ts-check
import assert from "assert"
import pkg from "zunit"

import pathExpToMatcherData from "../src/pathExpToMatcherData.mjs"

const { describe, it, oit, beforeEach } = pkg

describe("pathExpToMatcherData", () => {
  it("can emit single match", () => {
    assert.deepEqual(pathExpToMatcherData("test"), [
      [{ type: "match", match: "test" }],
    ])
  })
  it("can emit single match with a string", () => {
    assert.deepEqual(pathExpToMatcherData('"test 123"'), [
      [{ type: "match", match: "test 123" }],
    ])
  })
  it("can emit double match with a string", () => {
    assert.deepEqual(pathExpToMatcherData('"test 123"."abc\\t"'), [
      [
        { type: "match", match: "test 123" },
        { type: "match", match: "abc\\t" },
      ],
    ])
  })

  it("can emit double match", () => {
    assert.deepEqual(pathExpToMatcherData("test.data"), [
      [
        { type: "match", match: "test" },
        { type: "match", match: "data" },
      ],
    ])
  })
})
