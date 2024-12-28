import StreamToSequence from "../src/StreamToSequence.mjs"
import SequenceToObject from "../src/SequenceToObject.mjs"
import fs from "fs"
import path from "path"
import perform from "./utils/index.mjs"

async function filterFile(JSONPath, lineNumber) {
  const readStream = fs.createReadStream(JSONPath)
  const parser = new StreamToSequence({
    includes: `${lineNumber}`,
    maxDepth: 1,
  })
  const builder = new SequenceToObject({ compactArrays: true })

  for await (const chunk of readStream) {
    for (const [path, value] of parser.iter(chunk)) {
      builder.add(path, value)
    }
  }
  readStream.destroy()
  return builder.object
}

const JSON_PATH = path.join("test", "samples", "twitter.json")

perform(
  "Extracting 1 random tweet from a twitter file, using StreamToSequence",
  async () => {
    const lineNumber = Math.floor(Math.random() * 16000)
    const obj = await filterFile(JSON_PATH, lineNumber)
  },
)
