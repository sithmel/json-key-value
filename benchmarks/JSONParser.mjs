import { PathMatcher } from "../src/PathMatcher.mjs"
import JSONParser from "../src/JSONParser.mjs"
import ObjBuilder from "../src/ObjBuilder.mjs"
import fs from "fs"
import path from "path"

async function filterFile(filename, include) {
  const readStream = fs.createReadStream(
    path.join("test", "samples", filename),
    { encoding: "utf-8" },
  )
  const parser = new JSONParser()
  const builder = new ObjBuilder({ compactArrays: true })
  const matcher = new PathMatcher(include)

  for await (const chunk of readStream) {
    if (matcher.isExhausted) {
      break
    }

    for (const [path, value] of parser.parse(chunk)) {
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

let t0 = performance.now()
// console.profile()
const obj = await filterFile("twitter.json", "[1000]")
// console.profileEnd()
// console.log(obj)
console.log(performance.now() - t0)
