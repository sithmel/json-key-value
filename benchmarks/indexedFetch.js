import StreamToSequence from "../src/StreamToSequence.js"
import SequenceToObject from "../src/SequenceToObject.js"
import fs from "fs"
import path from "path"
import perform from "./utils/index.js"

async function createIndex(JSONPath, indexPath) {
  const readStream = fs.createReadStream(JSONPath)
  const parser = new StreamToSequence({
    maxDepth: 1,
  })
  const builder = new SequenceToObject({ compactArrays: true })

  for await (const chunk of readStream) {
    for (const [path, value, start, end] of parser.iter(chunk)) {
      if (path.length === 1) {
        builder.add(path, [start, end])
      }
    }
  }
  readStream.destroy()
  fs.writeFileSync(indexPath, JSON.stringify(builder.object))
}

async function filterFile(JSONPath, indexPath, lineNumber) {
  const indexReadStream = fs.createReadStream(indexPath)
  const parser = new StreamToSequence({
    includes: `${lineNumber}`,
    maxDepth: 1,
  })
  const builder = new SequenceToObject({ compactArrays: true })

  for await (const chunk of indexReadStream) {
    if (parser.isExhausted()) break
    for (const [path, value] of parser.iter(chunk)) {
      builder.add(path, value)
    }
  }
  indexReadStream.destroy()
  const [start, end] = builder.object[0]
  const JSONReadStream = fs.createReadStream(JSONPath, {
    start,
    end: end - 1,
    encoding: "utf-8",
  })
  let str = ""
  for await (const s of JSONReadStream) {
    str += s
  }
  JSONReadStream.destroy()
  const data = JSON.parse(str)
  return data
}

const JSON_PATH = path.join("test", "samples", "twitter.json")
const INDEX_PATH = path.join("test", "samples", "twitterIndex.json")

async function execute() {
  await createIndex(JSON_PATH, INDEX_PATH)
  await perform(
    "Extracting 1 random tweet from a twitter file, using StreamToSequence to create an index",
    async () => {
      const lineNumber = Math.floor(Math.random() * 16000)
      const obj = await filterFile(JSON_PATH, INDEX_PATH, lineNumber)
    },
  )
}

execute()
