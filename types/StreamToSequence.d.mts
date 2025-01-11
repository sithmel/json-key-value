export default StreamToSequence
export type JSONValueType = import("../types/baseTypes").JSONValueType
export type JSONPathType = import("../types/baseTypes").JSONPathType
/**
 * Convert a stream of characters (in chunks) to a sequence of path/value pairs
 */
declare class StreamToSequence {
  /**
   * Convert a stream of bytes (in chunks) into a sequence of path/value pairs
   * @param {Object} [options]
   * @param {number} [options.maxDepth=Infinity] - Max parsing depth
   * @param {string} [options.includes=null] - Expression using the includes syntax
   * @param {JSONPathType} [options.startingPath] - The parser will consider this path as it is initial (useful to resume)
   */
  constructor(
    options?:
      | {
          maxDepth?: number | undefined
          includes?: string | undefined
          startingPath?: import("../types/baseTypes").JSONPathType | undefined
        }
      | undefined,
  )
  currentDepthInObject: number
  matcher: MatcherContainer
  tokenizer: StreamJSONTokenizer
  state: string
  /** @type {Array<STATE>}
   * @private
   */
  private stateStack
  currentPath: Path
  stringBuffer: Uint8Array
  /**
   * Generate currentPath from a path
   * @package
   * @private
   * @param {JSONPathType} path
   * @returns {Path}
   */
  private _initCurrentPath
  /**
   * generate statestack from a path
   * @package
   * @private
   * @param {JSONPathType} path
   * @returns {Array<STATE>}
   */
  private _initStateStack
  /**
   * add another segment to the path
   * @package
   * @private
   * @param {STATE} state
   */
  private _pushState
  /**
   * pops the parser state
   * @package
   * @private
   * @returns {string}
   */
  private _popState
  /**
   * Check if the JSON parsing completed correctly
   * @returns {boolean}
   */
  isFinished(): boolean
  /**
   * Check if there are no data to extract left considering the "includes" parameter
   * @returns {boolean}
   */
  isExhausted(): boolean
  /**
   * Parse a json or json fragment from a buffer, split in chunks (ArrayBuffers)
   * and yields a sequence of path/value pairs
   * It also yields the starting and ending byte of each value
   * @param {Uint8Array} chunk - an arraybuffer that is a chunk of a stream
   * @returns {Iterable<[JSONPathType, JSONValueType, number, number]>} - path, value, byte start, and byte end when the value is in the buffer
   */
  iter(
    chunk: Uint8Array,
  ): Iterable<
    [import("../types/baseTypes").JSONPathType, JSONValueType, number, number]
  >
}
import { MatcherContainer } from "./pathExp/matcher.mjs"
import StreamJSONTokenizer from "./StreamJSONTokenizer.mjs"
import { Path } from "./pathExp/path.mjs"
//# sourceMappingURL=StreamToSequence.d.mts.map
