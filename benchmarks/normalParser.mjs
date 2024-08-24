//@ts-check
import fs from "fs"
import path from "path"

async function filterFile2(filename) {
  const readStream = fs.createReadStream(
    // path.join("/", "home", "sithmel", "Downloads", filename),
    path.join("test", "samples", filename),
    { encoding: "utf-8" },
  )

  let str = ""
  for await (const s of readStream) {
    str += s
  }

  return JSON.parse(str)
}

let t0 = performance.now()
// console.profile()
const obj2 = await filterFile2("twitter.json")
// console.profileEnd()
// global.gc()
console.log(performance.now() - t0)
