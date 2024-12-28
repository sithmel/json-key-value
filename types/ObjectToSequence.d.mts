export default class ObjectToSequence {
  /**
   * Convert a stream of characters (in chunks) to a sequence of path/value pairs
   * @param {{ maxDepth?: number, includes?: string }} options
   */
  constructor(options?: {
    maxDepth?: number | undefined
    includes?: string | undefined
  })
  maxDepth: number
  matcher: MatcherContainer
  /**
   * parse a json or json fragment
   * @param {any} obj
   * @param {Path} [currentPath]
   * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
   */
  iter(
    obj: any,
    currentPath?: Path | undefined,
  ): Iterable<
    [
      import("../types/baseTypes").JSONPathType,
      import("../types/baseTypes").JSONValueType,
    ]
  >
}
import { MatcherContainer } from "./pathExp/matcher.mjs"
import { Path } from "./pathExp/path.mjs"
//# sourceMappingURL=ObjectToSequence.d.mts.map
