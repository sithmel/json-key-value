/// <reference types="node" />
/**
 * Enum for token value
 */
export type TOKEN = number;
export namespace TOKEN {
    let OPEN_BRACES: number;
    let CLOSED_BRACES: number;
    let OPEN_BRACKET: number;
    let CLOSED_BRACKET: number;
    let COMMA: number;
    let COLON: number;
    let STRING: number;
    let NUMBER: number;
    let TRUE: number;
    let FALSE: number;
    let NULL: number;
}
export default class StreamJSONTokenizer {
    totalBufferIndex: number;
    state: number;
    /** @type Array<number> */
    outputBuffer: Array<number>;
    decoder: import("util").TextDecoder;
    /**
     * decode the string buffer into a string
     * @returns {string}
     */
    getOutputBufferAsString(): string;
    /**
     * Parse a json or json fragment, return a sequence of path/value pairs
     * @param {Uint8Array} current_buffer
     * @returns {Iterable<TOKEN>}
     */
    iter(current_buffer: Uint8Array): Iterable<TOKEN>;
}
//# sourceMappingURL=StreamJSONTokenizer.d.mts.map