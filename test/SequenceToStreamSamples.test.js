//@ts-check
import assert from "assert"
import pkg from "zunit"
import fs from "fs"
import path from "path"

import SequenceToStream from "../src/SequenceToStream.js"
import StreamToSequence from "../src/StreamToSequence.js"

const { describe, oit, it, beforeEach } = pkg

describe("SequenceToStream sample files", () => {
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
      let str = ""
      const decoder = new TextDecoder()

      const builder = new SequenceToStream({
        onData: async (data) => {
          str += decoder.decode(data)
        },
      })
      const readStream = fs.createReadStream(
        path.join("test", "samples", filename),
      )

      const json = fs.readFileSync(path.join("test", "samples", filename), {
        encoding: "utf-8",
      })

      for await (const chunk of readStream) {
        for await (const [k, v] of parser.iter(chunk)) {
          builder.add(k, v)
        }
      }
      await builder.end()
      const original = JSON.parse(json)
      const copy = JSON.parse(str)
      assert.deepEqual(original, copy)
    })
  }
})
