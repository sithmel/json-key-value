//@ts-check
import assert from "assert"
import pkg from "zunit"

import StreamJSONTokenizer, { TOKEN } from "../src/StreamJSONTokenizer.js"

const { describe, odescribe, it, oit, beforeEach } = pkg
describe("StreamJSONTokenizer", () => {
  let st, encoder, decodeAndStringify
  beforeEach(() => {
    st = new StreamJSONTokenizer()
    encoder = new TextEncoder()
    const decoder = new TextDecoder()
    decodeAndStringify = (start, end) =>
      decoder.decode(new Uint8Array(st.getOutputBuffer(start, end)))
  })
  describe("Strings", () => {
    it("works with simple string", () => {
      const s = st.iter(encoder.encode('"test"'))
      assert.deepEqual(s.next().value, [TOKEN.STRING, 0, 6])
      assert.deepEqual(decodeAndStringify(0, 6), '"test"')
      assert.deepEqual(s.next().done, true)
    })

    it("works with unicode values", () => {
      const s = st.iter(encoder.encode('"\\u849c\\u8089"'))
      assert.deepEqual(s.next().value, [TOKEN.STRING, 0, 14])
      assert.deepEqual(decodeAndStringify(0, 14), '"\\u849c\\u8089"')
      assert.deepEqual(s.next().done, true)
    })
    it("works with escapes", () => {
      const s = st.iter(encoder.encode('"te\\nst"'))
      assert.deepEqual(s.next().value, [TOKEN.STRING, 0, 8])
      assert.deepEqual(decodeAndStringify(0, 8), '"te\\nst"')
      assert.deepEqual(s.next().done, true)
    })
  })
  it("works with true", () => {
    const s = st.iter(encoder.encode("true"))
    assert.deepEqual(s.next().value, [TOKEN.TRUE, 0, 4])
    assert.deepEqual(s.next().done, true)
  })
  describe("Numbers", () => {
    it("works with a simple number", () => {
      const s = st.iter(encoder.encode("1 ")) // the space is necessary to terminate the parsing
      assert.deepEqual(s.next().value, [TOKEN.NUMBER, 0, 1])
      assert.deepEqual(decodeAndStringify(0, 1), "1")
      assert.deepEqual(s.next().done, true)
    })
    it("works with float", () => {
      const s = st.iter(encoder.encode("10.45 ")) // the space is necessary to terminate the parsing
      assert.deepEqual(s.next().value, [TOKEN.NUMBER, 0, 5])
      assert.deepEqual(decodeAndStringify(0, 5), "10.45")
      assert.deepEqual(s.next().done, true)
    })
    it("works with exponentials", () => {
      const s = st.iter(encoder.encode("12.3e2 ")) // the space is necessary to terminate the parsing
      assert.deepEqual(s.next().value, [TOKEN.NUMBER, 0, 6])
      assert.deepEqual(decodeAndStringify(0, 6), "12.3e2")
      assert.deepEqual(s.next().done, true)
    })
    it("works with negatives", () => {
      const s = st.iter(encoder.encode("-22.3 ")) // the space is necessary to terminate the parsing
      assert.deepEqual(s.next().value, [TOKEN.NUMBER, 0, 5])
      assert.deepEqual(decodeAndStringify(0, 5), "-22.3")
      assert.deepEqual(s.next().done, true)
    })
  })

  it("works with false", () => {
    const s = st.iter(encoder.encode("false"))
    assert.deepEqual(s.next().value, [TOKEN.FALSE, 0, 5])
    assert.deepEqual(s.next().done, true)
  })
  it("works with null", () => {
    const s = st.iter(encoder.encode("null"))
    assert.deepEqual(s.next().value, [TOKEN.NULL, 0, 4])
    assert.deepEqual(s.next().done, true)
  })
  it("works object and array structures", () => {
    const s = st.iter(encoder.encode('{"hello":1, "world": [1, {"ok": 2}]}'))
    assert.deepEqual(s.next().value, [TOKEN.OPEN_BRACES, 0, 1])
    assert.deepEqual(s.next().value, [TOKEN.STRING, 1, 8])
    assert.deepEqual(decodeAndStringify(1, 8), '"hello"')
    assert.deepEqual(s.next().value, [TOKEN.COLON, 8, 9])
    assert.deepEqual(s.next().value, [TOKEN.NUMBER, 9, 10])
    assert.deepEqual(decodeAndStringify(9, 10), "1")
    assert.deepEqual(s.next().value, [TOKEN.COMMA, 10, 11])
    assert.deepEqual(s.next().value, [TOKEN.STRING, 12, 19])
    assert.deepEqual(decodeAndStringify(12, 19), '"world"')
    assert.deepEqual(s.next().value, [TOKEN.COLON, 19, 20])
    assert.deepEqual(s.next().value, [TOKEN.OPEN_BRACKET, 21, 22])
    assert.deepEqual(s.next().value, [TOKEN.NUMBER, 22, 23])
    assert.deepEqual(decodeAndStringify(22, 23), "1")
    assert.deepEqual(s.next().value, [TOKEN.COMMA, 23, 24])
    assert.deepEqual(s.next().value, [TOKEN.OPEN_BRACES, 25, 26])
    assert.deepEqual(s.next().value, [TOKEN.STRING, 26, 30])
    assert.deepEqual(decodeAndStringify(26, 30), '"ok"')
    assert.deepEqual(s.next().value, [TOKEN.COLON, 30, 31])
    assert.deepEqual(s.next().value, [TOKEN.NUMBER, 32, 33])
    assert.deepEqual(decodeAndStringify(32, 33), "2")
    assert.deepEqual(s.next().value, [TOKEN.CLOSED_BRACES, 33, 34])
    assert.deepEqual(s.next().value, [TOKEN.CLOSED_BRACKET, 34, 35])
    assert.deepEqual(s.next().value, [TOKEN.CLOSED_BRACES, 35, 36])
    assert.deepEqual(s.next().done, true)
  })
  it("breaks with invalid token", () => {})
  it("can resume", () => {
    let s = st.iter(encoder.encode('{"hel'))
    assert.deepEqual(s.next().value, [TOKEN.OPEN_BRACES, 0, 1])
    assert.deepEqual(s.next().done, true)
    s = st.iter(encoder.encode('lo":1, "wo'))
    assert.deepEqual(s.next().value, [TOKEN.STRING, 0, 7])
    assert.deepEqual(decodeAndStringify(0, 7), '"hello"')
    assert.deepEqual(s.next().value, [TOKEN.COLON, 7, 8])
    assert.deepEqual(s.next().value, [TOKEN.NUMBER, 8, 9])
    assert.deepEqual(decodeAndStringify(8, 9), "1")
    assert.deepEqual(s.next().value, [TOKEN.COMMA, 9, 10])
    assert.deepEqual(s.next().done, true)
    s = st.iter(encoder.encode('rld": [1, {"ok": 2}]}'))
    assert.deepEqual(s.next().value, [TOKEN.STRING, 0, 7])

    assert.deepEqual(decodeAndStringify(0, 7), '"world"')
    assert.deepEqual(s.next().value, [TOKEN.COLON, 7, 8])
    assert.deepEqual(s.next().value, [TOKEN.OPEN_BRACKET, 9, 10])
    assert.deepEqual(s.next().value, [TOKEN.NUMBER, 10, 11])
    assert.deepEqual(decodeAndStringify(10, 11), "1")
    assert.deepEqual(s.next().value, [TOKEN.COMMA, 11, 12])
    assert.deepEqual(s.next().value, [TOKEN.OPEN_BRACES, 13, 14])
    assert.deepEqual(s.next().value, [TOKEN.STRING, 14, 18])
    assert.deepEqual(decodeAndStringify(14, 18), '"ok"')
    assert.deepEqual(s.next().value, [TOKEN.COLON, 18, 19])
    assert.deepEqual(s.next().value, [TOKEN.NUMBER, 20, 21])
    assert.deepEqual(decodeAndStringify(20, 21), "2")
    assert.deepEqual(s.next().value, [TOKEN.CLOSED_BRACES, 21, 22])
    assert.deepEqual(s.next().value, [TOKEN.CLOSED_BRACKET, 22, 23])
    assert.deepEqual(s.next().value, [TOKEN.CLOSED_BRACES, 23, 24])
    assert.deepEqual(s.next().done, true)
  })
})
