export class MatcherContainer {
    /**
     * This class is used as generic container of matchers
     * @param {Array<BaseMatcher>} [matchers]
     */
    constructor(matchers?: BaseMatcher[] | undefined);
    matchers: BaseMatcher[];
    /**
     * Check for match
     * @param {import("../../types/baseTypes.js").JSONPathType} path
     * @return {boolean}
     */
    doesMatch(path: import("../../types/baseTypes.js").JSONPathType): boolean;
    /**
     * Check if matchers are exhausted
     * @return {boolean}
     */
    isExhausted(): boolean;
    /**
     * print as a string
     * @param {string?} [spacer]
     * @return {string}
     */
    stringify(spacer?: string | null | undefined): string;
    /**
     * return the length of the longest branch of the tree
     * @return {number}
     */
    maxLength(): number;
}
export class AnyMatcher extends BaseMatcher {
}
export class SegmentMatcher extends BaseMatcher {
    /**
     * direct match of a number of a string
     * @param {Array<BaseMatcher>} [matchers]
     * @param {import("../../types/baseTypes.js").JSONSegmentPathType} segmentMatch
     */
    constructor(segmentMatch: import("../../types/baseTypes.js").JSONSegmentPathType, matchers?: BaseMatcher[] | undefined);
    hasMatchedForLastTime: boolean;
    segmentMatch: import("../../types/baseTypes.js").JSONSegmentPathType;
}
export class SliceMatcher extends BaseMatcher {
    /**
     * Check for a slice (numbers only)
     * @param {{min: number, max: number}} options
     * @param {Array<BaseMatcher>} [matchers]
     */
    constructor(options: {
        min: number;
        max: number;
    }, matchers?: BaseMatcher[] | undefined);
    hasMatchedForLastTime: boolean;
    min: number;
    max: number;
}
declare class BaseMatcher {
    /**
     * This class is used as:
     * - generic container of matchers
     * - base class for all matchers
     * - match *
     * @param {Array<BaseMatcher>} [matchers]
     */
    constructor(matchers?: BaseMatcher[] | undefined);
    matchers: BaseMatcher[];
    _isExhausted: boolean;
    _isLastPossibleMatch: boolean;
    /**
     * Check if this specific segment matches, without checking the children
     * @param {import("../../types/baseTypes.js").JSONSegmentPathType} _segment
     * @param {boolean} _parentLastPossibleMatch
     * @return {boolean}
     */
    doesSegmentMatch(_segment: import("../../types/baseTypes.js").JSONSegmentPathType, _parentLastPossibleMatch: boolean): boolean;
    /**
     * Check for match
     * @param {import("../../types/baseTypes.js").JSONPathType} path
     * @param {boolean} [parentLastPossibleMatch]
     * @return {boolean}
     */
    doesMatch(path: import("../../types/baseTypes.js").JSONPathType, parentLastPossibleMatch?: boolean | undefined): boolean;
    /**
     * Check if matcher is exhausted (or children)
     * @return {boolean}
     */
    isExhausted(): boolean;
    /**
     * print as a string
     * @param {string?} [spacer]
     * @param {number} [level]
     * @return {string}
     */
    stringify(spacer?: string | null | undefined, level?: number | undefined): string;
    /**
     * return the length of the longest branch of the tree
     * @return {number}
     */
    maxLength(): number;
}
export {};
//# sourceMappingURL=matcher.d.mts.map