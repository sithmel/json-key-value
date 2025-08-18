/**
 * Build an stream back from the sequence
 * @template {[Path, Value, number?, number?]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @returns {AsyncIterable<Iterable<Uint8Array>>}
 */
export function toIterableBuffer<T extends [Path, Value, number?, number?]>(asyncIterable: AsyncIterable<Iterable<T>>): AsyncIterable<Iterable<Uint8Array>>;
import { Path } from "../lib/path.js";
import { Value } from "../lib/value.js";
//# sourceMappingURL=toIterableBuffer.d.ts.map