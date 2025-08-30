// @ts-check
import { Path } from "../lib/path.js"
import { Value, CachedSubObject } from "../lib/value.js"
import ObjectToSequence from "../ObjectToSequence.js"

/**
 * Build the list of new items to insert/tests. If `value` is a subobject, expand it using
 * ObjectToSequence and concatenate the base path; otherwise return the single pair.
 * @param {Path} basePath
 * @param {Value|Iterable<[Path, Value]>} value
 * @returns {Iterable<[Path, Value]>}
 */
export function* getSequenceFromValue(basePath, value) {
  /**
   * Build the list of new items to insert/tests. If `value` is a subobject, expand it using
   * ObjectToSequence and concatenate the base path; otherwise return the single pair.
   * @param {Iterable<[Path, Value]>} iterable
   * @returns {Iterable<[Path, Value]>}
   */
  function* concatenatePathToIterable(iterable) {
    for (const [subPath, subVal] of iterable) {
      const fullPath = new Path([...basePath.array, ...subPath.array])
      yield [fullPath, subVal]
    }
  }

  // check if value is iterable
  if (!(value instanceof Value)) {
    yield* concatenatePathToIterable(value)
  } else if (value instanceof CachedSubObject) {
    const o2s = new ObjectToSequence()
    yield* concatenatePathToIterable(o2s.iter(value.decoded))
  } else {
    yield [basePath, value]
  }
}

/**
 * @template {string} S - state
 * @template {string} T - transition
 */
export class StateMachine {
  /**
   * @param {Record<S, Record<T,S>>} stateMap
   * @param {S} initialState
   */
  constructor(stateMap, initialState) {
    this.stateMap = stateMap
    this.status = initialState
  }
  /**
   * @param {T} transitionName
   */
  transition(transitionName) {
    const nextState = this.stateMap[this.status][transitionName]
    if (nextState == null) {
      throw new Error(
        `Invalid transition ${transitionName} from state ${this.status}`,
      )
    }
    this.status = nextState
  }

  /**
   * Check if the current state matches the given state.
   * @param {...S} state
   * @returns
   */
  is(...state) {
    return state.some((s) => s === this.status)
  }
}
