//@ts-check
import fs from "fs"
import path from "path"
import perform from "./utils/index.js"

async function filterFile2(JSONPath, lineNumber) {
  const readStream = fs.createReadStream(JSONPath, { encoding: "utf-8" })

  let str = ""
  for await (const s of readStream) {
    str += s
  }

  return JSON.parse(str)[lineNumber]
}

const JSON_PATH = path.join("test", "samples", "twitter.json")

perform(
  "Extracting 1 random tweet from a twitter file, using JSON.parse",
  async () => {
    const lineNumber = Math.floor(Math.random() * 16000)
    const obj = await filterFile2(JSON_PATH, lineNumber)
  },
)
