import { PathMatcher } from "../src/PathMatcher.mjs"
import StreamToSequenceTokenizer from "../src/StreamToSequenceTokenizer.mjs"
import fs from "fs"
import path from "path"

async function filterFile(filename) {
  const readStream = fs.createReadStream(
    path.join("test", "samples", filename),
    { encoding: "utf-8" },
  )
  const parser = new StreamToSequenceTokenizer()

  for await (const chunk of readStream) {
    for (const token of parser.iter(chunk)) {
    }
  }
  readStream.destroy()
}

let t0 = performance.now()
// console.profile()
const obj = await filterFile("twitter.json")
// console.profileEnd()
// console.log(obj)
console.log(performance.now() - t0)
