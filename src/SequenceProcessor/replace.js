// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
import remove from "./remove.js"
import add from "./add.js"

/**
 * replace a value in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.3
 * Implemented by removing the target path (and subtree) and adding the new value
 * at the correct position to preserve traversal order.
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @param {Path} path
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
 */
export default async function* replace(asyncIterable, path, value) {
  yield* add(remove(asyncIterable, path), path, value)
}
