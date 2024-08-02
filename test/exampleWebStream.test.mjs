//@ts-check
import assert from "assert"
import pkg from "zunit"

import StreamToSequence from "../src/StreamToSequence.mjs"
import SequenceToStream from "../src/SequenceToStream.mjs"

const { xdescribe, describe, it, oit, before } = pkg

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
 * @param {WritableStream} writable
 * @param {string} includes
 * @param {AbortController} controller
 */
async function filterJSONStream(readable, writable, includes, controller) {
  const encoder = new TextEncoder()
  const writer = writable.getWriter()

  const parser = new StreamToSequence({ includes })
  const builder = new SequenceToStream({
    onData: async (data) => writer.write(data),
  })

  for await (const chunk of readable) {
    for (const [path, value] of parser.iter(chunk)) {
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
    await filterJSONStream(testStream, writable, "'test'", controller)
    assert.equal(output.text, '{"test":1}')
  })
})
