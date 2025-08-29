// @ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
import SequenceToObject from '../SequenceToObject.js'
import { StateMachine } from "./utils.js"
import { areDeeplyEqual } from '../lib/utils.js'

/**
 * @enum {string}
 */
const STATES = {
  SEARCHING: "SEARCHING",
  PATH_FOUND: "PATH_FOUND",
  CHECKING: "CHECKING",
  DONE: "DONE",
}
const TRANSITIONS = {
  NO_MATCH: "NO_MATCH",
  MATCH_PATH: "MATCH_PATH",
  FINISHED: "FINISHED"
}
const STATE_MAP = {
  [STATES.SEARCHING]: {
    [TRANSITIONS.NO_MATCH]: STATES.SEARCHING,
    [TRANSITIONS.MATCH_PATH]: STATES.PATH_FOUND,
  },
  [STATES.PATH_FOUND]: {
    [TRANSITIONS.MATCH_PATH]: STATES.PATH_FOUND,
    [TRANSITIONS.NO_MATCH]: STATES.CHECKING,
  },
  [STATES.CHECKING]: {
    [TRANSITIONS.FINISHED]: STATES.DONE,
  },
  [STATES.DONE]: {},
}

/**
 * test if a value is in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.6
 * Pass-through: yields the original sequence unchanged but asserts that the expected
 * path/value is present. If `value.decoded` is an object/array, expand it via ObjectToSequence
 * and assert that all concatenated sub path/values are present.
 * @template {[Path, Value, number?, number?]} T
 * @param {AsyncIterable<Iterable<T>>} asyncIterable
 * @param {Path} pathToTest
 * @param {Value} valueToTest
 * @returns {AsyncIterable<Iterable<T>>}
 */
export default async function* test(asyncIterable, pathToTest, valueToTest) {
  const sequenceToObject = new SequenceToObject()
  const stateMachine = new StateMachine(STATE_MAP, STATES.SEARCHING)

  /**
   * Scan a batch while yielding it unchanged.
   * @param {Iterable<T>} iterable
   * @returns {Iterable<T>}
   */
  function* scan(iterable) {
    for (const item of iterable) {

      const [currentPath, currentValue] = item
      const newCommonPathIndex = currentPath.getCommonPathIndex(pathToTest)

      if (newCommonPathIndex === pathToTest.length) {
        stateMachine.transition(TRANSITIONS.MATCH_PATH)
      }  else {
        stateMachine.transition(TRANSITIONS.NO_MATCH)
      }
      if (stateMachine.is(STATES.PATH_FOUND)) {
        const objectPath = new Path(currentPath.array, pathToTest.length)
        sequenceToObject.add(objectPath, currentValue)
      }
      if (stateMachine.is(STATES.CHECKING)) {
        if (!areDeeplyEqual(sequenceToObject.getObject(), valueToTest.decoded)) {
          throw new Error(`The path ${pathToTest.decoded} was found but the value does not match. Found: ${JSON.stringify(sequenceToObject.getObject())}, expected: ${JSON.stringify(valueToTest.decoded)}`)
        }
        stateMachine.transition(TRANSITIONS.FINISHED)
      }

      yield item
    }
  }

  for await (const batch of asyncIterable) {
    yield scan(batch)
  }
  if (stateMachine.is(STATES.DONE)) return

  stateMachine.transition(TRANSITIONS.NO_MATCH)

  if (stateMachine.is(STATES.CHECKING)) {
    if (!areDeeplyEqual(sequenceToObject.getObject(), valueToTest.decoded)) {
      throw new Error(`The path ${pathToTest.decoded} was found but the value does not match. Found: ${JSON.stringify(sequenceToObject.getObject())}, expected: ${JSON.stringify(valueToTest.decoded)}`)
    }
    return
  }
  throw new Error(`The path ${pathToTest.decoded} was not found. Test not successful`)
}
