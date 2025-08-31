//@ts-check
import fs from "fs"
import path from "path"
import perform from "./utils/index.js"
import { streamToIterable } from "../src/index.js"

/** @type {import("fast-json-patch").Operation[]} */
const patch = [
  { op: "replace", path: "/1100/text", value: "Hello world" },
  {
    op: "add",
    path: "/5000",
    value: {
      created_at: "Mon, 19 Dec 2011 18:54:27 +0000",
      from_user: "donnfelker",
      from_user_id: 14393851,
      from_user_id_str: "14393851",
      from_user_name: "Donn Felker",
      geo: null,
      id: 148838620537696260,
      id_str: "148838620537696256",
      iso_language_code: "en",
      metadata: { result_type: "recent" },
      profile_image_url:
        "http://a0.twimg.com/profile_images/1514965492/Photo_on_2011-08-26_at_15.28_2_normal.jpg",
      profile_image_url_https:
        "https://si0.twimg.com/profile_images/1514965492/Photo_on_2011-08-26_at_15.28_2_normal.jpg",
      source:
        "&lt;a href=&quot;http://www.tweetdeck.com&quot; rel=&quot;nofollow&quot;&gt;TweetDeck&lt;/a&gt;",
      text: "My last 3 days  - Android. Python. NodeJs. MongoDB. MySql. Sqlite. Json. Html. JavaScript. Django.",
      to_user: null,
      to_user_id: null,
      to_user_id_str: null,
      to_user_name: null,
    },
  },
  { op: "remove", path: "/2000" },
]

async function patchJSONFile(JSONPath, patch) {
  const readStream = fs.createReadStream(JSONPath)
  await streamToIterable(readStream, { maxDepth: 2 })
    .patch(patch)
    .forEach((item) => {
      // Process each item as needed
    })
  readStream.destroy()
}

const JSON_PATH = path.join("test", "samples", "twitter.json")

perform("Patching a big file with streamToIterable", async () => {
  await patchJSONFile(JSON_PATH, patch)
})
