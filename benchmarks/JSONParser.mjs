import StreamToSequence from "../src/StreamToSequence.mjs"
import SequenceToObject from "../src/SequenceToObject.mjs"
import fs from "fs"
import path from "path"

async function filterFile(filename, includes) {
  const readStream = fs.createReadStream(path.join("test", "samples", filename))
  const parser = new StreamToSequence({ maxDepth: 1, includes })
  const builder = new SequenceToObject({ compactArrays: true })

  for await (const chunk of readStream) {
    for (const [path, value] of parser.iter(chunk)) {
      builder.add(path, value)
    }
  }
  readStream.destroy()
  return builder.object
}

let t0 = performance.now()
console.profile()
const obj = await filterFile("twitter.json", "8000")
console.profileEnd()
// console.log(obj)
console.log(performance.now() - t0)
