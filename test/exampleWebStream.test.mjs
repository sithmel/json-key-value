//@ts-check
import assert from "assert"
import pkg from "zunit"

import { filterByPath } from "../src/filterByPath.mjs"
import JSONParser from "../src/JSONParser.mjs"
import JSONBuilder from "../src/JSONBuilder.mjs"

const { describe, it, oit, before } = pkg

/**
 * @param {{text:string}} output
 * @returns {WritableStream}
 */
function getTestWritableStream(output) {
  output.text = ""
  const decoder = new TextDecoder()
  const queuingStrategy = new CountQueuingStrategy({ highWaterMark: 1 })

  return new WritableStream(
    {
      /**
       * @param {AllowSharedBufferSource} chunk
       * @returns {Promise<void>}
       */
      write(chunk) {
        return new Promise((resolve, reject) => {
          const decoded = decoder.decode(chunk, { stream: true })
          output.text += decoded
          resolve()
        })
      },
    },
    queuingStrategy,
  )
}

/**
 * @param {ReadableStream} readable
 * @return {AsyncGenerator<string>}
 */
async function* decodedReadableStream(readable) {
  const decoder = new TextDecoder()
  // @ts-ignore
  for await (const value of readable) {
    yield decoder.decode(value, { stream: true })
  }
}

/**
 * @param {ReadableStream} readable
 * @param {WritableStream} writable
 * @param {string} include
 * @param {AbortController} controller
 */
async function filterJSONStream(readable, writable, include, controller) {
  const encoder = new TextEncoder()
  const writer = writable.getWriter()

  const parser = new JSONParser()
  const builder = new JSONBuilder(async (data) => {
    writer.write(encoder.encode(data))
  })

  for await (const text of decodedReadableStream(readable)) {
    const iterable = parser.parse(text)
    for (const [path, value] of filterByPath(iterable, include)) {
      builder.add(path, value)
    }
  }
  controller.abort()
  await builder.end()
}

describe("Example web stream", () => {
  let testStream
  before(() => {
    testStream = new Blob(['{"hello": "world", "test": 1}'], {
      type: "text/plain",
    }).stream()
  })
  it("filters", async () => {
    const controller = new AbortController()
    const signal = controller.signal
    const output = { text: "" }
    const writable = getTestWritableStream(output)
    await filterJSONStream(testStream, writable, "test", controller)
    assert.equal(output.text, '{"test":1}')
  })
})
