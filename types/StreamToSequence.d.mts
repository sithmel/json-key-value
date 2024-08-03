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
    /** @type {import("../types/baseTypes").JSONPathType} */
    currentPath: import("../types/baseTypes").JSONPathType;
    stringBuffer: string;
    objectBuffer: string;
    /**
     * add another segment to the path
     * @package
     * @param {TOKEN} token
     */
    _addToObjectBuffer(token: TOKEN): void;
    /**
     * add another segment to the path
     * @package
     * @param {string|number} segment
     */
    _pushPathSegment(segment: string | number): void;
    /**
     * remove a segment from the path
     * @package
     * @returns {string|number}
     */
    _popPathSegment(): string | number;
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