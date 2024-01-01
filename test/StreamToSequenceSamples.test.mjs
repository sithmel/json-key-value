//@ts-check
import assert from "assert"
import pkg from "zunit"
import fs from "fs/promises"
import path from "path"

import SequenceToObject from "../src/SequenceToObject.mjs"
import StreamToSequence from "../src/StreamToSequence.mjs"

const { describe, it, oit, beforeEach } = pkg

describe("StreamToSequence sample files", () => {
  let parser
  beforeEach(() => {
    parser = new StreamToSequence()
  })
  for (const filename of [
    "creationix.json",
    "npm.json",
    "wikipedia.json",
    "twitter.json",
  ]) {
    it(`works with ${filename}`, async () => {
      const builder = new SequenceToObject()
      const json = await fs.readFile(path.join("test", "samples", filename), {
        encoding: "utf-8",
      })
      for (const [k, v] of parser.iter(json)) {
        builder.add(k, v)
      }

      assert.equal(parser.isFinished(), true)
      const parsed = JSON.parse(json)
      assert.deepEqual(builder.object, parsed)
    })
  }
})
