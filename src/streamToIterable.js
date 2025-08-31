// @ts-check
import { SequenceProcessor } from "./SequenceProcessor/index.js"
import StreamToSequence from "./StreamToSequence.js"
import { Path } from "./lib/path.js"

/**
 *
 * @param {AsyncIterable<Uint8Array> | Iterable<Uint8Array>} stream
 * @param {Object} [options]
 * @param {number} [options.maxDepth=Infinity] - Max parsing depth
 * @param {(arg0: Path) => boolean} [options.isMaxDepthReached=null] - Max parsing depth
 * @param {import("./lib/path.js").JSONPathType} [options.startingPath] - The parser will consider this path as it is initial (useful to resume)
 * @returns {SequenceProcessor}
 */
export function streamToIterable(stream, options) {
  const streamToSequence = new StreamToSequence(options)
  const sequence = streamToSequence.iter(stream)
  return new SequenceProcessor(sequence)
}
