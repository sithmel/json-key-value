/**
 * remove a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.2
 * @template {[Path, Value, number?, number?]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @param {Path} pathToRemove
 * @returns {AsyncIterable<Iterable<T>>}
 */
export default function remove<T extends [Path, Value, number?, number?]>(asyncIterable: AsyncIterable<Iterable<T>>, pathToRemove: Path): AsyncIterable<Iterable<T>>;
import { Path } from "../lib/path.js";
import { Value } from "../lib/value.js";
//# sourceMappingURL=remove.d.ts.map