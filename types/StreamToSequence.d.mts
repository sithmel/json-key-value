export default class StreamToSequence {
    state: string;
    /** @type {Array<STATE>} */
    stateStack: Array<STATE>;
    char: string;
    /** @type {import("../types/baseTypes").JSONPathType} */
    currentPath: import("../types/baseTypes").JSONPathType;
    stringBuffer: string;
    unicodeBuffer: string;
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
     * @param {string} chunk
     * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
     */
    iter(chunk: string): Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>;
}
/**
 * Enum for parser state
 */
type STATE = string;
declare namespace STATE {
    let VALUE: string;
    let OPEN_OBJECT: string;
    let CLOSE_OBJECT: string;
    let OPEN_ARRAY: string;
    let CLOSE_ARRAY: string;
    let OPEN_KEY: string;
    let CLOSE_KEY: string;
    let TRUE: string;
    let TRUE2: string;
    let TRUE3: string;
    let FALSE: string;
    let FALSE2: string;
    let FALSE3: string;
    let FALSE4: string;
    let NULL: string;
    let NULL2: string;
    let NULL3: string;
    let NUMBER: string;
    let NUMBER_DECIMAL: string;
    let NUMBER_EXPONENT_SIGN: string;
    let NUMBER_EXPONENT_NUMBER: string;
    let STRING: string;
    let STRING_SLASH_CHAR: string;
    let STRING_UNICODE_CHAR: string;
    let END: string;
}
export {};
//# sourceMappingURL=StreamToSequence.d.mts.map