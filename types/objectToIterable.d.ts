/**
 *
 * @param {any} obj
 * @param {Object} [options]
 * @param {number} [options.maxDepth=Infinity] - Max parsing depth
 * @param {(arg0: Path) => boolean} [options.isMaxDepthReached=null] - Max parsing depth
 * @returns {SequenceProcessor}
 */
export function objectToIterable(
  obj: any,
  options?: {
    maxDepth?: number | undefined
    isMaxDepthReached?: ((arg0: Path) => boolean) | undefined
  },
): SequenceProcessor
import { Path } from "./lib/path.js"
import { SequenceProcessor } from "./SequenceProcessor/index.js"
//# sourceMappingURL=objectToIterable.d.ts.map
