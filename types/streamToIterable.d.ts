/**
 *
 * @param {AsyncIterable<Uint8Array> | Iterable<Uint8Array>} stream
 * @param {Object} [options]
 * @param {number} [options.maxDepth=Infinity] - Max parsing depth
 * @param {(arg0: Path) => boolean} [options.isMaxDepthReached=null] - Max parsing depth
 * @param {import("./lib/path.js").JSONPathType} [options.startingPath] - The parser will consider this path as it is initial (useful to resume)
 * @returns {SequenceProcessor}
 */
export function streamToIterable(stream: AsyncIterable<Uint8Array> | Iterable<Uint8Array>, options?: {
    maxDepth?: number | undefined;
    isMaxDepthReached?: ((arg0: Path) => boolean) | undefined;
    startingPath?: import("./lib/path.js").JSONPathType | undefined;
}): SequenceProcessor;
import { Path } from "./lib/path.js";
import { SequenceProcessor } from "./SequenceProcessor/index.js";
//# sourceMappingURL=streamToIterable.d.ts.map