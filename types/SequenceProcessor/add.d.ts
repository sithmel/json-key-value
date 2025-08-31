/**
 * add a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.1
 * Inserts the provided [path, value] into the sequence according to the JSON order.
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @param {Path} pathToAdd
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
 */
export default function add(asyncIterable: AsyncIterable<Iterable<[Path, Value, number?, number?]>>, pathToAdd: Path, value: Value): AsyncIterable<Iterable<[Path, Value, number?, number?]>>;
import { Path } from "../lib/path.js";
import { Value } from "../lib/value.js";
//# sourceMappingURL=add.d.ts.map