// @ts-check
import SequenceToStream from "../SequenceToStream.js"
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"

/**
 * Build an stream back from the sequence
 * @template {[Path, Value, number?, number?]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @returns {AsyncIterable<Iterable<Uint8Array>>}
 */
export async function* toIterableBuffer(asyncIterable) {
  const builder = new SequenceToStream()
  /**
   *
   * @param {Iterable<T>} iterable
   */
  function* iterableToStream(iterable) {
    for (const [path, value] of iterable) {
      yield builder.add(path, value)
    }
  }

  for await (const iterable of asyncIterable) {
    yield iterableToStream(iterable)
  }

  yield [builder.end()]
}
