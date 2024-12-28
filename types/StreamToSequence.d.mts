export default class StreamToSequence {
  /**
   * Convert a stream of characters (in chunks) to a sequence of path/value pairs
   * @param {{ maxDepth?: number, includes?: string, startingPath?: import("../types/baseTypes").JSONPathType }} options
   */
  constructor(options?: {
    maxDepth?: number | undefined
    includes?: string | undefined
    startingPath?: import("../types/baseTypes").JSONPathType | undefined
  })
  currentDepthInObject: number
  matcher: MatcherContainer
  tokenizer: StreamJSONTokenizer
  state: string
  /** @type {Array<STATE>} */
  stateStack: Array<STATE>
  currentPath: Path
  stringBuffer: Uint8Array
  /**
   * Generate currentPath from a path
   * @package
   * @param {import("../types/baseTypes").JSONPathType} path
   * @returns {Path}
   */
  _initCurrentPath(path: import("../types/baseTypes").JSONPathType): Path
  /**
   * generate statestack from a path
   * @package
   * @param {import("../types/baseTypes").JSONPathType} path
   * @returns {Array<STATE>}
   */
  _initStateStack(path: import("../types/baseTypes").JSONPathType): Array<STATE>
  /**
   * add another segment to the path
   * @package
   * @param {STATE} state
   */
  _pushState(state: STATE): void
  /**
   * pops the parser state
   * @package
   * @returns {string}
   */
  _popState(): string
  /**
   * Check if the JSON parsing completed correctly
   * @returns {boolean}
   */
  isFinished(): boolean
  /**
   * Parse a json or json fragment, return a sequence of path/value pairs
   * @param {Uint8Array} chunk
   * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType, number, number]>}
   */
  iter(
    chunk: Uint8Array,
  ): Iterable<
    [
      import("../types/baseTypes").JSONPathType,
      import("../types/baseTypes").JSONValueType,
      number,
      number,
    ]
  >
}
import { MatcherContainer } from "./pathExp/matcher.mjs"
import StreamJSONTokenizer from "./StreamJSONTokenizer.mjs"
/**
 * Enum for parser state
 */
type STATE = string
declare namespace STATE {
  let VALUE: string
  let OPEN_OBJECT: string
  let CLOSE_OBJECT: string
  let CLOSE_ARRAY: string
  let OPEN_KEY: string
  let CLOSE_KEY: string
  let END: string
}
import { Path } from "./pathExp/path.mjs"
export {}
//# sourceMappingURL=StreamToSequence.d.mts.map
