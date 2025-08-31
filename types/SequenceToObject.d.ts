export default SequenceToObject;
/**
 * Convert a sequence to a js object
 */
declare class SequenceToObject {
    /**
     * Convert a sequence to a js object
     * @param {any} [obj]
     * @param {boolean} [sparse=false] - if true, creates sparse arrays respecting original indexes
     */
    constructor(obj?: any, sparse?: boolean);
    object: any;
    sparse: boolean;
    previousPath: Path;
    /**
     * @private
     * @param {CachedString|number|null} pathSegment
     * @param {boolean} isPreviousCommonPathSegment
     * @param {any} currentObject
     * @returns {string|number}
     */
    private _calculateRealIndex;
    /**
     * Returns the object built out of the sequence
     * It can be called multiple times and it will return the up to date object
     * @returns {any}
     */
    getObject(): any;
    /**
     * Update the object with a new path value pairs
     * @param {Path} path - an array of path segments
     * @param {Value} value - the value corresponding to the path
     * @returns {this}
     */
    add(path: Path, value: Value): this;
}
import { Path } from "./lib/path.js";
import { Value } from "./lib/value.js";
//# sourceMappingURL=SequenceToObject.d.ts.map