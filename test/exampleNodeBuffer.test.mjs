//@ts-check
import assert from "assert"
import pkg from "zunit"

import { filterByPath } from "../src/filterByPath.mjs"
import JSONParser from "../src/JSONParser.mjs"
import ObjBuilder from "../src/ObjBuilder.mjs"
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
  const parser = new JSONParser()
  const builder = new ObjBuilder()

  const iterable = parser.parse(readStream)
  for await (const [path, value] of filterByPath(iterable, include)) {
    builder.add(path, value)
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
