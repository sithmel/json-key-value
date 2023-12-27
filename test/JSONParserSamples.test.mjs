//@ts-check
import assert from "assert"
import pkg from "zunit"
import fs from "fs/promises"
import path from "path"

import ObjBuilder from "../src/ObjBuilder.mjs"
import JSONParser from "../src/JSONParser.mjs"

const { describe, it, beforeEach } = pkg

describe("JSONParser sample files", () => {
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
      const objBuilder = new ObjBuilder()
      const json = await fs.readFile(path.join("test", "samples", filename), {
        encoding: "utf-8",
      })
      for await (const [k, v] of parser.parse([json])) {
        objBuilder.add(k, v)
      }

      assert.equal(parser.isFinished(), true)
      const parsed = JSON.parse(json)
      assert.deepEqual(objBuilder.object, parsed)
    })
  }
})
