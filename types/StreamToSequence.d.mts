/// <reference types="node" />
export default class StreamToSequence {
    /**
     * Convert a stream of characters (in chunks) to a sequence of path/value pairs
     * @param {{ maxDepth?: number, includes?: string }} options
     */
    constructor(options?: {
        maxDepth?: number | undefined;
        includes?: string | undefined;
    });
    maxDepth: number;
    currentDepthInObject: number;
    matcher: MatcherContainer;
    tokenizer: StreamJSONTokenizer;
    state: string;
    /** @type {Array<STATE>} */
    stateStack: Array<STATE>;
    char: string;
    /** @type {import("../types/baseTypes").JSONPathBufferType} */
    currentPath: import("../types/baseTypes").JSONPathBufferType;
    stringBuffer: Uint8Array;
    /** @type {Array<number>} */
    objectBuffer: Array<number>;
    decoder: import("util").TextDecoder;
    /**
     * add another segment to the path
     * @package
     * @param {TOKEN} token
     */
    _addToObjectBuffer(token: TOKEN): void;
    /**
     * convert JSONPathBufferType to JSONPathType
     * @package
     * @return {import("../types/baseTypes").JSONPathType}
     */
    _getEncodedCurrentPath(): import("../types/baseTypes").JSONPathType;
    /**
     * add another segment to the path
     * @package
     * @param {import("../types/baseTypes").JSONSegmentPathBufferType} segment
     */
    _pushPathSegment(segment: import("../types/baseTypes").JSONSegmentPathBufferType): void;
    /**
     * remove a segment from the path
     * @package
     * @returns {import("../types/baseTypes").JSONSegmentPathBufferType}
     */
    _popPathSegment(): import("../types/baseTypes").JSONSegmentPathBufferType;
    /**
     * add another segment to the path
     * @package
     * @param {STATE} state
     */
    _pushState(state: STATE): void;
    /**
     * pops the parser state
     * @package
     * @returns {string}
     */
    _popState(): string;
    /**
     * Check if the JSON parsing completed correctly
     * @returns {boolean}
     */
    isFinished(): boolean;
    /**
     * Parse a json or json fragment, return a sequence of path/value pairs
     * @param {Uint8Array} chunk
     * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
     */
    iter(chunk: Uint8Array): Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>;
}
import { MatcherContainer } from "./pathExp/matcher.mjs";
import StreamJSONTokenizer from "./StreamJSONTokenizer.mjs";
/**
 * Enum for parser state
 */
type STATE = string;
declare namespace STATE {
    let VALUE: string;
    let OPEN_OBJECT: string;
    let CLOSE_OBJECT: string;
    let CLOSE_ARRAY: string;
    let OPEN_KEY: string;
    let CLOSE_KEY: string;
    let END: string;
    let SUB_OBJECT: string;
}
import { TOKEN } from "./StreamJSONTokenizer.mjs";
export {};
//# sourceMappingURL=StreamToSequence.d.mts.map