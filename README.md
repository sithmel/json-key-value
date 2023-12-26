# json-key-value

## The idea

The main idea behind this library is that a JSON can be converted in a sequence of "path, value" pairs and can be reconstructed from this sequence.
The sequence should respect the order used by the JSON or be at least "Depth first" to be able to return the JSON as a stream.
This allows to:

- filter and transform a big JSON as a stream, without having to load it in memory
- store JSON file in key value store to access data quickly

## About the ordering

Streaming JSON requires the "path, value" pairs to be emitted in **depth first** order otherwise the resulting JSON will be malformed. This is the order in which data are stored in JSON.
In case key value pairs are stored in a database, it is important that they are retrieved in this order.

## PathConverter

The package includes PathConverter which is an utility classes that converts paths in strings (and vice versa).
This is designed to emit strings that can be stored in a database and retrieved in lexicographic order (which is "depth first"). This allows to reconstruct the JSON correctly. It is important to note the structure will be respected, not necessarily the order the key presents in the original JSON (ES standard introduced the concept of key ordering, but it is not respected here).

```js
const separator = "//"
const numberPrefix = "@@"
const pathConverter = new PathConverter(separator, prefix)
const path = ["hello", "world", 1]
const pathString = pathConverter.pathToString(path) // "hello//world//@@A1"
path === pathConverter.stringToPath(pathString)
```

## JSONParser

JSONParser is a [rfc8259](https://datatracker.ietf.org/doc/html/rfc8259) compliant parser, designed to work with a stream of character. Decoding from buffer is not provided, leaving that to different buffer implementation ([node buffers](https://nodejs.org/api/buffer.html) of [web streams](https://nodejs.org/api/webstreams.html))

```js
const parser = new JSONParser()
const chunks = ['{"hello": "wo', '"rld"}']
for (const chunk of chunks) {
  for (const [path, value] of parser.parse(chunk)) {
    console.log(path, value) // ["hello"] "world"
  }
}
```

## ObjParser

ObjParser transforms a js object to a sequence of path values:

```js
const parser = new ObjParser()
for (const [path, value] of parser.parse({ hello: world })) {
  console.log(path, value) // ["hello"] "world"
}
```

## ObjBuilder

ObjBuilder reconstructs an object from a sequence:

```js
const objBuilder = new ObjBuilder()
objBuilder.add([], {}) // build initial object
objBuilder.add(["hello"], "world")
objBuilder.object === { hello: "world" }
```

The implementation forgives if "containers" (arrays and objects) are omitted

```js
const objBuilder = new ObjBuilder()
objBuilder.add(["hello"], "world")
objBuilder.object === { hello: "world" }
```

It also fills empty array positions with nulls:

```js
const objBuilder = new ObjBuilder()
objBuilder.add([2], "hello world")
objBuilder.object === [null, null, "hello world"]
```

## JSONBuilder

JSONBuilder reconstruct a sequence of characters from a sequence:

```js
let str = ""
const jsonBuilder = new JSONBuilder((data) => (str += data))
objBuilder.add([], {}) // build initial object
objBuilder.add(["hello"], "world")
objBuilder.end()
str === '{"hello":"world"}'
```

_The sequence must be in "depth first" order (with ordered indices), otherwise it won't work!_
Also notice, the _end_ method must be called after adding all the path, value pairs.
The implementation forgives if "containers" (arrays and objects) are omitted.

```js
let str = ""
const jsonBuilder = new JSONBuilder((data) => (str += data))
objBuilder.add(["hello"], "world")
objBuilder.end()
str === '{"hello":"world"}'
```

It also fills empty array positions with nulls:

```js
let str = ""
const jsonBuilder = new JSONBuilder((data) => (str += data))
objBuilder.add([2], "hello world")
objBuilder.end()
str === '[null,null,"hello world"]'
```

## reviver

The [JSON parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) method has an optional argument "reviver" that allows to transform the js object. This can't work on a sequence, and for this reason is provided as a separate function.

# Work with the sequence

Both JSONParser.parse and ObjParser.parse returns an iterable of path/value pairs.
These can be transformed using a for .. of loop, and then converted to an object (ObjBuilder) or a JSON stream (JSONBuilder):

```js
function getPricesWithVAT(obj) {
  const builder = new ObjBuilder()
  const parser = new ObjParser()
  for (const [path, value] of parser.parse(obj)) {
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
  "other data": {
    //...
  },
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
  "Subscription 1 month": 20,
  "Subscription 2 month": 42,
  "Subscription 6 month": 120,
  "Subscription 1 year": 216
}
```

I suggest [iter-tools](https://github.com/iter-tools/iter-tools) to work with iterables.

## filterByPath

A frequent type of filtering of these sequences is based on the "path". This is more complex than a simple filter, because it should be able to figure out when matches are no longer possible so that it is not necessary to parse the rest of the JSON.

```js
function getPricesWithVAT(obj) {
  const builder = new ObjBuilder()
  const parser = new ObjParser()

  for (const [path, value] of filterByPath(
    parser.parse(obj),
    [[match(prices)]], // this is a list of all paths to include
  )) {
    builder.add(path.slice(1), value * 0.2)
  }
  return builder.object
}
```

filterByPath takes as input:

- an iterable of path, value pairs
- a list of path expressions matching the pairs to include
- a list of path expressions matching the pairs to exclude

It returns an iterable with the filtered path, value pairs.

## Path expressions

Path expressions are a concise way to match a JSON fragment by path. It is not a general purpose query language like [json pointer](https://datatracker.ietf.org/doc/rfc6901/) or [json path](https://datatracker.ietf.org/doc/draft-ietf-jsonpath-base/). They are designed to work on js objects while are loaded in memory. Path expressions are (intentionally!) limited to performant filtering of path/value sequences.
With path expressions you can match fragments of path by their position, array indices and slices.
Here are a list of features that were deliberately excluded as they make impossible to terminate early:

- any type of fragment matching that is not a direct match (negative match, globbing, reg exp )
- match by value
- fragment match at any level

These can all be easily implemented using a regular **filter** function, like the one that can be found in [iter-tools](https://github.com/iter-tools/iter-tools).
Enough with the explanation! Let's see the syntax.

## Path expressions as arrays

Path expressions can be an array of paths, with each path being an array of fragments.
For example:

```js
[
  [{type: "match", match: "hello"}, {type: "match", match: 2}],
  [{type: "match", match: "world"}, {type: "slice": sliceFrom: 0, sliceTo: 3}],
]
```

These are matching paths that starts with:

- hello[2]
- world[0]
- world[1]
- world[2]

_match_ is used for direct match of object keys or array index.
_slice_ is used to match an interval of indexes. If the first index is omitted, is assumed to be 0, if the last is omitted is assumed to be Infinity.
It is also possible to use helpers to make it more concise:

```js
;[
  [match("hello"), match(2)],
  [match("world"), slice(0, 3)],
]
```

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

Either brackets or dots can be used as separators. Strings can be wrapped in double quotes: in this case any string can be used, and special character needs to be escaped as described in the [JSON specs](https://datatracker.ietf.org/doc/html/rfc8259). Unquoted strings can be used but only letters, numbers and underscores can be used.

## documentation cookbook

buffer
filter file

expose methods

## remove method for objbuilder

slice, splice
insert etc.
see https://github.com/sithmel/obj-delta
obj-delta

- modernise
- add events

##

## remove method for jsonbuilder

## leveldb

indexing
leveldb -> json
modify json once in cache

## Postgres

treestore
Path, value, operation(add/delete), timestamp
operations:
set
delete
get(paths, timastamp)
compact database
