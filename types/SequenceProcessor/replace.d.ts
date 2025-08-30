/**
 * replace a value in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.3
 * Implemented by removing the target path (and subtree) and adding the new value
 * at the correct position to preserve traversal order.
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @param {Path} pathToReplace
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
 */
export default function replace(
  asyncIterable: AsyncIterable<Iterable<[Path, Value, number?, number?]>>,
  pathToReplace: Path,
  value: Value,
): AsyncIterable<Iterable<[Path, Value, number?, number?]>>
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
//# sourceMappingURL=replace.d.ts.map
