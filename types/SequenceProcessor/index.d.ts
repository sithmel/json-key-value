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
     * @param {Path} path
     * @param {Value} value
     * @returns {this}
     */
    add(path: Path, value: Value): this;
    /**
     * remove a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.2
     * @param {Path} path
     * @returns {this}
     */
    remove(path: Path): this;
    /**
     * replace a value in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.3
     * @param {Path} path
     * @param {Value} value
     * @returns {this}
     */
    replace(path: Path, value: Value): this;
    /**
     * test if a value is in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.6
     * @param {Path} path
     * @param {Value} value
     * @returns {this}
     */
    test(path: Path, value: Value): this;
    /**
     * Build an object back from the sequence
     * @param {any} [obj] - Options for the sequence to object conversion
     * @returns {Promise<any>}
     */
    toObject(obj?: any): Promise<any>;
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