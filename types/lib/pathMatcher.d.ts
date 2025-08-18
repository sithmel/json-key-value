/**
 * This class is used as generic container of matchers
 */
export class MatcherContainer {
    /**
     * This class is used as generic container of matchers
     * @param {Array<BaseMatcher>} [matchers]
     */
    constructor(matchers?: Array<BaseMatcher>);
    matchers: BaseMatcher[];
    /**
     * Check for match
     * @param {Path} path
     * @return {boolean}
     */
    doesMatch(path: Path): boolean;
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
    stringify(spacer?: string | null): string;
    /**
     * return the length of the longest branch of the tree
     * @return {number}
     */
    maxLength(): number;
}
/**
 * Matcher base implementation
 */
export class BaseMatcher {
    /**
     * This class is used as:
     * - generic container of matchers
     * - base class for all matchers
     * - match *
     * @param {Array<BaseMatcher>} [matchers]
     */
    constructor(matchers?: Array<BaseMatcher>);
    matchers: BaseMatcher[];
    _isExhausted: boolean;
    _isLastPossibleMatch: boolean;
    /**
     * Check if this specific segment matches, without checking the children
     * @param {?import("./path.js").JSONSegmentPathEncodedType} _segment
     * @param {boolean} _parentLastPossibleMatch
     * @return {boolean}
     */
    doesSegmentMatch(_segment: import("./path.js").JSONSegmentPathEncodedType | null, _parentLastPossibleMatch: boolean): boolean;
    /**
     * Check for match
     * @param {Path} path
     * @param {boolean} [parentLastPossibleMatch]
     * @return {boolean}
     */
    doesMatch(path: Path, parentLastPossibleMatch?: boolean): boolean;
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
    stringify(spacer?: string | null, level?: number): string;
    /**
     * return the length of the longest branch of the tree
     * @return {number}
     */
    maxLength(): number;
}
/**
 * @private
 */
export class AnyMatcher extends BaseMatcher {
    /**
     * Check if this specific segment matches, without checking the children
     * @param {import("../lib/path.js").JSONSegmentPathEncodedType} _segment
     * @param {boolean} _parentLastPossibleMatch
     * @return {boolean}
     */
    doesSegmentMatch(_segment: import("../lib/path.js").JSONSegmentPathEncodedType, _parentLastPossibleMatch: boolean): boolean;
}
/**
 * @private
 */
export class SegmentMatcher extends BaseMatcher {
    /**
     * direct match of a number of a string
     * @param {Array<BaseMatcher>} [matchers]
     * @param {import("../lib/path.js").JSONSegmentPathType} segmentMatch
     */
    constructor(segmentMatch: import("../lib/path.js").JSONSegmentPathType, matchers?: Array<BaseMatcher>);
    hasMatchedForLastTime: boolean;
    segmentMatch: import("./path.js").JSONSegmentPathType;
    segmentMatchEncoded: number | CachedString;
    /**
     * Check if this specific segment matches, without checking the children
     * @param {import("../lib/path.js").JSONSegmentPathEncodedType} segment
     * @param {boolean} parentLastPossibleMatch
     * @return {boolean}
     */
    doesSegmentMatch(segment: import("../lib/path.js").JSONSegmentPathEncodedType, parentLastPossibleMatch: boolean): boolean;
}
/**
 * @private
 */
export class SliceMatcher extends BaseMatcher {
    /**
     * Check for a slice (numbers only)
     * @param {{min: number, max: number}} options
     * @param {Array<BaseMatcher>} [matchers]
     */
    constructor(options: {
        min: number;
        max: number;
    }, matchers?: Array<BaseMatcher>);
    hasMatchedForLastTime: boolean;
    min: number;
    max: number;
    /**
     * Check if this specific segment matches, without checking the children
     * @param {import("../lib/path.js").JSONSegmentPathEncodedType} segment
     * @param {boolean} parentLastPossibleMatch
     * @return {boolean}
     */
    doesSegmentMatch(segment: import("../lib/path.js").JSONSegmentPathEncodedType, parentLastPossibleMatch: boolean): boolean;
}
import { Path } from "./path.js";
import { CachedString } from "./value.js";
//# sourceMappingURL=pathMatcher.d.ts.map