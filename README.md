# json-key-value

json-key-value is a toolkit to work with JSON as they are converted to a sequence to path value pairs. It is minimal (no dependencies) but work well with other libraries. It is designed for both server and client.

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

## StreamToSequence

StreamToSequence converts chunk of strings coming from an iterable in a sequence.
It is implemented as a [rfc8259](https://datatracker.ietf.org/doc/html/rfc8259) compliant parser. String decoding from buffer is not provided, leaving that to different buffer implementations ([node buffers](https://nodejs.org/api/buffer.html) of [web streams](https://nodejs.org/api/webstreams.html)). See the [examples](#examples) below!

```js
import { StreamToSequence } from "json-key-value"

const parser = new StreamToSequence()
for (const chunk of ['{"hello": "wo', '"rld"}']) {
  for (const [path, value] of parser.iter(chunk)) {
    console.log(path, value) // ["hello"] "world"
  }
}
```

_There is an extremely rare corner case where the parser doesn't work as expected: when a json consists in a **single number and no trailing spaces**. In that case it is necessary to add a trailing space to make it work correctly!_

## ObjectToSequence

ObjectToSequence transforms a js object into a sequence:

```js
import { ObjectToSequence } from "json-key-value"

const parser = new ObjectToSequence()
for (const [path, value] of parser.iter({ hello: world })) {
  console.log(path, value) // ["hello"] "world"
}
```

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
const jsonStreamer = new SequenceToStream({
  onData: async (data) => {
    str += data // this is an async function to allow writing to a buffer
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

### reviver

The native [JSON parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) has an optional argument "reviver" that allows to transform the js object. This can't work on a sequence, and for this reason is provided as a separate function.

```js
import { reviver } from "json-key-value"

const newObject = reviver(obj)
```

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
These can be transformed using a for await loop, and then converted to an object (SequenceToObject) or a JSON stream (SequenceToStream):

```js
import { SequenceToObject, ObjectToSequence } from "json-key-value"

function getPricesWithVAT(obj) {
  const builder = new SequenceToObject()
  const parser = new ObjectToSequence()
  for (const await [path, value] of parser.iter(obj)) {
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

## PathMatcher

A frequent type of filtering of these sequences is based on the "path". This is more complex than a simple filter, because it should be able to figure out when matches are no longer possible so that it is not necessary to parse the rest of the JSON.

```js
import { SequenceToObject, ObjectToSequence, PathMatcher } from "json-key-value"

function getPricesWithVAT(obj) {
  const builder = new SequenceToObject()
  const parser = new ObjectToSequence()
  const matcher = new PathMatcher([[match("prices")]]) // this is a path expression (see below)
  for (const [path, value] of matcher.filterSequence(parser.iter(obj))) {
    builder.add(path.slice(1), value * 1.2)
  }
  return builder.object
}
```

`filterSequence` is a shorthand method that allows to filter an iterable by path.
It is the equivalent of:

```js
import { SequenceToObject, ObjectToSequence, PathMatcher } from "json-key-value"

function getPricesWithVAT(obj) {
  const builder = new SequenceToObject()
  const parser = new ObjectToSequence()

  const matcher = new PathMatcher([[match("prices")]])

  for (const [path, value] of parser.iter(obj)) {
    // ingest the path and check
    // - does it match? (doesMatch)
    // - are there any other matches possible? (isExhausted)
    matcher.nextMatch(path)
    if (matcher.doesMatch) {
      builder.add(path.slice(1), value * 1.2)
    }
    if (matcher.isExhausted) {
      break
    }
  }
  return builder.object
}
```

## Path expressions

Path expressions are a concise way to match a JSON fragment by path. It is not a general purpose query language like [json pointer](https://datatracker.ietf.org/doc/rfc6901/) or [json path](https://datatracker.ietf.org/doc/draft-ietf-jsonpath-base/). Because they are designed to work on js objects while streamed. Path expressions are intentionally limited to performant filtering of path/value sequences.
With path expressions you can match fragments of path by their position, array indices and slices.
Here are a list of features that were deliberately excluded as they make impossible to terminate the stream as soon as all possible matches are exhausted:

- any type of fragment matching that is not a direct match (negative match, globbing, reg exp )
- match by value
- fragment match at any level

These can all be easily implemented using a regular **filter** function, like the one that can be found in [iter-tools](https://github.com/iter-tools/iter-tools).
Enough with the explanation! Let's have a look at the syntax.

## Path expressions as arrays

A single path expression allows to match a subtree of a JSON by its path.
For example:

```
[{type: "match", match: "universe"}]
```

Matches all paths starting with "universe". For example:

```
["universe"]
["universe", "earth"]
etc.
```

It is possible to specify a subtree like this:

```
[{type: "match", match: "universe"}, {type: "match", match: "earth"}]
```

That matches:

```
["universe", "earth"]
["universe", "earth", "Europe"]
etc.
```

And doesn't match

```
["universe"]
["universe", "mars"]
etc.
```

Path expressions support direct match of object keys and array indexes as well as array slices.
_match_ is used for direct match of object keys or array index.
_slice_ is used to match an interval of indexes.

- `{type: "match", match: "universe"}`
- `{type: "match", match: 2}`
- `{type: "slice": sliceFrom: 0, sliceTo: 3}`

They are used in an array to allow multiple matches:

```
[
  [{type: "match", match: "hello"}, {type: "match", match: 2}],
  [{type: "match", match: "world"}, {type: "slice": sliceFrom: 0, sliceTo: 3}],
]
```

These are matching paths that starts with:

- **["hello", 2]**
- **["world", 0]**
- **["world", 1]**
- **["world", 2]**

It is also possible to use helpers to make it more concise:

```
[
  [match("hello"), match(2)],
  [match("world"), slice(0, 3)],
]
```

Using the slice helper, if the first index is omitted, is assumed to be 0, if the last is omitted is assumed to be Infinity.

## Path expressions as strings

This is a shorthand syntax to define Path expressions:

```
hello[2],world[0:3]
```

This is the much shorter equivalent of the previous example.
These are all equivalent expressions:

```
"hello".2,"world".0:3
["hello"].2,["world"].0:3
"hello"[2],"world"[0:3]
```

Either brackets or dots can be used as separators. Strings can be wrapped in double quotes: in this case any character can be used, but special character needs to be escaped as described in the [JSON specs](https://datatracker.ietf.org/doc/html/rfc8259). Unquoted strings can be used but only letters, numbers and underscores can be used.
On slices, if the first number is omitted, is considered 0, if the second number is omitted is considered Infinity.

**stringToPathExp and pathExpToString** can be used to convert string to path expressions and vice versa. PathMatcher does the conversion automatically.

# Examples

## Filter a JSON stream

In this example shows how to filter a JSON using fetch without loading it into memory.

```js
import { StreamToSequence, SequenceToStream, PathMatcher } from "json-key-value"

// this transform a readable stream into an asyncIterable of chunks
async function* decodedReadableStream(readable) {
  const decoder = new TextDecoder()
  for await (const value of readable) {
    yield decoder.decode(value, { stream: true })
  }
}
async function filterJSONStream(readable, writable, include, controller) {
  const encoder = new TextEncoder()
  const writer = writable.getWriter()

  const parser = new StreamToSequence()
  const builder = new SequenceToStream({
    onData: async (data) => writer.write(encoder.encode(data)),
  })
  const matcher = new PathMatcher(include)

  for await (const chunk of decodedReadableStream(readable)) {
    if (matcher.isExhausted) {
      break
    }

    for (const [path, value] of parser.iter(chunk)) {
      matcher.nextMatch(path)
      if (matcher.doesMatch) {
        builder.add(path, value)
      }
      if (matcher.isExhausted) {
        break
      }
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
import { StreamToSequence, SequenceToObject, PathMatcher } from "json-key-value"

async function filterFile(filename, include) {
  const readStream = fs.createReadStream(filename, { encoding: "utf-8" })
  const parser = new StreamToSequence()
  const builder = new SequenceToObject()
  const matcher = new PathMatcher(include)

  for await (const chunk of readStream) {
    if (matcher.isExhausted) {
      break
    }

    for (const [path, value] of parser.iter(chunk)) {
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

From the point of view of raw speed StreamToSequence is approximatively 10 times slower.
However, there are 2 specific cases that makes it convenient:

### Memory footprint

StreamToSequence is much more memory friendly, not having to load the entire JSON as a string in memory. In my experience this doesn't necessarily reflect in a speed penalty, as the garbage collector is very fast. However, loading huge file can cause to run out of memory.

### Partial loading

Using PathMatcher, we don't necessarily need to read an entire stream to get the data we need.
That means that there are 2 factors to influence the speed:

- How much of the stream do I need to read as average?
- How fast is the stream? (is it a file on a local SSD? a network resource? etc.)

This is often something worth testing before picking the right tool.
