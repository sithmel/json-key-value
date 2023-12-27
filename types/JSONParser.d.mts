export default class JSONParser {
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
     * @param {string|number} segment
     */
    pushPathSegment(segment: string | number): void;
    /**
     * remove a segment from the path
     * @returns {string|number}
     */
    popPathSegment(): string | number;
    /**
     * add another segment to the path
     * @param {STATE} state
     */
    pushState(state: STATE): void;
    /**
     * pops the parser state
     * @returns {string}
     */
    popState(): string;
    /**
     * Check if there is a white space
     * @returns {boolean}
     */
    isFinished(): boolean;
    /**
     * parse a json or json fragment
     * @param {AsyncIterable<string>|Iterable<string>} chunks
     * @returns {AsyncIterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
     */
    parse(chunks: AsyncIterable<string> | Iterable<string>): AsyncIterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>;
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
//# sourceMappingURL=JSONParser.d.mts.map