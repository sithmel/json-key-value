//@ts-check
import assert from "assert"
import pkg from "zunit"

import StreamToSequence from "../src/StreamToSequence.js"
import SequenceToObject from "../src/SequenceToObject.js"
import fs from "fs"
import path from "path"

const { xdescribe, describe, it, oit, before } = pkg

/**
 * @param {string} filename
 * @param {string} includes
 */
async function filterFile(filename, includes) {
  const readStream = fs.createReadStream(path.join("test", "samples", filename))
  const parser = new StreamToSequence({ includes })
  const builder = new SequenceToObject()

  for await (const chunk of readStream) {
    for (const [path, value] of parser.iter(chunk)) {
      builder.add(path, value)
    }
  }
  readStream.destroy()
  return builder.object
}

describe("Example Node buffer", () => {
  it("filters", async () => {
    const obj = await filterFile("wikipedia.json", "'firstName' 'lastName'")
    assert.deepEqual(obj, {
      firstName: "John",
      lastName: "Smith",
    })
  })
})
