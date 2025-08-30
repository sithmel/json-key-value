export default ObjectToSequence
/**
 * Convert a js value into a sequence of path/value pairs
 */
declare class ObjectToSequence {
  /**
   * Convert a js value into a sequence of path/value pairs
   * @param {Object} [options]
   * @param {number} [options.maxDepth=Infinity] - Max parsing depth
   * @param {(arg0: Path) => boolean} [options.isMaxDepthReached=null] - Max parsing depth
   */
  constructor(options?: {
    maxDepth?: number | undefined
    isMaxDepthReached?: ((arg0: Path) => boolean) | undefined
  })
  /** @type {(arg0: Path) => boolean} */
  _isMaxDepthReached: (arg0: Path) => boolean
  /**
   * yields path/value pairs from a given object
   * @param {any} obj - Any JS value
   * @param {Path} currentPath - Only for internal use
   * @returns {Iterable<[Path, Value]>}
   */
  iter(obj: any, currentPath?: Path): Iterable<[Path, Value]>
}
import { Path } from "./lib/path.js"
import { Value } from "./lib/value.js"
//# sourceMappingURL=ObjectToSequence.d.ts.map
