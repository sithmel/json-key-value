/**
 * test if a value is in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.6
 * Pass-through: yields the original sequence unchanged but asserts that the expected
 * path/value is present. If `value.decoded` is an object/array, expand it via ObjectToSequence
 * and assert that all concatenated sub path/values are present.
 * @template {[Path, Value, number?, number?]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @param {Path} path
 * @param {Value|Iterable<[Path, Value]>} value
 * @returns {AsyncIterable<Iterable<T>>}
 */
export default function test<T extends [Path, Value, number?, number?]>(asyncIterable: AsyncIterable<Iterable<T>>, path: Path, value: Value | Iterable<[Path, Value]>): AsyncIterable<Iterable<T>>;
import { Path } from "../lib/path.js";
import { Value } from "../lib/value.js";
//# sourceMappingURL=test.d.ts.map