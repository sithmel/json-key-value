/**
 * Build the list of new items to insert/tests. If `value` is a subobject, expand it using
 * ObjectToSequence and concatenate the base path; otherwise return the single pair.
 * @param {Path} basePath
 * @param {Value|Iterable<[Path, Value]>} value
 * @returns {Iterable<[Path, Value]>}
 */
export function getSequenceFromValue(
  basePath: Path,
  value: Value | Iterable<[Path, Value]>,
): Iterable<[Path, Value]>
/**
 * @template {string} S - state
 * @template {string} T - transition
 */
export class StateMachine<S extends string, T extends string> {
  /**
   * @param {Record<S, Record<T,S>>} stateMap
   * @param {S} initialState
   */
  constructor(stateMap: Record<S, Record<T, S>>, initialState: S)
  stateMap: Record<S, Record<T, S>>
  status: S
  /**
   * @param {T} transitionName
   */
  transition(transitionName: T): void
  /**
   * Check if the current state matches the given state.
   * @param {...S} state
   * @returns
   */
  is(...state: S[]): boolean
}
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
//# sourceMappingURL=utils.d.ts.map
