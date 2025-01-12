export default ObjectToSequence;
export type JSONValueType = import("./baseTypes").JSONValueType;
export type JSONPathType = import("./baseTypes").JSONPathType;
/**
 * Convert a js value into a sequence of path/value pairs
 */
declare class ObjectToSequence {
    /**
     * Convert a js value into a sequence of path/value pairs
     * @param {Object} [options]
     * @param {number} [options.maxDepth=Infinity] - Max parsing depth
     * @param {string} [options.includes=null] - Expression using the includes syntax
     */
    constructor(options?: {
        maxDepth?: number | undefined;
        includes?: string | undefined;
    });
    maxDepth: number;
    matcher: MatcherContainer;
    /**
     * yields path/value pairs from a given object
     * @param {any} obj - Any JS value
     * @param {Path} [currentPath] - Only for internal use
     * @returns {Iterable<[JSONPathType, JSONValueType]>}
     */
    iter(obj: any, currentPath?: Path): Iterable<[JSONPathType, JSONValueType]>;
}
import { MatcherContainer } from "./pathExp/matcher.js";
import { Path } from "./pathExp/path.js";
//# sourceMappingURL=ObjectToSequence.d.ts.map