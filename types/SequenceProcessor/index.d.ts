/**
 * @extends {GenericBatchIterable<[Path, Value, number?, number?]>}
 */
export class SequenceProcessor extends GenericBatchIterable<[Path, Value, (number | undefined)?, (number | undefined)?]> {
    constructor(_iterable?: AsyncIterable<Iterable<[Path, Value, (number | undefined)?, (number | undefined)?]>> | GenericBatchIterable<[Path, Value, (number | undefined)?, (number | undefined)?]> | Iterable<Iterable<[Path, Value, (number | undefined)?, (number | undefined)?]>> | undefined);
    /**
     * It filters the sequence based on the given expression
     * @param {string|MatcherContainer} [expression]
     * @returns {this}
     */
    includes(expression?: string | MatcherContainer): this;
    /**
     * add a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.1
     * @param {import("../lib/path.js").JSONPathType} path
     * @param {any} value
     * @returns {this}
     */
    add(path: import("../lib/path.js").JSONPathType, value: any): this;
    /**
     * remove a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.2
     * @param {import("../lib/path.js").JSONPathType} path
     * @returns {this}
     */
    remove(path: import("../lib/path.js").JSONPathType): this;
    /**
     * replace a value in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.3
     * @param {import("../lib/path.js").JSONPathType} path
     * @param {any} value
     * @returns {this}
     */
    replace(path: import("../lib/path.js").JSONPathType, value: any): this;
    /**
     * test if a value is in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.6
     * @param {import("../lib/path.js").JSONPathType} path
     * @param {any} value
     * @returns {this}
     */
    test(path: import("../lib/path.js").JSONPathType, value: any): this;
    /**
     * Apply JSON Patch operations to the sequence https://datatracker.ietf.org/doc/html/rfc6902
     * @param {Array<import("./JSONPointer.js").Operation>} patchArray
     * @returns {this}
     */
    patch(patchArray: Array<import("./JSONPointer.js").Operation>): this;
    /**
     * Build an object back from the sequence
     * @param {any} [obj] - Options for the sequence to object conversion
     * @param {boolean} [sparse=false] - if true, creates sparse arrays respecting original indexes
    * @returns {Promise<any>}
     */
    toObject(obj?: any, sparse?: boolean): Promise<any>;
    /**
     * Build an stream back from the sequence
     * @returns {BatchIterable}
     */
    toIterableBuffer(): BatchIterable;
}
import { Path } from "../lib/path.js";
import { Value } from "../lib/value.js";
import { GenericBatchIterable } from "batch-iterable";
import { MatcherContainer } from "../lib/pathMatcher.js";
import { BatchIterable } from "batch-iterable";
//# sourceMappingURL=index.d.ts.map