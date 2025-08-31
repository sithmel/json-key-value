// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
import parseIncludes from "../lib/pathMatcherParser.js"
import { MatcherContainer } from "../lib/pathMatcher.js"

/**
 * Filters an async iterable based on the `includes` expression.
 * @template {[Path, Value, number?, number?]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @param {string|MatcherContainer} includes
 * @returns {AsyncIterable<Iterable<T>>}
 */
export default async function* includes(asyncIterable, includes) {
  const matcher = parseIncludes(includes)

  /**
   * Filters a single iterable based on the matcher.
   * @param {Iterable<T>} iterable
   * @returns {Iterable<T>}
   */
  function* iter(iterable) {
    for (const i of iterable) {
      if (matcher.isExhausted()) break
      if (matcher.doesMatch(i[0])) {
        yield i
      }
    }
  }
  for await (const iterable of asyncIterable) {
    if (matcher.isExhausted()) break
    yield iter(iterable)
  }
}
