/**
 * add a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.1
 * Inserts the provided [path, value] into the sequence according to preorder traversal
 * order (object keys lexicographically, array indices numerically).
 * Note: For multi-batch inputs, insertion is executed within the first batch where
 * the correct position is found; if not found, it appends to the end of that batch.
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @param {Path} path
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
 */
export default function add(asyncIterable: AsyncIterable<Iterable<[Path, Value, number?, number?]>>, path: Path, value: Value): AsyncIterable<Iterable<[Path, Value, number?, number?]>>;
import { Path } from "../lib/path.js";
import { Value } from "../lib/value.js";
//# sourceMappingURL=add.d.ts.map