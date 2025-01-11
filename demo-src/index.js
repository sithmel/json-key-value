import { StreamToSequence, SequenceToObject } from "../src/index.mjs"

const formElement = document.querySelector("form")
const dataElement = document.querySelector("#data")
const indexElement = document.querySelector("#index")
const queryElement = document.querySelector("#query")
const filenameElement = document.querySelector("#filename")

async function fetchIndex(filename, index) {
  const indexFilename = `index_${filename}`
  const controller = new AbortController()
  const signal = controller.signal

  let response = await fetch(indexFilename, { signal })
  const readable = response.body
  const parser = new StreamToSequence({
    includes: `${index}`,
    maxDepth: 1,
  })
  const builder = new SequenceToObject({ compactArrays: true })
  for await (const chunk of readable) {
    if (parser.isExhausted()) break
    for (const [path, value] of parser.iter(chunk)) {
      builder.add(path, value)
    }
  }
  controller.abort()

  return builder.object[0]
}

async function fetchRecord(filename, index, query) {
  const [startByte, endByte] = await fetchIndex(filename, index)
  const controller = new AbortController()
  const signal = controller.signal

  let response = await fetch(filename, {
    signal,
    headers: {
      Range: `bytes=${startByte}-${endByte - 1}`,
    },
  })
  const readable = response.body
  const options = query ? { includes: query } : undefined
  const parser = new StreamToSequence(options)

  const builder = new SequenceToObject({ compactArrays: true })
  for await (const chunk of readable) {
    if (parser.isExhausted()) break
    for (const [path, value] of parser.iter(chunk)) {
      builder.add(path, value)
    }
  }
  controller.abort()

  return builder.object
}

formElement.addEventListener("submit", (e) => {
  e.preventDefault()
  const filename = filenameElement.value
  const index = parseInt(indexElement.value, 10)
  const queryRaw = queryElement.value.trim()
  const query = queryRaw === "" ? null : queryRaw

  fetchRecord(filename, index, query).then((json) => {
    dataElement.innerHTML = JSON.stringify(json, undefined, 2)
  })
})
