//@ts-check
import assert from "assert"
import pkg from "zunit"

import StreamJSONTokenizer, { TOKEN } from "../src/StreamJSONTokenizer.mjs"

const { describe, odescribe, it, oit, beforeEach } = pkg
describe("StreamJSONTokenizer", () => {
  let st, encoder, decodeAndStringify
  beforeEach(() => {
    st = new StreamJSONTokenizer()
    encoder = new TextEncoder()
    const decoder = new TextDecoder()
    decodeAndStringify = () =>
      decoder.decode(new Uint8Array(st.getOutputBuffer()))
  })
  describe("Strings", () => {
    it("works with simple string", () => {
      const s = st.iter(encoder.encode('"test"'))
      assert.equal(s.next().value, TOKEN.STRING)
      assert.equal(decodeAndStringify(), '"test"')
      assert.equal(s.next().done, true)
    })

    it("works with unicode values", () => {
      const s = st.iter(encoder.encode('"\\u849c\\u8089"'))
      assert.equal(s.next().value, TOKEN.STRING)
      assert.equal(decodeAndStringify(), '"\\u849c\\u8089"')
      assert.equal(s.next().done, true)
    })
    it("works with escapes", () => {
      const s = st.iter(encoder.encode('"te\\nst"'))
      assert.equal(s.next().value, TOKEN.STRING)
      assert.equal(decodeAndStringify(), '"te\\nst"')
      assert.equal(s.next().done, true)
    })
  })
  it("works with true", () => {
    const s = st.iter(encoder.encode("true"))
    assert.equal(s.next().value, TOKEN.TRUE)
    assert.equal(s.next().done, true)
  })
  describe("Numbers", () => {
    it("works with a simple number", () => {
      const s = st.iter(encoder.encode("1 ")) // the space is necessary to terminate the parsing
      assert.equal(s.next().value, TOKEN.NUMBER)
      assert.equal(decodeAndStringify(), "1")
      assert.equal(s.next().done, true)
    })
    it("works with float", () => {
      const s = st.iter(encoder.encode("10.45 ")) // the space is necessary to terminate the parsing
      assert.equal(s.next().value, TOKEN.NUMBER)
      assert.equal(decodeAndStringify(), "10.45")
      assert.equal(s.next().done, true)
    })
    it("works with exponentials", () => {
      const s = st.iter(encoder.encode("12.3e2 ")) // the space is necessary to terminate the parsing
      assert.equal(s.next().value, TOKEN.NUMBER)
      assert.equal(decodeAndStringify(), "12.3e2")
      assert.equal(s.next().done, true)
    })
    it("works with negatives", () => {
      const s = st.iter(encoder.encode("-22.3 ")) // the space is necessary to terminate the parsing
      assert.equal(s.next().value, TOKEN.NUMBER)
      assert.equal(decodeAndStringify(), "-22.3")
      assert.equal(s.next().done, true)
    })
  })

  it("works with false", () => {
    const s = st.iter(encoder.encode("false"))
    assert.equal(s.next().value, TOKEN.FALSE)
    assert.equal(s.next().done, true)
  })
  it("works with null", () => {
    const s = st.iter(encoder.encode("null"))
    assert.equal(s.next().value, TOKEN.NULL)
    assert.equal(s.next().done, true)
  })
  it("works object and array structures", () => {
    const s = st.iter(encoder.encode('{"hello":1, "world": [1, {"ok": 2}]}'))
    assert.equal(s.next().value, TOKEN.OPEN_BRACES)
    assert.equal(s.next().value, TOKEN.STRING)
    assert.equal(decodeAndStringify(), '"hello"')
    assert.equal(s.next().value, TOKEN.COLON)
    assert.equal(s.next().value, TOKEN.NUMBER)
    assert.equal(decodeAndStringify(), "1")
    assert.equal(s.next().value, TOKEN.COMMA)
    assert.equal(s.next().value, TOKEN.STRING)
    assert.equal(decodeAndStringify(), '"world"')
    assert.equal(s.next().value, TOKEN.COLON)
    assert.equal(s.next().value, TOKEN.OPEN_BRACKET)
    assert.equal(s.next().value, TOKEN.NUMBER)
    assert.equal(decodeAndStringify(), "1")
    assert.equal(s.next().value, TOKEN.COMMA)
    assert.equal(s.next().value, TOKEN.OPEN_BRACES)
    assert.equal(s.next().value, TOKEN.STRING)
    assert.equal(decodeAndStringify(), '"ok"')
    assert.equal(s.next().value, TOKEN.COLON)
    assert.equal(s.next().value, TOKEN.NUMBER)
    assert.equal(decodeAndStringify(), "2")
    assert.equal(s.next().value, TOKEN.CLOSED_BRACES)
    assert.equal(s.next().value, TOKEN.CLOSED_BRACKET)
    assert.equal(s.next().value, TOKEN.CLOSED_BRACES)
    assert.equal(s.next().done, true)
  })
  it("breaks with invalid token", () => {})
  it("can resume", () => {
    let s = st.iter(encoder.encode('{"hel'))
    assert.equal(s.next().value, TOKEN.OPEN_BRACES)
    assert.equal(s.next().done, true)
    s = st.iter(encoder.encode('lo":1, "wo'))
    assert.equal(s.next().value, TOKEN.STRING)
    assert.equal(decodeAndStringify(), '"hello"')
    assert.equal(s.next().value, TOKEN.COLON)
    assert.equal(s.next().value, TOKEN.NUMBER)
    assert.equal(decodeAndStringify(), "1")
    assert.equal(s.next().value, TOKEN.COMMA)
    assert.equal(s.next().done, true)
    s = st.iter(encoder.encode('rld": [1, {"ok": 2}]}'))
    assert.equal(s.next().value, TOKEN.STRING)

    assert.equal(decodeAndStringify(), '"world"')
    assert.equal(s.next().value, TOKEN.COLON)
    assert.equal(s.next().value, TOKEN.OPEN_BRACKET)
    assert.equal(s.next().value, TOKEN.NUMBER)
    assert.equal(decodeAndStringify(), "1")
    assert.equal(s.next().value, TOKEN.COMMA)
    assert.equal(s.next().value, TOKEN.OPEN_BRACES)
    assert.equal(s.next().value, TOKEN.STRING)
    assert.equal(decodeAndStringify(), '"ok"')
    assert.equal(s.next().value, TOKEN.COLON)
    assert.equal(s.next().value, TOKEN.NUMBER)
    assert.equal(decodeAndStringify(), "2")
    assert.equal(s.next().value, TOKEN.CLOSED_BRACES)
    assert.equal(s.next().value, TOKEN.CLOSED_BRACKET)
    assert.equal(s.next().value, TOKEN.CLOSED_BRACES)
    assert.equal(s.next().done, true)
  })
})
