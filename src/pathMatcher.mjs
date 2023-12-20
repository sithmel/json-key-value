//@ts-check

/**
 * Enum for matcher state
 * @readonly
 * @enum {string}
 */
export const MATCHER = {
  NOT_MATCHING: "NOT_MATCHING",
  MATCHING: "MATCHING",
  PARTIAL_MATCHING: "PARTIAL_MATCHING",
}

/**
 * does match
 * @param {import("../types/baseTypes").JSONPathMatchType} filter
 * @param {import("../types/baseTypes").JSONPathType} path
 * @returns {MATCHER}
 */
export function doesMatch(filter, path) {
  let match = MATCHER.NOT_MATCHING
  for (let i = 0; i < filter.length; i++) {
    const filterMatchOrSlice = filter[i]
    const pathSegment = path[i]
    if (
      filterMatchOrSlice.type === "match" &&
      filterMatchOrSlice.match === pathSegment
    ) {
      match = MATCHER.PARTIAL_MATCHING
    } else if (
      filterMatchOrSlice.type === "slice" &&
      pathSegment >= filterMatchOrSlice.sliceFrom &&
      pathSegment < filterMatchOrSlice.sliceTo
    ) {
      match = MATCHER.PARTIAL_MATCHING
    } else {
      return match
    }
  }
  return MATCHER.MATCHING
}

/**
 * include/exclude a sequence
 * @param {boolean} includeOnMatch
 * @param {Array<import("../types/baseTypes").JSONPathMatchType>} filters
 * @param {Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @returns {Iterable<import("../types/baseTypes").JSONPathValueType>}
 */
function* filterByPath(includeOnMatch, filters, iterable) {
  const filterExhausted = new Set()
  const filterPartial = new Set()
  for (const [path, value] of iterable) {
    if (filterExhausted.size === filters.length) {
      if (includeOnMatch) {
        break // nothing else to match
      } else {
        yield [path, value]
        continue
      }
    }
    let including = !includeOnMatch
    for (const filter of filters) {
      if (filterExhausted.has(filter)) {
        continue
      }
      const matchingState = doesMatch(filter, path)
      if (matchingState === MATCHER.MATCHING) {
        filterPartial.add(filter)
        including = includeOnMatch
      } else if (matchingState === MATCHER.PARTIAL_MATCHING) {
        filterPartial.add(filter)
      } else {
        if (filterPartial.has(filter)) {
          filterExhausted.add(filter)
        }
      }
    }
    if (including) {
      yield [path, value]
    }
  }
}

/**
 * include a sequence
 * @param {Array<import("../types/baseTypes").JSONPathMatchType>} matchers
 * @param {Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @returns {Iterable<import("../types/baseTypes").JSONPathValueType>}
 */
export function includeByPath(matchers, iterable) {
  return filterByPath(true, matchers, iterable)
}

/**
 * exclude a sequence
 * @param {Array<import("../types/baseTypes").JSONPathMatchType>} matchers
 * @param {Iterable<import("../types/baseTypes").JSONPathValueType>} iterable
 * @returns {Iterable<import("../types/baseTypes").JSONPathValueType>}
 */
export function excludeByPath(matchers, iterable) {
  return filterByPath(false, matchers, iterable)
}
