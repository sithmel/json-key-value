/**
 * This class is used as generic container of matchers
 */
export class MatcherContainer {
  /**
   * This class is used as generic container of matchers
   * @param {Array<BaseMatcher>} [matchers]
   */
  constructor(matchers?: Array<BaseMatcher>)
  matchers: BaseMatcher[]
  /**
   * Check for match
   * @param {Path} path
   * @return {boolean}
   */
  doesMatch(path: Path): boolean
  /**
   * Check if matchers are exhausted
   * @return {boolean}
   */
  isExhausted(): boolean
  /**
   * print as a string
   * @param {string?} [spacer]
   * @return {string}
   */
  stringify(spacer?: string | null): string
  /**
   * return the length of the longest branch of the tree
   * @return {number}
   */
  maxLength(): number
}
/**
 * @private
 */
export class AnyMatcher extends BaseMatcher {
  /**
   * Check if this specific segment matches, without checking the children
   * @param {CachedStringBuffer|number|string} _segment
   * @param {boolean} _parentLastPossibleMatch
   * @return {boolean}
   */
  doesSegmentMatch(
    _segment: CachedStringBuffer | number | string,
    _parentLastPossibleMatch: boolean,
  ): boolean
}
/**
 * @private
 */
export class SegmentMatcher extends BaseMatcher {
  /**
   * direct match of a number of a string
   * @param {Array<BaseMatcher>} [matchers]
   * @param {JSONSegmentPathType} segmentMatch
   */
  constructor(segmentMatch: JSONSegmentPathType, matchers?: Array<BaseMatcher>)
  hasMatchedForLastTime: boolean
  segmentMatch: import("../../types/baseTypes").JSONSegmentPathType
  segmentMatchEncoded: number | Uint8Array<ArrayBufferLike>
  /**
   * Check if this specific segment matches, without checking the children
   * @param {CachedStringBuffer|number|string} segment
   * @return {boolean}
   */
  _doesMatch(segment: CachedStringBuffer | number | string): boolean
  /**
   * Check if this specific segment matches, without checking the children
   * @param {CachedStringBuffer|number|string} segment
   * @param {boolean} parentLastPossibleMatch
   * @return {boolean}
   */
  doesSegmentMatch(
    segment: CachedStringBuffer | number | string,
    parentLastPossibleMatch: boolean,
  ): boolean
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
  constructor(
    options: {
      min: number
      max: number
    },
    matchers?: Array<BaseMatcher>,
  )
  hasMatchedForLastTime: boolean
  min: number
  max: number
  /**
   * Check if this specific segment matches, without checking the children
   * @param {CachedStringBuffer|number|string} segment
   * @param {boolean} parentLastPossibleMatch
   * @return {boolean}
   */
  doesSegmentMatch(
    segment: CachedStringBuffer | number | string,
    parentLastPossibleMatch: boolean,
  ): boolean
}
export type JSONSegmentPathType =
  import("../../types/baseTypes").JSONSegmentPathType
/**
 * @private
 */
declare class BaseMatcher {
  /**
   * This class is used as:
   * - generic container of matchers
   * - base class for all matchers
   * - match *
   * @param {Array<BaseMatcher>} [matchers]
   */
  constructor(matchers?: Array<BaseMatcher>)
  matchers: BaseMatcher[]
  _isExhausted: boolean
  _isLastPossibleMatch: boolean
  /**
   * Check if this specific segment matches, without checking the children
   * @param {?CachedStringBuffer|number|string} _segment
   * @param {boolean} _parentLastPossibleMatch
   * @return {boolean}
   */
  doesSegmentMatch(
    _segment: (CachedStringBuffer | number | string) | null,
    _parentLastPossibleMatch: boolean,
  ): boolean
  /**
   * Check for match
   * @param {Path} path
   * @param {boolean} [parentLastPossibleMatch]
   * @return {boolean}
   */
  doesMatch(path: Path, parentLastPossibleMatch?: boolean): boolean
  /**
   * Check if matcher is exhausted (or children)
   * @return {boolean}
   */
  isExhausted(): boolean
  /**
   * print as a string
   * @param {string?} [spacer]
   * @param {number} [level]
   * @return {string}
   */
  stringify(spacer?: string | null, level?: number): string
  /**
   * return the length of the longest branch of the tree
   * @return {number}
   */
  maxLength(): number
}
import { Path } from "./path.mjs"
import { CachedStringBuffer } from "./path.mjs"
export {}
//# sourceMappingURL=matcher.d.mts.map
