export default class JSONBuilder {
    /**
     * JSONBuilder
     * @param {(arg0: string) => Promise<void>} onData
     */
    constructor(onData: (arg0: string) => Promise<void>);
    /** @type {import("../types/baseTypes").JSONPathType} */
    currentPath: import("../types/baseTypes").JSONPathType;
    onData: (arg0: string) => Promise<void>;
    /** @type CONTEXT */
    context: CONTEXT;
    lastWritePromise: Promise<void>;
    /**
     * @param {string} str
     */
    _output(str: string): Promise<void>;
    /**
     * add a sequence
     * @param {import("../types/baseTypes").JSONPathType} path
     * @param {import("../types/baseTypes").JSONValueType} value
     * @returns {void}
     */
    add(path: import("../types/baseTypes").JSONPathType, value: import("../types/baseTypes").JSONValueType): void;
    /**
     * The input stream is completed
     * @returns {Promise<void>}
     */
    end(): Promise<void>;
}
/**
 * Enum for CONTEXT
 */
type CONTEXT = string;
declare namespace CONTEXT {
    let OBJECT: string;
    let ARRAY: string;
    let NULL: string;
}
export {};
//# sourceMappingURL=JSONBuilder.d.mts.map