import StreamToSequenceTokenizer from "../src/StreamJSONTokenizer.js"
import fs from "fs"
import path from "path"
import perform from "./utils/index.js"

async function tokenize(JSONPath) {
  const readStream = fs.createReadStream(JSONPath)
  const parser = new StreamToSequenceTokenizer()
  const tokens = []
  for await (const chunk of readStream) {
    for (const token of parser.iter(chunk)) {
      tokens.push(token)
    }
  }
  readStream.destroy()
  return tokens
}
const JSON_PATH = path.join("test", "samples", "twitter.json")

perform("Tokenizing a sample file", async () => {
  const tokens = await tokenize(JSON_PATH)
})
