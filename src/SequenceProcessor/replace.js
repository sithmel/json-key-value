// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
import { StateMachine, getSequenceFromValue } from "./utils.js"


/**
 * @enum {string}
 */
const STATES = {
  SEARCHING: "SEARCHING",
  PATH_FOUND: "PATH_FOUND",
  REPLACED: "REPLACED",
  DONE: "DONE",
}
const TRANSITIONS = {
  NO_MATCH: "NO_MATCH",
  MATCH_PATH: "MATCH_PATH",
  FINISHED: "FINISHED",
  REPLACE: "REPLACE",
}
const STATE_MAP = {
  [STATES.SEARCHING]: {
    [TRANSITIONS.NO_MATCH]: STATES.SEARCHING,
    [TRANSITIONS.MATCH_PATH]: STATES.PATH_FOUND,
  },
  [STATES.PATH_FOUND]: {
    [TRANSITIONS.REPLACE]: STATES.REPLACED,
  },
  [STATES.REPLACED]: {
    [TRANSITIONS.NO_MATCH]: STATES.DONE,
    [TRANSITIONS.MATCH_PATH]: STATES.REPLACED,
  },
  [STATES.DONE]: {},
}


/**
 * replace a value in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.3
 * Implemented by removing the target path (and subtree) and adding the new value
 * at the correct position to preserve traversal order.
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @param {Path} pathToReplace
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
 */
export default async function* replace(asyncIterable, pathToReplace, value) {
  const stateMachine = new StateMachine(STATE_MAP, STATES.SEARCHING)
  // const pathToRemoveLastSegment = pathToReplace.array[pathToReplace.length - 1]

  /**
   * @param {Iterable<[Path, Value, number?, number?]>} iterable
   * @returns {Iterable<[Path, Value, number?, number?]>}
   */
  function* inner(iterable) {
    for (const item of iterable) {
      if (stateMachine.is(STATES.DONE)) {
        yield item
        continue
      }
      const [currentPath] = item
      const newCommonPathIndex = currentPath.getCommonPathIndex(pathToReplace)

      if (newCommonPathIndex === pathToReplace.length) {
        stateMachine.transition(TRANSITIONS.MATCH_PATH)
      } else {
        stateMachine.transition(TRANSITIONS.NO_MATCH)
      }

      if (stateMachine.is(STATES.SEARCHING, STATES.DONE)) {
        // remove all a others (already replaced)
        yield item
      }      

      if (stateMachine.is(STATES.PATH_FOUND)) {
        yield* getSequenceFromValue(pathToReplace, value)
        // add new and removing the first one
        stateMachine.transition(TRANSITIONS.REPLACE)
        continue
      }

      if (stateMachine.is(STATES.REPLACED)) {
        // remove all a others (already replaced)
        continue
      }      

    }
  }

  for await (const iterable of asyncIterable) {
    if (stateMachine.is(STATES.DONE)) {
      yield iterable
      continue
    }
    yield inner(iterable)
  }

  if (!stateMachine.is(STATES.DONE)) {
    throw new Error(`The path ${pathToReplace.decoded} was not found. Replacement not possible`)
  }
}
