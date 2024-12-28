# json-key-value

json-key-value is a toolkit to work with JSON and JS object as they are converted to a sequence to path value pairs (using iterables).
It enables using filter, map reduce techniques in a way that is readable, simpler and efficient.

It is minimal (no dependencies) but work well with other libraries. It is designed for both server and client.

## The idea

The main idea behind this library is that a JSON can be converted into a sequence of "path, value" pairs and can be reconstructed from this sequence.
This allows to filter and transform a big JSON as a stream, without having to load it in memory. It also make it easier to work with JSON and JS objects using filter/map/reduce.

An example of a sequence is:

| Path, Value                | Resulting object                                         |
| -------------------------- | -------------------------------------------------------- |
| [], {}                     | {}                                                       |
| ["name"], "json-key-value" | {"name": "json-key-value"}                               |
| ["keywords"], []           | {"name": "json-key-value", keywords: []}                 |
| ["keywords", 0], "json"    | {"name": "json-key-value", keywords: ["json"]}           |
| ["keywords", 1], "stream"  | {"name": "json-key-value", keywords: ["json", "stream"]} |

## About the ordering

Streaming out JSON requires the "path, value" pairs to be emitted in **depth first** order of paths otherwise the resulting JSON will be malformed. This is the normal order in which data are stored in JSON.
Alternatively, it also works if the paths are sorted comparing object keys in lexicographic order and array indexes from the smallest to the biggest. In this case, the structure will be respected, but not necessarily the order the keys presents in the original JSON (ES2015 standard introduced the concept of key ordering, but it is not respected here).

## Example use cases

### Rendering partial state

Fetching a big JSON on the browser and render the data in the UI while being downloaded (no need to wait for the entire file to be downloaded).

### Filter data

Using json-key-value in the backend to fetch a JSON from some source (db, file system, network) and filter the data needed. The `include` expression can be passed as query parameter or in the body, so that a browser can use a graphql like syntax to avoid overfetching. See the [benchmarks](#benchmarks).

### Easy Data manipulation

Transforming a tree data structure (like a Javascript object) is not super convenient. With json-key-value you can simply iterate over the sequence and use familiar filter/map/reduce.

# API

## StreamToSequence

StreamToSequence converts chunk of data coming from an iterable in a sequence.
It is implemented as a [rfc8259](https://datatracker.ietf.org/doc/html/rfc8259) compliant parser. It takes a buffer as input, these can come from different implementations ([node buffers](https://nodejs.org/api/buffer.html) of [web streams](https://nodejs.org/api/webstreams.html)). See the [examples](#examples) below!

Let's assume we have this JSON:

```json
[
  {"firstName": "Bruce", "lastName": "Banner"},
  {"firstName": "Peter", "lastName": "Parker"},
  ...
]
```

```js
import { StreamToSequence } from "json-key-value"

const parser = new StreamToSequence()
for async (const chunk of bufferIterable) {
  for (const [path, value] of parser.iter(chunk)) {
    console.log(path, value)
  }
}
```

This will print:

```
[] []
[0] {}
[0, "firstName"] "Bruce"
[0, "lastName"] "Banner"
[1] {}
[1, "firstName"] "Peter"
[1, "lastName"] "Parker"
...
```

_There is an extremely rare corner case where the parser doesn't work as expected: when a json consists in a **single number and no trailing spaces**. In that case it is necessary to add a trailing space to make it work correctly!_

StreamToSequence takes 2 optional parameters: _maxDepth_ and _includes_.

maxDepth is used to group the data over a certain depth together. It also allows to considerable increase the speed of the parsing when used together with _includes_.

Here is how it works:

Let's assume we use the same JSON used above:

```js
import { StreamToSequence } from "json-key-value"

const parser = new StreamToSequence({maxDepth: 1})
for async (const chunk of bufferIterable) {
  for (const [path, value] of parser.iter(chunk)) {
    console.log(path, value)
  }
}
```

This will print:

```
[] []
[0] {"firstName": "Bruce", "lastName": "Banner"}
[1] {"firstName": "Peter", "lastName": "Parker"}
...
```

_includes_ allows to select what paths we want to read and filter the others. It is much faster then filtering the pairs after are emitted because allows stop parsing the stream if no further matches are possible. Here is an example (using the same JSON):

```js
import { StreamToSequence } from "json-key-value"

const parser = new StreamToSequence({includes: '0 (firstName)'})
for async (const chunk of bufferIterable) {
  for (const [path, value] of parser.iter(chunk)) {
    console.log(path, value)
  }
}
```

With this output

```
[0, "firstName"] "Bruce"
...
```

More about [includes](#includes) syntax below!

The iter method yields 2 extra numbers. They are the starting and ending position of the buffer, corresponding to the value that is emitting.
So for example, with the JSON we used so far:

```js
import { StreamToSequence } from "json-key-value"

const parser = new StreamToSequence({maxDepth: 1})
for async (const chunk of bufferIterable) {
  for (const [path, value, startPosition, endPosition] of parser.iter(chunk)) {
    console.log(path, value, startPosition, endPosition)
  }
}
```

This will print:

```
[] [] 0 1
[0] {"firstName": "Bruce", "lastName": "Banner"} 4 49
[1] {"firstName": "Peter", "lastName": "Parker"} 53 98
...
```

Once the position of a value is known, is possible for example:

- to index where the data is in the buffer and access them directly
- to pause and resume the parsing from that position in the buffer

It is possible to resume the parsing using the option `startingPath`.
So for example, let's say we want to resume reading from "Peter Parker":

```js
import { StreamToSequence } from "json-key-value"

const parser = new StreamToSequence({maxDepth: 1, startingPath: [1]})
// bufferIterable MUST start from the byte number 53

for async (const chunk of bufferIterable) {
  for (const [path, value, startPosition, endPosition] of parser.iter(chunk)) {
    console.log(path, value, startPosition, endPosition)
  }
}
```

This will print:

```
[1] {"firstName": "Peter", "lastName": "Parker"} 0 45
...
```

In this case startPosition and endPosition will be relative to the buffer starting on byte 53.

## ObjectToSequence

ObjectToSequence transforms a js object into a sequence:

```js
import { ObjectToSequence } from "json-key-value"

const parser = new ObjectToSequence()
for (const [path, value] of parser.iter({ hello: world })) {
  console.log(path, value)
}
```

This prints:

```js
[] {}
['hello'] 'world'
```

ObjectToSequence takes 2 optional parameters: _maxDepth_ and _includes_.
They works exactly the same as for StreamToSequence.

## SequenceToObject

SequenceToObject reconstructs an object from a sequence:

```js
import { SequenceToObject } from "json-key-value"

const objBuilder = new SequenceToObject()
objBuilder.add([], {}) // build initial object
objBuilder.add(["hello"], "world")
objBuilder.object === { hello: "world" }
```

The implementation forgives if "containers" (arrays and objects) are omitted

```js
const objBuilder = new SequenceToObject()
objBuilder.add(["hello"], "world")
objBuilder.object === { hello: "world" }
```

It also fills empty array positions with nulls:

```js
const objBuilder = new SequenceToObject()
objBuilder.add([2], "hello world")
objBuilder.object === [null, null, "hello world"]
```

Unless the options `compactArrays` is true:

```js
const objBuilder = new SequenceToObject({ compactArrays: true })
objBuilder.add([2], "hello world")
objBuilder.object === ["hello world"]
```

## SequenceToStream

SequenceToStream allows to reconstruct a JSON stream from a sequence:

```js
import { SequenceToStream } from "json-key-value"

let str = ""
const decoder = new TextDecoder()
const jsonStreamer = new SequenceToStream({
  onData: async (data) => {
    // this is normally used for writing to a buffer
    // but in here we are decoding the buffer as js string
    str += decoder.decode(data)
  },
})
jsonStreamer.add([], {}) // build initial object
jsonStreamer.add(["hello"], "world")
await jsonStreamer.end() // wait that all pairs are emitted
str === '{"hello":"world"}'
```

_The sequence must be in "depth first" order (with ordered indices), otherwise it won't work!_
Also notice, the _end_ method must be called after adding all the path, value pairs.
The implementation forgives if "containers" (arrays and objects) are omitted.

```js
let str = ""
const jsonStreamer = new SequenceToStream({
  onData: async (data) => {
    str += data
  },
})
jsonStreamer.add(["hello"], "world")
await jsonStreamer.end()
str === '{"hello":"world"}'
```

It also fills empty array positions with nulls:

```js
let str = ""
const jsonStreamer = new SequenceToStream({
  onData: async (data) => {
    str += data
  },
})
jsonStreamer.add([2], "hello world")
await jsonStreamer.end()
str === '[null,null,"hello world"]'
```

Unless the options `compactArrays` is chosen:

```js
let str = ""
const jsonStreamer = new SequenceToStream({
  onData: async (data) => {
    str += data
  },
  compactArrays: true,
})
jsonStreamer.add([2], "hello world")
await jsonStreamer.end()
str === '["hello world"]'
```

## Utilities

### parseIncludes

This utility converts a string in a data structure used to filter paths. This is used internally but is also exposed to be used for debugging, ensure that the include syntax is correct, and reformat the includes expression.

```js
import { parseIncludes } from "json-key-value"

const matcher = parseIncludes(
  `
"A"(
  "B"(
    "C" # test comment 1
    "D"
  ) # test comment 2
  "E" 
)
"F"
`,
) // this returns a matcher object

matcher.maxLength() // this is the minimum length of the path to be matched. It cannot be greater than the maxDepth parameter (no matches are possible that way)
matcher.doesMatch(["A", "B"]) // this matches
matcher.doesMatch(["F", "B"]) // this matches
matcher.doesMatch(["X"]) // this doesn't match
matcher.isExhausted() // this is now false
// As no match is possible since A and F have passed

matcher.stringify() // this returns: "'A'('B'('C' 'D') 'E') 'F'"

matcher.stringify("  ") // this returns an nicely indented version (2 spaces indentation)
```

Note: The compact version of the expression (returned by stringify without arguments) has been designed to be passed as query parameter minimising the characters encoded (only the spaces), so that `'A'('B'('C' 'D') 'E') 'F'` becomes:
`'A'('B'('C'%20'D')%20'E')%20'F'`.

### pathConverter

PathConverter is a utility class that converts paths in strings (and vice versa).
It is designed to emit strings that can be stored in a database and retrieved in lexicographic order.

```js
import { PathConverter } from "json-key-value"

const separator = "//"
const numberPrefix = "@@"
const pathConverter = new PathConverter(separator, prefix)
const path = ["hello", "world", 1]
const pathString = pathConverter.pathToString(path) // "hello//world//@@A1"
path === pathConverter.stringToPath(pathString)
```

# Work with the sequence

Both StreamToSequence.iter and ObjectToSequence.iter return an iterable of path/value pairs.
These can be transformed using a for loop, and then converted to an object (SequenceToObject) or a JSON stream (SequenceToStream):

```js
import { SequenceToObject, ObjectToSequence } from "json-key-value"

function getPricesWithVAT(obj) {
  const builder = new SequenceToObject()
  const parser = new ObjectToSequence()
  for (const [path, value] of parser.iter(obj)) {
    if (path[0] === "prices") {
      builder.add(path.slice(1), value * 0.2)
    }
  }
  return builder.object
}
```

This converts:

```json
{
  "other data": {},
  "prices": {
    "Subscription 1 month": 20,
    "Subscription 2 month": 35,
    "Subscription 6 month": 100,
    "Subscription 1 year": 180
  }
}
```

to:

```json
{
  "Subscription 1 month": 24,
  "Subscription 2 month": 42,
  "Subscription 6 month": 120,
  "Subscription 1 year": 216
}
```

I suggest [iter-tools](https://github.com/iter-tools/iter-tools) to work with iterables and async iterables.

## Includes

The _includes_ parameter can be used on StreamToSequence and ObjectToSequence and it allows to only emit pairs with a certain path.
This is more limited than a simple filter, but it is able to figure out when matches are no longer possible so that it is not necessary to parse the rest of the JSON.
If more complex filtering is required, is easy enough to filter the sequence once is emitted.
This parameter uses a simple and compact expression to perform matches. Including:

- direct match of keys. Using a string enclosed in single or double quotes
- direct match of array indices. Using a number
- a way to match a slice of an array. Using 2 indices separated by 2 dots: 3..5 (matching index 3 and 4). If the first index is omitted is considered 0, if the last is omitted is considered Infinity
- a convenient \* operator that matches any index or key as long as there is one
- '()' to recursively match on multiple levels

It is easier to show. Here's the JSON example:

```json
{
  "products": {
    "123001" : {"productName": "piano catapult", "brand": "ACME"},
    "456001" : {"productName": "fake tunnel", "brand": "ACME"},
    ...
  },
  "invoices": [
    {"productCode": "123001", "itemsSold": 40, "unitPrice": 120},
    {"productCode": "456001", "itemsSold": 12, "unitPrice": 220},
    ...
  ]
}
```

We can use this expression:

```js
const includes = `
'invoices'(
  0..2(
    'itemsSold'
    'unitPrice'
  )
)
`
```

to get this sequence:

```
['invoices', 0, 'itemsSold'] 40
['invoices', 0, 'unitPrice'] 120
['invoices', 1, 'itemsSold'] 12
['invoices', 1, 'unitPrice'] 220
```

or

```js
const includes = `
'products'(
  *(
    'productName'
  )
)
`
```

to get this sequence:

```
['products', '123001', 'productName'] piano catapult
['products', '456001', 'productName'] fake tunnel
```

# Examples

## Filter a JSON stream

In this example shows how to filter a JSON using fetch without loading it into memory.

```js
import { StreamToSequence, SequenceToStream } from "json-key-value"

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

// the following function uses fetch to get a JSON
// it filters the sequence and abort the request after
// retrieving the data needed by the pathExpression
async function fetchAndFilter(url, pathExpression) {
  const controller = new AbortController()
  const signal = controller.signal

  let response = await fetch(url, { signal })
  let { readable, writable } = new TransformStream()
  let newResponse = new Response(readable, response)
  filterJSONStream(response.body, writable, pathExpression)
  return newResponse
}
```

## Filter a file using a node buffer

This function read part of a JSON from a file.

```js
import fs from "fs"
import { StreamToSequence, SequenceToObject } from "json-key-value"

async function filterFile(filename, includes) {
  const readStream = fs.createReadStream(filename)
  const parser = new StreamToSequence()
  const builder = new SequenceToObject()

  for await (const chunk of readStream) {
    for (const [path, value] of parser.iter(chunk)) {
      builder.add(path, value)
    }
  }
  readStream.destroy()
  return builder.object
}
```

## Streaming and non streaming parser

The library provides 2 ways to get a sequence `ObjectToSequence` and `StreamToSequence`.
You can use ObjectToSequence to return a sequence of path, value pairs from an object.

```js
import { ObjectToSequence } from "json-key-value"

const parser = new ObjectToSequence()
for (const [path, value] of parser.iter(obj)) {
  // ..
}
```

Of course you can easily convert it from a string:

```js
import { ObjectToSequence } from "json-key-value"

const parser = new ObjectToSequence()
for (const [path, value] of parser.iter(JSON.parse(obj))) {
  // ..
}
```

How does this differ from StreamToSequence? When should we use one or the other?
StreamToSequence is a streaming parser, so it doesn't require to load the entire string in memory to work.

From the point of view of raw speed StreamToSequence can be slower _if used to transform the entire JSON_ into a sequence especially _if the stream has low latency and high bandwidth_.

However, using **include** and **maxDepth** to filter the JSON can be considerably faster and memory efficient.
In doubt I suggest to benchmark specific cases.

### Benchmarks

I have included benchmarks to show how this library can speed up extracting data from a JSON.
In the examples I am extracting a single random record from a JSON with more than 16000 records (15MB).
As a reference I am comparing to reading the entire file and parsing with JSON.parse:

```
$ node benchmarks/standardFetch.mjs

Timings
=======
Mean:   43.39 ms
Median: 41.757 ms

Heap
====
Mean:   65,447.201 KB
Median: 65,295.816 KB
```

JSON.parse is really fast! But reading the entire file is really problematic from the point of view of memory management.

Here's how it works using StreamToSequence streaming parser with maxDepth and includes:

```
$ node benchmarks/efficientFetch.mjs

Timings
=======
Mean:   37.53 ms
Median: 38.145 ms

Heap
====
Mean:   6,216.219 KB
Median: 6,093.633 KB
```

It is a little bit faster (not having to read the entire file every time). But also much more memory efficient.

I have created a version that creates an index of the JSON file. So that it can be stored and records can be accessed directly:

```
$ node benchmarks/indexedFetch.mjs

Timings
=======
Mean:   1.669 ms
Median: 1.589 ms

Heap
====
Mean:   8,486.226 KB
Median: 8,434.977 KB
```

Which is 28 times faster than the out-of-the-box JSON.parse!

### How StreamToSequence is optimized

StreamToSequence reaches very good performance thanks to 2 optimizations:

- **No need to read the entire stream**: once the data specified by **include** are found, the stream can be aborted. The performance improvement increases with the latency of the stream.
- **Minimize encoding and parsing**: Encoding the buffer from UTF8 to a JS strings and parsing JSON values can take a considerable amount of resources. StreamToSequence works with buffers, encoding and parsing only the path and values that needs to be yielded. **maxDepth** and **include** both helps minimizing those.
