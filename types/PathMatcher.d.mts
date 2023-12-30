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
     * @package
     * @param {number} level
     */
    _setIsExhausted(level: number): void;
    /**
     * @package
     * @param {number} level
     */
    _setLevelExhausted(level: number): void;
    /**
     * Check for match
     * @param {import("../types/baseTypes").JSONPathType} path
     */
    nextMatch(path: import("../types/baseTypes").JSONPathType): void;
}
export class PathMatcher {
    /**
     * Matches multiple patch expressions until they are exhausted
     * @param {Array<import("../types/baseTypes").MatchPathType>|string} matchersDataOrString
     */
    constructor(matchersDataOrString: Array<import("../types/baseTypes").MatchPathType> | string);
    /** @type Array<Matcher> */
    matchers: Array<Matcher>;
    filterExhausted: Set<any>;
    isExhausted: boolean;
    doesMatch: boolean;
    /**
     * Check if a path is matching with any path expressions.
     * It updates the attributes "doesMatch" and "IsExhausted"
     * @param {import("../types/baseTypes").JSONPathType} path
     */
    nextMatch(path: import("../types/baseTypes").JSONPathType): void;
    /**
     * Shorthand to filter an iterable of path/value pairs
     * @param {Array<import("../types/baseTypes").JSONPathValueType>} iterable
     */
    filterSequence(iterable: Array<import("../types/baseTypes").JSONPathValueType>): Generator<import("../types/baseTypes").JSONValueType[], void, unknown>;
}
//# sourceMappingURL=PathMatcher.d.mts.map