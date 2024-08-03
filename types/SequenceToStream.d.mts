/// <reference types="node" />
export default class SequenceToStream {
    /**
     * Convert a sequence of path value pairs to a stream of characters
     * @param {{onData: (arg0: Uint8Array) => Promise<void>, compactArrays?: boolean}} onData
     */
    constructor({ onData, compactArrays }: {
        onData: (arg0: Uint8Array) => Promise<void>;
        compactArrays?: boolean | undefined;
    });
    /** @type {import("../types/baseTypes").JSONPathType} */
    currentPath: import("../types/baseTypes").JSONPathType;
    onData: (arg0: Uint8Array) => Promise<void>;
    /** @type CONTEXT */
    context: CONTEXT;
    lastWritePromise: Promise<void>;
    compactArrays: boolean;
    encoder: import("util").TextEncoder;
    /**
     * @package
     * @param {string} str
     */
    _output(str: string): Promise<void>;
    /**
     * add a new path value pair
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
//# sourceMappingURL=SequenceToStream.d.mts.map