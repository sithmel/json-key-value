/**
 * Enum for character codes
 */
export type CHAR_CODE = number;
export namespace CHAR_CODE {
    let N0: number;
    let N9: number;
    let MINUS: number;
    let OPEN_BRACES: number;
    let CLOSED_BRACES: number;
    let QUOTE: number;
    let COLON: number;
    let COMMA: number;
    let OPEN_BRACKETS: number;
    let CLOSED_BRACKETS: number;
    let BACKSLASH: number;
    let SPACE: number;
    let CR: number;
    let LF: number;
    let TAB: number;
    let BACKSPACE: number;
    let DC2: number;
    let B: number;
    let T: number;
    let F: number;
    let N: number;
    let R: number;
    let U: number;
    let CAPITAL_E: number;
    let E: number;
    let A: number;
    let L: number;
    let S: number;
    let DOT: number;
}
/**
 * Enum for token value
 */
export type TOKEN = number;
export namespace TOKEN {
    let OPEN_BRACES_1: number;
    export { OPEN_BRACES_1 as OPEN_BRACES };
    let CLOSED_BRACES_1: number;
    export { CLOSED_BRACES_1 as CLOSED_BRACES };
    export let OPEN_BRACKET: number;
    export let CLOSED_BRACKET: number;
    let COMMA_1: number;
    export { COMMA_1 as COMMA };
    let COLON_1: number;
    export { COLON_1 as COLON };
    export let STRING: number;
    export let NUMBER: number;
    export let TRUE: number;
    export let FALSE: number;
    export let NULL: number;
}
export default class StreamJSONTokenizer {
    totalBufferIndex: number;
    state: number;
    /** @type Array<number> */
    outputBuffer: Array<number>;
    /**
     * returns the outputBuffer
     * @returns {Array<number>}
     */
    getOutputBuffer(): Array<number>;
    /**
     * Parse a json or json fragment, return a sequence of path/value pairs
     * @param {Uint8Array} current_buffer
     * @returns {Iterable<TOKEN>}
     */
    iter(current_buffer: Uint8Array): Iterable<TOKEN>;
}
//# sourceMappingURL=StreamJSONTokenizer.d.mts.map