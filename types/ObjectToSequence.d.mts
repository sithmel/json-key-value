export default class ObjectToSequence {
    /**
     * Convert a stream of characters (in chunks) to a sequence of path/value pairs
     * @param {{ maxDepth?: number, includes?: string }} options
     */
    constructor(options?: {
        maxDepth?: number | undefined;
        includes?: string | undefined;
    });
    maxDepth: number;
    matcher: MatcherContainer;
    /**
     * parse a json or json fragment
     * @param {any} obj
     * @param {import("../types/baseTypes").JSONPathType} currentPath
     * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
     */
    iter(obj: any, currentPath?: import("../types/baseTypes").JSONPathType): Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>;
}
import { MatcherContainer } from "./pathExp/matcher.mjs";
//# sourceMappingURL=ObjectToSequence.d.mts.map