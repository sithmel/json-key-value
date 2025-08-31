export default StreamToSequence;
/**
 * Convert a stream of characters (in chunks) to a sequence of path/value pairs
 */
declare class StreamToSequence {
    /**
     * Convert a stream of bytes (in chunks) into a sequence of path/value pairs
     * @param {Object} [options]
     * @param {number} [options.maxDepth=null] - Max parsing depth
     * @param {(arg0: Path) => boolean} [options.isMaxDepthReached=null] - Max parsing depth
     * @param {import("./lib/path.js").JSONPathType} [options.startingPath] - The parser will consider this path as it is initial (useful to resume)
     */
    constructor(options?: {
        maxDepth?: number | undefined;
        isMaxDepthReached?: ((arg0: Path) => boolean) | undefined;
        startingPath?: import("./lib/path.js").JSONPathType | undefined;
    });
    /** @type {(arg0: Path) => boolean} */
    _isMaxDepthReached: (arg0: Path) => boolean;
    maxDepthReached: boolean;
    tokenizer: StreamJSONTokenizer;
    state: string;
    /** @type {Array<STATE>}
     * @private
     */
    private stateStack;
    currentPath: Path;
    stringBuffer: Uint8Array<ArrayBuffer>;
    emptyObjectOrArrayStart: number;
    /**
     * Check if the current path is at max depth
     * @param {number | CachedString} segment
     * @returns {void}
     */
    _pushCurrentPath(segment: number | CachedString): void;
    /**
     * Check if the current path is at max depth
     * @returns {void}
     */
    _popCurrentPath(): void;
    /**
     * Generate currentPath from a path
     * @private
     * @param {import("./lib/path.js").JSONPathType} path
     */
    private _initCurrentPath;
    /**
     * generate statestack from a path
     * @private
     * @param {import("./lib/path.js").JSONPathType} path
     * @returns {Array<STATE>}
     */
    private _initStateStack;
    /**
     * add another segment to the path
     * @private
     * @param {STATE} state
     */
    private _pushState;
    /**
     * pops the parser state
     * @private
     * @returns {string}
     */
    private _popState;
    /**
     * Check if the JSON parsing completed correctly
     * @returns {boolean}
     */
    isFinished(): boolean;
    /**
     * Parse a json or json fragment from a buffer, split in chunks (ArrayBuffers)
     * and yields a sequence of path/value pairs
     * It also yields the starting and ending byte of each value
     * @param {AsyncIterable<Uint8Array> | Iterable<Uint8Array>} asyncIterable - an arraybuffer that is a chunk of a stream
     * @returns {AsyncIterable<Iterable<[Path, Value, number, number]>>} - path, value, byte start, and byte end when the value is in the buffer
     */
    iter(asyncIterable: AsyncIterable<Uint8Array> | Iterable<Uint8Array>): AsyncIterable<Iterable<[Path, Value, number, number]>>;
    /**
     * Parse a json or json fragment from a buffer, split in chunks (ArrayBuffers)
     * and yields a sequence of path/value pairs
     * It also yields the starting and ending byte of each value
     * @param {Uint8Array} chunk - an arraybuffer that is a chunk of a stream
     * @returns {Iterable<[Path, Value, number, number]>} - path, value, byte start, and byte end when the value is in the buffer
     */
    iterChunk(chunk: Uint8Array): Iterable<[Path, Value, number, number]>;
}
import { Path } from "./lib/path.js";
import StreamJSONTokenizer from "./StreamJSONTokenizer.js";
import { CachedString } from "./lib/value.js";
import { Value } from "./lib/value.js";
//# sourceMappingURL=StreamToSequence.d.ts.map