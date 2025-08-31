/**
 * remove a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.2
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @param {Path} pathToRemove
 * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
 */
export default function remove(
  asyncIterable: AsyncIterable<Iterable<[Path, Value, number?, number?]>>,
  pathToRemove: Path,
): AsyncIterable<Iterable<[Path, Value, number?, number?]>>
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
//# sourceMappingURL=remove.d.ts.map
