import StreamToSequence from "../src/StreamToSequence.mjs"
import SequenceToObject from "../src/SequenceToObject.mjs"
import fs from "fs"
import path from "path"

async function filterFile(filepath, options) {
  const readStream = fs.createReadStream(filepath)
  const parser = new StreamToSequence(options)
  const builder = new SequenceToObject({ compactArrays: true })

  for await (const chunk of readStream) {
    for (const [path, value] of parser.iter(chunk)) {
      builder.add(path, value)
    }
  }
  readStream.destroy()
  return builder.object
}

const filepath = path.join("test", "samples", "twitter.json")
const include = "16000"
const maxDepth = 1
// const filepath = path.join("/", "home", "sithmel", "Downloads", "2024-04-08T19_26_09.287Z.json")
// const include = `
// * (
//   'packageId'
//   'contentType'
// )`
// const maxDepth = 2
let t0 = performance.now()
console.profile()
const obj = await filterFile(filepath, {
  include,
  maxDepth,
})
console.profileEnd()
console.log(performance.now() - t0)
// console.log(obj)
