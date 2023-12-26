export default class JSONBuilder {
    /**
     * JSONBuilder
     * @param {(arg0: string) => {}} onData
     */
    constructor(onData: (arg0: string) => {});
    /** @type {import("../types/baseTypes").JSONPathType} */
    currentPath: import("../types/baseTypes").JSONPathType;
    onData: (arg0: string) => {};
    /** @type CONTEXT */
    context: CONTEXT;
    /**
     * add a sequence
     * @param {import("../types/baseTypes").JSONPathType} path
     * @param {import("../types/baseTypes").JSONValueType} value
     * @returns {void}
     */
    add(path: import("../types/baseTypes").JSONPathType, value: import("../types/baseTypes").JSONValueType): void;
    /**
     * The input stream is completed
     * @returns {void}
     */
    end(): void;
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