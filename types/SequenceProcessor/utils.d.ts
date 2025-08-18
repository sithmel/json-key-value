/**
 * Build the list of new items to insert/tests. If `value` is a subobject, expand it using
 * ObjectToSequence and concatenate the base path; otherwise return the single pair.
 * @param {Path} basePath
 * @param {Value|Iterable<[Path, Value]>} value
 * @returns {Iterable<[Path, Value]>}
 */
export function getSequenceFromValue(basePath: Path, value: Value | Iterable<[Path, Value]>): Iterable<[Path, Value]>;
import { Path } from "../lib/path.js";
import { Value } from "../lib/value.js";
//# sourceMappingURL=utils.d.ts.map