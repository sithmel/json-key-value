/**
 * include a sequence item
 * @param {AsyncIterable<import("../types/baseTypes").JSONPathValueType>|Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @param {Array<import("../types/baseTypes").MatchPathType>} matchers
 * @returns {AsyncIterable<import("../types/baseTypes").JSONPathValueType>}
 */
export function includeByPath(iterable: AsyncIterable<import("../types/baseTypes").JSONPathValueType> | Iterable<import("../types/baseTypes").JSONPathValueType>, matchers: Array<import("../types/baseTypes").MatchPathType>): AsyncIterable<import("../types/baseTypes").JSONPathValueType>;
/**
 * exclude a sequence item
 * @param {AsyncIterable<import("../types/baseTypes").JSONPathValueType>|Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @param {Array<import("../types/baseTypes").MatchPathType>} matchers
 * @returns {AsyncIterable<import("../types/baseTypes").JSONPathValueType>}
 */
export function excludeByPath(iterable: AsyncIterable<import("../types/baseTypes").JSONPathValueType> | Iterable<import("../types/baseTypes").JSONPathValueType>, matchers: Array<import("../types/baseTypes").MatchPathType>): AsyncIterable<import("../types/baseTypes").JSONPathValueType>;
/**
 * filter a sequence
 * @param {AsyncIterable<import("../types/baseTypes").JSONPathValueType>|Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @param {Array<import("../types/baseTypes").MatchPathType>|string|null} include
 * @param {Array<import("../types/baseTypes").MatchPathType>|string|null} exclude
 * @returns {AsyncIterable<import("../types/baseTypes").JSONPathValueType>|Iterable<import("../types/baseTypes").JSONPathValueType>}
 */
export function filterByPath(iterable: AsyncIterable<import("../types/baseTypes").JSONPathValueType> | Iterable<import("../types/baseTypes").JSONPathValueType>, include?: Array<import("../types/baseTypes").MatchPathType> | string | null, exclude?: Array<import("../types/baseTypes").MatchPathType> | string | null): AsyncIterable<import("../types/baseTypes").JSONPathValueType> | Iterable<import("../types/baseTypes").JSONPathValueType>;
export class Matcher {
    /**
     * Performs matches and checks if the matcher will no longer
     * be matching any subsequent path (is exhausted)
     * It works like that:
     * Let's assume out matcher data is A[4:7]C:
     * B2C : Not matching, we must keep searching until encountering the segment A
     * A1  : Not matching, we can set the levelExhausted to [true] because we found A as a first match
     *       This means that if we no longer match A we can consider the search over
     * A4C : Matching! levelExhausted is still [true] because we can have a bigger number
     *       in second position (up until 6)
     * A7A : Not matching: we immediately set levelExhausted to [true, true] as we can't have
     *       a bigger number than 6 in position 2
     * True values in levelExhausted needs to be adjacent starting with the first.
     * If a segment doesn't match and the corresponding boolean in levelExhausted is true
     * then we consider the match to be exhausted (no further matches are possible)
     * @param {import("../types/baseTypes").MatchPathType} match
     */
    constructor(match: import("../types/baseTypes").MatchPathType);
    match: import("../types/baseTypes").MatchPathType;
    levelExhausted: any[];
    isExhausted: boolean;
    doesMatch: boolean;
    /**
     * @param {number} level
     */
    _setIsExhausted(level: number): void;
    /**
     * @param {number} level
     */
    _setLevelExhausted(level: number): void;
    /**
     * @param {import("../types/baseTypes").JSONPathType} path
     */
    nextMatch(path: import("../types/baseTypes").JSONPathType): void;
}
//# sourceMappingURL=filterByPath.d.mts.map