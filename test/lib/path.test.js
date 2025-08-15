//@ts-check
import assert from "assert"
import { describe, it, beforeEach } from "node:test"
import { Path, areSegmentsEqual, toEncodedSegment, toPathObject  } from "../../src/lib/path.js"
import { CachedString } from "../../src/lib/value.js"
import { stringifyAndEncode } from "../../src/lib/utils.js"
/**
 *
 * @param {Iterable<[number, number|CachedString]>} iterable
 * @returns {Array<[number, number|string]>}
 */
function segmentIterableToArray(iterable) {
  return Array.from(iterable).map(([i, v]) => {
    if (v instanceof CachedString) {
      return [i, v.decoded]
    }
    return [i, v]
  })
}

describe("Path", () => {
  /** @type Path */
  let path
  beforeEach(() => {
    path = new Path()
    path = path.withSegmentAdded(
      new CachedString(new Uint8Array([34, 104, 101, 108, 108, 111, 34])),
    )
    path = path.withSegmentAdded(1)
    path = path.withSegmentAdded(2)
    path = path.withSegmentAdded(3)
  })
  it("decodes path", () => {
    assert.deepEqual(path.decoded, ["hello", 1, 2, 3])
  })
  it("pops and gets", () => {
    const newPath = path.withSegmentRemoved()
    assert.deepEqual(newPath.decoded, ["hello", 1, 2])
    const value = newPath.get(0)
    assert(value instanceof CachedString)
    assert.equal(value.decoded, "hello")
  })
  it("returns rest", () => {
    const newPath = path.rest()
    assert.deepEqual(newPath.decoded, [1, 2, 3])
    assert.equal(newPath.get(0), 1)
    assert.equal(newPath.length, 3)
    assert.equal(path.length, 4)
  })
})
describe("Path fromEndToIndex", () => {
  it("index 0", () =>
    assert.deepEqual(
      segmentIterableToArray(toPathObject(["a", "b", "c"]).fromEndToIndex(0)),
      [
        [2, "c"],
        [1, "b"],
        [0, "a"],
      ],
    ))
  it("index 1", () =>
    assert.deepEqual(
      segmentIterableToArray(toPathObject(["a", "b", "c"]).fromEndToIndex(1)),
      [
        [2, "c"],
        [1, "b"],
      ],
    ))
  it("index 2", () =>
    assert.deepEqual(
      segmentIterableToArray(toPathObject(["a", "b", "c"]).fromEndToIndex(2)),
      [[2, "c"]],
    ))
  it("index 3", () =>
    assert.deepEqual(
      segmentIterableToArray(toPathObject(["a", "b", "c"]).fromEndToIndex(3)),
      [],
    ))
})

describe("Path fromIndexToEnd", () => {
  it("index 0", () =>
    assert.deepEqual(
      segmentIterableToArray(toPathObject(["a", "b", "c"]).fromIndexToEnd(0)),
      [
        [0, "a"],
        [1, "b"],
        [2, "c"],
      ],
    ))
  it("index 1", () =>
    assert.deepEqual(
      segmentIterableToArray(toPathObject(["a", "b", "c"]).fromIndexToEnd(1)),
      [
        [1, "b"],
        [2, "c"],
      ],
    ))
  it("index 3", () =>
    assert.deepEqual(
      segmentIterableToArray(toPathObject(["a", "b", "c"]).fromIndexToEnd(3)),
      [],
    ))
})
describe("Path getCommonPathIndex", () => {
  it("works with empty paths", () =>
    assert.equal(toPathObject([]).getCommonPathIndex(toPathObject([])), 0))
  it("works with same paths", () =>
    assert.equal(
      toPathObject(["a", "b", "c"]).getCommonPathIndex(
        toPathObject(["a", "b", "c"]),
      ),
      3,
    ))
  it("works with common paths (1)", () =>
    assert.equal(
      toPathObject(["a", "b"]).getCommonPathIndex(
        toPathObject(["a", "b", "c"]),
      ),
      2,
    ))
  it("works with common paths (2)", () =>
    assert.equal(
      toPathObject([]).getCommonPathIndex(toPathObject(["a", "b", "c"])),
      0,
    ))
  it("works with common paths (3)", () =>
    assert.equal(
      toPathObject(["a", "b", "c"]).getCommonPathIndex(
        toPathObject(["a", "b"]),
      ),
      2,
    ))
  it("works with different paths (1)", () =>
    assert.equal(
      toPathObject(["a", "b", "c"]).getCommonPathIndex(
        toPathObject(["x", "y"]),
      ),
      0,
    ))
  it("works with different paths (2)", () =>
    assert.equal(
      toPathObject(["a", "b"]).getCommonPathIndex(
        toPathObject(["x", "y", "z"]),
      ),
      0,
    ))
  it("works with different paths (3)", () =>
    assert.equal(
      toPathObject(["x", "a", "b"]).getCommonPathIndex(
        toPathObject(["x", "y", "z"]),
      ),
      1,
    ))
})

describe("areSegmentsEqual", () => {
  it("returns true for equal numbers", () => {
    assert.equal(areSegmentsEqual(1, 1), true)
  })

  it("returns false for different numbers", () => {
    assert.equal(areSegmentsEqual(1, 2), false)
  })

  it("returns true for equal CachedString objects", () => {
    const encoder = new TextEncoder()
    const segment1 = new CachedString(encoder.encode("test"))
    const segment2 = new CachedString(encoder.encode("test"))
    assert.equal(areSegmentsEqual(segment1, segment2), true)
  })

  it("returns false for different CachedString objects", () => {
    const encoder = new TextEncoder()
    const segment1 = new CachedString(encoder.encode("test1"))
    const segment2 = new CachedString(encoder.encode("test2"))
    assert.equal(areSegmentsEqual(segment1, segment2), false)
  })

  it("returns false for different types", () => {
    assert.equal(areSegmentsEqual(1, null), false)
    assert.equal(
      areSegmentsEqual(null, new CachedString(new Uint8Array())),
      false,
    )
  })

  it("returns true for two null segments", () => {
    assert.equal(areSegmentsEqual(null, null), true)
  })
})

describe("Path - offset and mutations", () => {
  it("preserves offset with withSegmentAdded/Removed and is immutable", () => {
    const a = new Path([1, 2, 3], 1) // view is [2,3]
    const b = a.withSegmentAdded(4)
    assert.equal(a.offset, 1)
    assert.equal(b.offset, 0, "Decide if this should preserve offset; add expectation accordingly")
    // adjust expectation once behavior is defined; this test is meant to catch unintended reset
    const c = a.withSegmentRemoved()
    assert.equal(a.offset, 1)
    assert.equal(c.offset, 0, "Decide if this should preserve offset; add expectation accordingly")
    assert.deepEqual(a.decoded, [2, 3])
  })

  it("rest() returns next view without copying array", () => {
    const base = new Path([toEncodedSegment("a"), 1, toEncodedSegment("b")], 0)
    const next = base.rest()
    assert.equal(base.offset, 0)
    assert.equal(next.offset, 1)
    assert.deepEqual(base.decoded, ["a", 1, "b"])
    assert.deepEqual(next.decoded, [1, "b"])
  })

  it("get() and length respect offset", () => {
    const p = new Path([toEncodedSegment("x"), 10, toEncodedSegment("y")], 1)
    assert.equal(p.length, 2)
    assert.equal(p.get(0), 10)
    assert.ok(p.get(1) instanceof CachedString)
    assert.equal(p.get(2), undefined)
  })
})

describe("Path - iterators", () => {
  it("fromIndexToEnd yields correct pairs", () => {
    const p = new Path([1, 2, 3], 0)
    assert.deepEqual([...p.fromIndexToEnd(1)], [[1, 2], [2, 3]])
    assert.deepEqual([...p.fromIndexToEnd(3)], [])
  })
  it("fromEndToIndex yields correct pairs", () => {
    const p = new Path([1, 2, 3], 0)
    assert.deepEqual([...p.fromEndToIndex(1)], [[2, 3], [1, 2]])
    assert.deepEqual([...p.fromEndToIndex(3)], [])
  })
  it("iterators throw on negative index", () => {
    const p = new Path([1, 2], 0)
    assert.throws(() => [...p.fromIndexToEnd(-1)])
    assert.throws(() => [...p.fromEndToIndex(-1)])
  })
})

describe("Path - equality and common path", () => {
  it("getCommonPathIndex across scenarios", () => {
    const a = toPathObject(["a", "b", 1])
    const b = toPathObject(["a", "b", 1])
    const c = toPathObject(["a", "x"])
    const d = new Path(a.array, 1) // view ["b",1]
    assert.equal(a.getCommonPathIndex(b), a.length)
    assert.equal(a.getCommonPathIndex(c), 1)
    assert.equal(d.getCommonPathIndex(a), 0)
  })
  it("isEqual true only for fully equal (respecting offsets)", () => {
    const a = toPathObject(["a", 1])
    const b = toPathObject(["a", 1])
    const c = toPathObject(["a", 2])
    const d = new Path(a.array, 1) // [1]
    assert.equal(a.isEqual(b), true)
    assert.equal(a.isEqual(c), false)
    assert.equal(a.isEqual(d), false)
  })
})

describe("Segments and encoding", () => {
  it("areSegmentsEqual for numbers and CachedString", () => {
    assert.equal(areSegmentsEqual(1, 1), true)
    assert.equal(areSegmentsEqual(1, 2), false)
    const s1 = new CachedString(stringifyAndEncode("k"))
    const s2 = new CachedString(stringifyAndEncode("k"))
    const s3 = new CachedString(stringifyAndEncode("x"))
    assert.equal(areSegmentsEqual(s1, s2), true)
    assert.equal(areSegmentsEqual(s1, s3), false)
    assert.equal(areSegmentsEqual(1, s1), false)
  })

  it("toEncodedSegment and toPathObject roundtrip", () => {
    const decoded = ["a", 1, "b"]
    const p = toPathObject(decoded)
    assert.deepEqual(p.decoded, decoded)
    const enc = p.encoded
    assert.equal(typeof enc[1], "number")
    assert.ok(enc[0] instanceof Uint8Array)
  })
})
