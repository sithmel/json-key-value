![JSONaut logo](https://raw.githubusercontent.com/sithmel/jsonaut/main/logo/logo.png)

JSONaut allows to work with JSON as streams, without the need to load them in memory.
It converts them into a sequence of path/value pairs (using iterables) and offers a lot of features to manipulate that sequence and returns it as object or as a new stream.

It is minimal (only 1 small dependency) but works well with other libraries. It is designed for both server and client.

## Index

- [Examples](#examples)
- [Main concepts](#main-concepts)
- [Functions and Classes](#functions-and-classes)
- [Benchmarks](#benchmarks)

## Examples

### Parsing a subset of a JSON

You can filter a stream to build an object that contains only the data required. See the [benchmarks](#benchmarks).

```js
import fs from "fs"
import { streamToIterable } from "jsonaut"

const readStream = fs.createReadStream("invoices.json")

const obj = await streamToIterable(readStream)
  .includes(
    `
    'invoices' (
      0..2 (
        # only these fields from the first 2 invoices
        'productName'
        'itemsSold'
        'unitPrice'
      )
    )
  `,
  )
  .toObject() // consumes the stream and transforms to an object

readStream.destroy()
console.log(obj)
```

This prints:

```js
{
  ;[
    { productName: "Bright copper kettles", itemSold: 12, unitPrice: 11.4 },
    { productName: "Warm woolen mittens", itemSold: 13, unitPrice: 1.44 },
  ]
}
```

### Filtering a JSON stream

This is the same example but it writes to a stream without deserialising the JSON:

```js
import fs from "fs"
import { streamToIterable } from "jsonaut"

const readStream = fs.createReadStream(inputFilePath)
const writeStream = fs.createWriteStream(outputFilePath)

await streamToIterable(readStream)
  .includes(`'invoices'( 0..2( 'productName' 'itemsSold' 'unitPrice'))`)
  .toIterableBuffer()
  .forEach((data) => {
    writeStream.write(data)
  })

writeStream.end()
readStream.destroy()
```

### Transform JSON stream

This is using filter and map to modify the data stream. It also uses reduce to aggregate the data. This is done without deserialising the entire object in memory:

```js
import fs from "fs"
import { streamToIterable, toValueObject } from "jsonaut"

const readStream = fs.createReadStream(inputFilePath)

// filter and map modify the iterable without consuming it
const mostSuccessfulProducts = streamToIterable(readStream, { maxDepth: 2 })
  .filter(([_pathObj, valueObj]) => {
    return valueObj.decoded.itemsSold >= 1000
  })
  .map(([pathObj, valueObj]) => {
    const value = valueObj.decoded
    return [
      pathObj,
      toValueObject({ ...value, total: value.itemsSold * value.unitPrice }),
    ]
  })

console.log("Revenues for most successful products")

const totalRevenues = await mostSuccessfulProducts.reduce(
  (acc, [_path, value]) => {
    const { productName, total } = value.decoded
    console.log(`Product "${productName}" revenues: ${total}`)
    return acc + total
  },
  0,
)

console.log("Total:", totalRevenues)

readStream.destroy()
```

### Rendering partial state

This is rendering the UI while a big JSON with the data is being fetched.

```js
import { streamToIterable, SequenceToObject } from "jsonaut"

// this will rebuild the object from a sequence
const objectBuilder = new SequenceToObject()

// fetch can be aborted
const controller = new AbortController()
const signal = controller.signal

const response = await fetch(url, { signal })

// iter is an asyncIterable of iterables (see BatchIterable)
const iter = streamToIterable(response.body)

for await (const iterables of iter) {
  // this adds to the object the chunk of sequence I could read so far
  for (const [path, value] of iterables) {
    objectBuilder.add(path, value)
  }
  // I can now render the object containing the data I fetched so far
  // "render" is left to implement
  render(objectBuilder.getObject())
  // I can decide to stop fetching and parsing the stream using abort
  // "shouldStop" is left to implement
  if (shouldStop()) {
    controller.abort()
    break
  }
}
```

### Index a JSON and load a JSON fragment

Let's assume we have a JSON containing a list of objects:

```json
[
  {
    "created_at": "Mon, 19 Dec 2011 18:56:59 +0000",
    "from_user": "edjoperez",
    "text": "I have to tell you: There is a project to create GTK bindings to #Nodejs, can you imagine javascript in a desktop GUI application? :D",
    ...
  },
  {
    "created_at": "Mon, 19 Dec 2011 18:54:27 +0000",
    "from_user": "donnfelker",
    "text": "My last 3 days  - Android. Python. NodeJs. MongoDB. MySql. Sqlite. Json. Html. JavaScript. Django.",
    ...
  },
  ...
]
```

This function creates an JSON containing the indexes of the various objects:

```js
import fs from "fs"
import path from "path"
import { streamToIterable } from "jsonaut"

async function createIndex(JSONPath, indexPath) {
  const readStream = fs.createReadStream(JSONPath)
  const indexObj = await streamToIterable(readStream, { maxDepth: 1 }).reduce(
    (builder, [path, _value, start, end]) => {
      if (path.length === 1) {
        builder.add(path.decoded, [start, end])
      }
      return builder
    },
    new SequenceToObject(),
  )
  readStream.destroy()
  fs.writeFileSync(indexPath, JSON.stringify(indexObj.object))
}
```

Like this:

```json
[
  [4, 899],
  [903, 1819],
  ...
]
```

Then the object can be read like this:

```js
import fs from "fs/promises"

async function filterFile(JSONPath, indexPath, lineNumber) {
  const indexReadStream = fs.createReadStream(indexPath)
  const obj = await streamToIterable(indexReadStream, { maxDepth: 1 })
    .includes(`${lineNumber}`)
    .toObject()

  const [start, end] = obj[0]
  // once I found the indeces I need, I can stop reading the stream
  indexReadStream.destroy()

  const str = await fs.readFile(JSONPath, {
    start,
    end: end - 1,
    encoding: "utf-8",
  })
  const data = JSON.parse(str)
  return data
}
```

On the browser we can implement the equivalent using HTTP range requests:

```js
async function filterFile(JSONURL, indexURL, lineNumber) {
  const controller = new AbortController()
  const signal = controller.signal

  let responseIndex = await fetch(indexURL, { signal })
  const indexReadStream = responseIndex.body

  const obj = await streamToIterable(indexReadStream, { maxDepth: 1 })
    .includes(`${lineNumber}`)
    .toObject()

  // once I found the indeces I need, I can stop reading the stream
  controller.abort()

  const [start, end] = obj[0]

  let responseJSON = await fetch(filename, {
    headers: {
      Range: `bytes=${start}-${end - 1}`,
    },
  })
  if (!responseJSON.ok) {
    throw new Error(`HTTP error! status: ${responseJSON.status}`)
  }
  const json = await responseJSON.json()
  return json
}
```

### Patch an object on the fly

You can a [rfc6902 patch](https://datatracker.ietf.org/doc/html/rfc6902) to modify a JSON on the fly without ever loading it in memory.

```js
import fs from "fs"
import { streamToIterable } from "jsonaut"

const readStream = fs.createReadStream(inputFilePath)
const writeStream = fs.createWriteStream(outputFilePath)

await streamToIterable(readStream)
  .patch([
    {op: 'add', '/invoices/0', value: { productName: "piano catapult", itemsSold: 40, unitPrice: 120}},
    {op: 'remove', '/invoices/500'},
  ])
  .toIterableBuffer()
  .forEach((data) => {
    writeStream.write(data)
  })

writeStream.end()
readStream.destroy()
```

# Main concepts

## Path, Value

The main idea behind this library is that a JSON can be converted into a sequence of "path, value" pairs and can be reconstructed from this sequence.
This allows to filter and transform a big JSON as a stream, without having to load it in memory.

An example of a sequence is:

| Path, Value               | Resulting object                                  |
| ------------------------- | ------------------------------------------------- |
| ["name"], "JSONaut"       | {"name": "JSONaut"}                               |
| ["keywords", 0], "json"   | {"name": "JSONaut", keywords: ["json"]}           |
| ["keywords", 1], "stream" | {"name": "JSONaut", keywords: ["json", "stream"]} |

## BatchIterable

A JSON stream can be read as [asyncIterable](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/AsyncIterator). Every chunk of the stream is a [typed array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array). Once parsed it yields [iterables](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators) of path/value pairs. For this reason, the sequence can be typed as `AsyncIterable<Iterable<[Path, Value]>>`.
I call `AsyncIterable<Iterable<T>>` a `BatchIterable<T>` for short.
Javascript makes unwieldy to work with a type defined like that. It basically requires a nested for loop like this one:

```js
for await (const iterables of asyncIter) {
  for (const [path, value] of iterables) {
    ...
  }
}
```

Treating synchronous iterables like async ones would have only penalised the performance.

For this reason I have abstracted this type in a class that offers some standard way to manipulate the sequence.
You can find the [documentation here](https://github.com/sithmel/batch-iterable).

## Path and Value encoding/decoding

### JSON Values

While building this library I noticed that most of the computation time goes into decoding arrayBuffers to a Javascript strings and deserialising them to js values. To keep the performance at a reasonable level, the library avoids decoding and parsing strings unless is strictly necessary.
This can be done using a set of classes that are storing the data as a buffer and they are decoding the data (and caching it) on demand.

Here is an example:

```js
import { False, CachedString } from "jsonaut"

const falseValue = new False()
const helloValue = new CachedString(
  new Uint8Array([34, 104, 101, 108, 108, 111, 34]),
)
console.log(falseValue.decoded) // false
console.log(falseValue.encoded) // false as Uint8Array encoded string

console.log(helloValue.decoded) // the "hello" javascript string
console.log(helloValue.encoded) // Uint8Array(7)[34, 104, 101, 108, 108, 111, 34]
```

These object have a method to check for equality without decoding the string:

```js
falseValue.isEqual(helloValue) // false
helloValue.isEqual(helloValue) // true
```

The value objects are:

- True
- False
- Null
- CachedString
- CachedNumber
- CachedSubObject

`toValueObject` is a function that converts a valid Javascript value into one of these objects:

```js
import { toValueObject } from "jsonaut"

const helloValue = toValueObject("hello")

console.log(helloValue instanceof CachedString) // true
```

**Note**: The buffer stored contains the JSON representation of the Javascript value. So in the case of strings it includes double quotes and escapes.

### JSON Path

Paths contains both string and numbers. Strings are also encoded using CachedString. Path are converted in encoded format using `toPathObject`

```js
import { toPathObject } from "jsonaut"

const path = toPathObject(["hello", "world", 0])
console.log(path.length) // 3
console.log(path.encoded) // [Uint8Array, UintArray, 0]

console.log(path.decoded) // ['hello', 'world', 0]

console.log(path.get(0)) // CachedString
console.log(path.get(0).decoded) // "hello"

console.log(path.get(2)) // 0
```

Path objects contain some extra utility functions:

```js
path.isEqual(otherPath) // true if the 2 paths are identical
const index = path.getCommonPathIndex(otherPath)
// returns the index of where the path segments are different.
// For example:
// index === 0  paths are entirely different
// index === path.length path is contained into otherPath
// index === otherPath.length otherPath is contained into path
```

### How to use it

```js
streamToIterable(readStream)
  .map(([pathObj, valueObj]) => {
    const value = valueObj.decoded
    return [
      pathObj,
      toValueObject({ ...value, total: value.itemsSold * value.unitPrice }),
    ]
  })
  .filter(([_pathObj, valueObj]) => valueObj.decoded.total >= 1000)
```

Just remember that decoding always comes with a performance penalty. So, when possible, use encoded buffer or use methods working with buffers (isEqual, getCommonPathIndex)
The performance penalty is only paid once though. Once a value is decoded, it is cached.

# Functions and Classes

## streamToIterable

This function takes a asyncIterable of buffers as input. This is the return value of Node.js and Web Streams:

```js
const readStream = fs.createReadStream("invoices.json")
streamToIterable(readStream)
```

or

```js
const response = await fetch(url)
streamToIterable(response.body)
```

The object returned is a batchIterable that it can be consumed like this:

```js
for await (const iterables of streamToIterable(readStream)) {
  for (const [path, value] of iterables) {
    console.log(path.decoded, value.decoded)
  }
}
```

It also supports all the methods listed [here](https://github.com/sithmel/batch-iterable). So it can also be consumed like this:

```js
streamToIterable(readStream).forEach(([path, value]) =>
  console.log(path.decoded, value.decoded),
)
```

Let's assume we are working with the following JSON:

```json
{
  "invoices": [
    {"productName": "piano catapult", "itemsSold": 40, "unitPrice": 120},
    {"productName": "fake tunnel", "itemsSold": 12, "unitPrice": 220},
    ...
  ]
}
```

The previous examples will return:

```js
["invoices", 0, productName] "piano catapult"
["invoices", 0, itemsSold] 40
["invoices", 0, unitPrice] 120
["invoices", 1, productName] "fake tunnel"
["invoices", 1, itemsSold] 12
["invoices", 1, unitPrice] 220
...
```

Note: _There is an extremely rare corner case where the parser doesn't work as expected: when a json consists in a **single number and no trailing spaces**. In that case it is necessary to add a trailing space to make it work correctly!_

### maxDepth and isMaxDepthReached

In some cases you would like to group more values together. You can do this limiting the depth of the parsing:

```js
streamToIterable(readStream, { maxDepth: 2 }).forEach(([path, value]) =>
  console.log(path.decoded, value.decoded),
)
```

Which it returns:

```js
["invoices", 0] {"productName": "piano catapult", "itemsSold": 40, "unitPrice": 120}
["invoices", 1] {"productName": "fake tunnel", "itemsSold": 12, "unitPrice": 220}
...
```

Rather than using a fixed maxDepth you can decide whether to limit the parsing based on the current path:

```js
import { toPathObject } from "jsonaut"

const invoicesPath = toPathObject(["invoices"])

streamToIterable(readStream, {
  isMaxDepthReached: (path) =>
    path.getCommonPathIndex(invoicesPath) === 1 && path.length === 2,
}).forEach(([path, value]) => console.log(path.decoded, value.decoded))
```

Note: Limiting the depth of parsing is also a way to increase the performance.

### Transform the sequence

You can reconstruct an object out of a sequence using `toObject`.

```js
const obj = await streamToIterable(readStream).toObject()
```

Or return a `BatchIterable<Uint8Array>` to transform the sequence back to a stream.

```js
await streamToIterable(readStream)
  .toIterableBuffer()
  .forEach((data) => {
    writeStream.write(data)
  })

writeStream.end()
readStream.destroy()
```

In building an object or streaming it out you have to consider 2 important caveats:

- Streaming out JSON requires the "path, value" pairs to be emitted in **depth first** order of paths otherwise the resulting JSON will be malformed
- Objects/Stream JSON won't contain holes in the array and actually array indexes in the paths are pretty much ignored. Arrays order depends on the order of the sequence

BatchIterable offers other methods to transform the sequence: [map, filter, flatmap, drop, take](https://github.com/sithmel/batch-iterable) and many more!

### filter the sequence efficiently

_includes_ allows to select what paths we want to read and filter out the others. It is much faster then using regular **filter** because it stops parsing the stream if no further matches are possible. Here is an example (using the same JSON):

```js
await streamToIterable(readStream)
  .includes('"invoices" ( 0..2 ("productName"))')
  .forEach(([path, value]) => {
    console.log(path, value)
  })

readStream.destroy()
```

This will print:

```js
['invoices', 0, 'productName'] 'piano catapult'
['invoices', 1, 'productName'] 'fake tunnel'
```

More about [includes](#includes) syntax below!

### Modify the sequence

The sequence can be modified using add, remove, replace methods. They are implemented following [rfc6902](https://datatracker.ietf.org/doc/html/rfc6902).

- **add**: add a value to a specific path. It throws an error ff the container is not found. If the container is an array, it inserts the value and shifts the other items
- **remove**: remove a path. It throws an error if the container of the item to remove is not found. If the item is inside an array, it compacts the array
- **replace**: it removes a value on a certain path with another
- **test**: it returns the sequence but it throws an error if the path and values in the sequence are not found
- **patch**: it allows to use a [rfc6902](https://datatracker.ietf.org/doc/html/rfc6902) compatible object to implement the changes. It has some limitation (no move or copy operations are allowed) but It is cross compatible with the output of the "compare" function in [json-fast-patch](https://www.npmjs.com/package/fast-json-patch).

Example:

```js
await streamToIterable(readStream)
  .add(["invoices", "3"], {productName: 'piano catapult', itemSold: 3, })
  .test([["invoices", "10", "productName"], 'Fake beard')
  .replace(["invoices", "10", "itemSold"], 12)
  .remove(["invoices", "20"])
```

Which is equivalent to:

```js
await streamToIterable(readStream)
  .patch([
    {op: 'add', path: "/invoices/3", value: {productName: 'piano catapult', itemSold: 3 }}
    {op: 'test', path: "/invoices/10/productName", value: 'Fake beard'},
    {op: 'replace', path: "/invoices/10/itemSold", value: 12},
    {op: 'remove', path: '/invoices/20'}
  ])
```

### Buffer position

The sequence yields 2 extra numbers. They are the starting and ending position of the buffer, corresponding to the value that is emitting.
So for example, with the JSON we used so far:

```js
await streamToIterable(readStream)
  .includes('"invoices" ( 0..2 ("productName"))')
  .forEach(([path, value, start, end]) => {
    console.log(path, value, start, end)
  })

readStream.destroy()
```

This will print:

```js
['invoices', 0, 'productName'] 'piano catapult' 38 54
['invoices', 1, 'productName'] 'fake tunnel' 112 125
```

Once the position of a value is known, is possible for example:

- to index where the data is in the buffer and access them directly
- to pause and resume the parsing from that position in the buffer

It is possible to resume the parsing using the option `startingPath`.
So for example, let's say we want to resume reading from "piano catapult":

```js
// the buffer starts with the position 54
const readStream = fs.createReadStream(JSONPath, { start: 38 })

// the starting path is last path yielded
await streamToIterable(readStream, {
  startingPath: ["invoices", 0, "productName"],
}).forEach(([path, value]) => {
  console.log(path, value)
})

readStream.destroy()
```

## objectToIterable

This is a version of streamToIterable that takes an object as input. Instead of a stream. It was implemented mainly to be used as a mock and reference implementation.

```js
objectToIterable({.. a regular object ...})
  .forEach(([path, value]) => console.log(path.decoded, value.decoded))
```

It supports all features of `streamToIterable` with the exceptions:

- startingPath is not a valid option
- the output consists in a single asyncIterable item containing 1 iterable
- start position and end position are not yielded

## SequenceToObject

SequenceToObject reconstructs an object from a sequence.

```js
import { SequenceToObject } from "jsonaut"

const objBuilder = new SequenceToObject()
objBuilder.add(["hello"], "world")

console.log(objBuilder.getObject())
```

This prints:

```
{ hello: "world" }
```

This is used when working with `for loop` in specific cases when the `toObject` method is not an option (see the [example for rendering the partial state](#rendering-partial-state)).

## Utilities

### getPathMatcher

This utility converts a string in a data structure used to filter paths. This is used internally but is also exposed to be used for debugging, ensure that the include syntax is correct, and reformat the includes expression.

```js
import { getPathMatcher } from "jsonaut"

const matcher = getPathMatcher(
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

### toValueObject

It transform a JS value into an appropriate [value object](#json-values).

### toPathObject

It transform a JSON path into a [path object](#json-path).

## Includes

The _includes_ method can be used to only emit pairs with a certain path.
This is more limited than a simple filter, but it is able to figure out when matches are no longer possible so that it is not necessary to parse the rest of the JSON.
If more complex filtering is required, is easy enough to filter the sequence once is emitted.
It uses a simple and compact expression to perform matches. Including:

- direct match of object keys. Using a string enclosed in single or double quotes
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

```
'invoices'(
  0..2(
    'itemsSold'
    'unitPrice'
  )
)
```

to get this sequence:

```
['invoices', 0, 'itemsSold'] 40
['invoices', 0, 'unitPrice'] 120
['invoices', 1, 'itemsSold'] 12
['invoices', 1, 'unitPrice'] 220
```

or

```
'products'(
  *(
    'productName'
  )
)
```

to get this sequence:

```
['products', '123001', 'productName'] piano catapult
['products', '456001', 'productName'] fake tunnel
```

# Benchmarks

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
Mean:   29.934 ms
Median: 28.89 ms

Heap
====
Mean:   6,138.229 KB
Median: 5,955.203 KB
```

It is a little bit faster (not having to read the entire file every time). But also much more memory efficient.
