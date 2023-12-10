//@ts-check
import assert from "assert"
import pkg from "zunit"
import fs from "fs/promises"
import path from "path"

import JSONBuilder from "../src/JSONBuilder.mjs"
import JSONParser from "../src/JSONParser.mjs"

const { describe, oit, it, beforeEach } = pkg

describe("JSONBuilder sample files", () => {
  let parser
  beforeEach(() => {
    parser = new JSONParser()
  })
  for (const filename of [
    "creationix.json",
    "npm.json",
    "wikipedia.json",
    "twitter.json",
  ]) {
    it(`works with ${filename}`, async () => {
      let str = ""

      const builder = new JSONBuilder((data) => (str += data))
      const json = await fs.readFile(path.join("test", "samples", filename), {
        encoding: "utf-8",
      })
      for (const [k, v] of parser.parse(json)) {
        builder.add(k, v)
      }
      builder.end()
      const original = JSON.parse(json)
      const copy = JSON.parse(str)
      assert.deepEqual(original, copy)
    })
  }
})
