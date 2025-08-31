//@ts-check
import { SequenceProcessor } from "./SequenceProcessor/index.js"
import ObjectToSequence from "./ObjectToSequence.js"
import { Path } from "./lib/path.js"
import { Value } from "./lib/value.js"

/**
 * @param {Iterable<any>} iterable
 * @return {AsyncIterable<Iterable<[Path, Value]>>}
 */
async function* wraptIntoAsyncIterable(iterable) {
  yield iterable
}

/**
 *
 * @param {any} obj
 * @param {Object} [options]
 * @param {number} [options.maxDepth=Infinity] - Max parsing depth
 * @param {(arg0: Path) => boolean} [options.isMaxDepthReached=null] - Max parsing depth
 * @returns {SequenceProcessor}
 */
export function objectToIterable(obj, options) {
  const objectToSequence = new ObjectToSequence(options)
  const sequence = wraptIntoAsyncIterable(objectToSequence.iter(obj))
  return new SequenceProcessor(sequence)
}
