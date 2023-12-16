# json-key-value

## The idea

The main idea behind this library is that a JSON can be converted in a sequence of "path, value" pairs and a JSON can be reconstructed from this sequence.
The sequence should respect the order used by the JSON or be at least "Depth first" to be able to return the JSON as a stream.
This allows to:

- filter and transform big JSON as a stream, without having to load it in memory
- store JSON file in key value store to access data quickly

## About the ordering

Streaming JSON requires the "path, value" pairs to be emitted in depth first order otherwise the resulting JSON will be malformed. Note the structure will be respected, not necessarily the order the key presents (ES standard introduced the concept of key ordering, but it is not respected here).

## filter syntax

Filter by key

## todo

### no opening array/objects?

pro
faster
no need to manage open object ?
cons
need to delete empty object when stored

### Ordering

How to keep ordering so that you can stream json

- lexicographic ordering, number issues
  A1
  A2
  B10
  C100
  C102

a
a.b
b.c

leveldb
indexing
leveldb -> json
modify json once in cache

Postgres
treestore
Path, value, operation(add/delete), timestamp
operations:
set
delete
get(paths, timastamp)
compact database

map/filter/reduce

filter based on key can leverage ordering!
keyfilter
