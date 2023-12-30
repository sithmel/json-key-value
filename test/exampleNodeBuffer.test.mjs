//@ts-check
import assert from "assert"
import pkg from "zunit"

import { PathMatcher } from "../src/PathMatcher.mjs"
import StreamToSequence from "../src/StreamToSequence.mjs"
import SequenceToObject from "../src/SequenceToObject.mjs"
import fs from "fs"
import path from "path"

const { describe, it, oit, before } = pkg

/**
 * @param {string} filename
 * @param {string} include
 */
async function filterFile(filename, include) {
  const readStream = fs.createReadStream(
    path.join("test", "samples", filename),
    { encoding: "utf-8" },
  )
  const parser = new StreamToSequence()
  const builder = new SequenceToObject()
  const matcher = new PathMatcher(include)

  for await (const chunk of readStream) {
    if (matcher.isExhausted) {
      break
    }

    for (const [path, value] of parser.iter(chunk)) {
      matcher.nextMatch(path)
      if (matcher.doesMatch) {
        builder.add(path, value)
      }
      if (matcher.isExhausted) {
        break
      }
    }
  }
  readStream.destroy()
  return builder.object
}

describe("Example Node buffer", () => {
  it("filters", async () => {
    const obj = await filterFile("wikipedia.json", "firstName, lastName")
    assert.deepEqual(obj, {
      firstName: "John",
      lastName: "Smith",
    })
  })
})
