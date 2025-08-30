// @ts-check
import { Path } from "../lib/path.js"
import { Value, emptyObjValue, emptyArrayValue } from "../lib/value.js"
import { getSequenceFromValue, StateMachine } from "./utils.js"

/**
 * @enum {string}
 */
const STATES = {
  SEARCHING: "SEARCHING",
  CONTAINER_FOUND: "CONTAINER_FOUND",
  PATH_FOUND: "PATH_FOUND",
  TO_APPEND: "TO_APPEND",
  INSERTED: "INSERTED",
  DONE: "DONE",
}
const TRANSITIONS = {
  MATCH_CONTAINER: "MATCH_CONTAINER",
  NO_MATCH: "NO_MATCH",
  FINISHED: "FINISHED",
  INSERT: "INSERT",
  MATCH_PATH: "MATCH_PATH",
}

const STATE_MAP = {
  [STATES.SEARCHING]: {
    [TRANSITIONS.MATCH_CONTAINER]: STATES.CONTAINER_FOUND,
    [TRANSITIONS.NO_MATCH]: STATES.SEARCHING,
    [TRANSITIONS.MATCH_PATH]: STATES.PATH_FOUND,
  },
  [STATES.CONTAINER_FOUND]: {
    [TRANSITIONS.NO_MATCH]: STATES.TO_APPEND,
    [TRANSITIONS.MATCH_CONTAINER]: STATES.CONTAINER_FOUND,
    [TRANSITIONS.MATCH_PATH]: STATES.PATH_FOUND,
    [TRANSITIONS.INSERT]: STATES.INSERTED,
    [TRANSITIONS.FINISHED]: STATES.DONE,
  },
  [STATES.PATH_FOUND]: {
    [TRANSITIONS.INSERT]: STATES.INSERTED,
  },
  [STATES.TO_APPEND]: {
    [TRANSITIONS.FINISHED]: STATES.DONE,
  },
  [STATES.INSERTED]: {
    [TRANSITIONS.NO_MATCH]: STATES.DONE,
    [TRANSITIONS.MATCH_CONTAINER]: STATES.INSERTED,
  },
  [STATES.DONE]: {},
}

/**
 * add a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.1
 * Inserts the provided [path, value] into the sequence according to the JSON order.
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @param {Path} pathToAdd
 * @param {Value} value
 * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
 */
export default async function* add(asyncIterable, pathToAdd, value) {
  const stateMachine = new StateMachine(STATE_MAP, STATES.SEARCHING)
  const pathToAddLastSegment = pathToAdd.get(pathToAdd.length - 1)

  /**
   * Filters a single iterable based on the matcher.
   * @param {Iterable<[Path, Value, number?, number?]>} iterable
   * @returns {Iterable<[Path, Value, number?, number?]>}
   */
  function* iter(iterable) {
    for (const item of iterable) {
      if (stateMachine.is(STATES.DONE)) {
        yield item
        continue
      }
      const [currentPath, currentValue] = item
      const newCommonPathIndex = currentPath.getCommonPathIndex(pathToAdd)
      if (newCommonPathIndex === pathToAdd.length) {
        stateMachine.transition(TRANSITIONS.MATCH_PATH)
      } else if (newCommonPathIndex === pathToAdd.length - 1) {
        stateMachine.transition(TRANSITIONS.MATCH_CONTAINER)
      } else {
        stateMachine.transition(TRANSITIONS.NO_MATCH)
      }

      if (stateMachine.is(STATES.SEARCHING)) {
        // case 1: not inside object, yield item and continue
        yield item
        continue
      }
      if (stateMachine.is(STATES.PATH_FOUND)) {
        if (typeof pathToAddLastSegment === "number") {
          // case 2: insertion if key is a number
          yield* getSequenceFromValue(pathToAdd, value)
          currentPath.array[pathToAdd.length - 1] = pathToAddLastSegment + 1
          yield item
          stateMachine.transition(TRANSITIONS.INSERT)
        } else {
          // case 2: replacement if key is a string
          yield* getSequenceFromValue(pathToAdd, value)
          stateMachine.transition(TRANSITIONS.INSERT)
        }
        continue
      }

      if (stateMachine.is(STATES.INSERTED)) {
        // case 3: shift array items, removes matching
        if (typeof pathToAddLastSegment !== "number") {
          if (newCommonPathIndex === pathToAdd.length) {
            // removes matching
          } else {
            yield item
          }
        } else {
          const currentPathFirstDifferentSegment =
            currentPath.array[pathToAdd.length - 1]
          if (typeof currentPathFirstDifferentSegment === "number") {
            currentPath.array[pathToAdd.length - 1] =
              currentPathFirstDifferentSegment + 1
          } else {
            throw new Error("This should not be happening")
          }
          yield item
        }
        continue
      }

      if (stateMachine.is(STATES.CONTAINER_FOUND)) {
        if (currentPath.length === pathToAdd.length - 1) {
          // case 4: add to empty object/array
          // Example currentPath is [A, B] and pathToAdd is [A, B, C]
          // if I have such a path, it means that this is an empty object/array
          // I will skip the item and insert the new value instead
          // then I can consider the operation done

          // check if the item is an empty object/array
          // otherwise throw an error
          if (typeof pathToAddLastSegment === "number") {
            if (!currentValue.isEqual(emptyArrayValue)) {
              throw new Error(
                `Path segment mismatch: expected empty array at segment in path ${currentPath}, at index ${pathToAdd.length - 1}`,
              )
            }
          } else {
            if (!currentValue.isEqual(emptyObjValue)) {
              throw new Error(
                `Path segment mismatch: expected empty object at segment in path ${currentPath}, at index ${pathToAdd.length - 1}`,
              )
            }
          }
          // proceed to replace
          yield* getSequenceFromValue(pathToAdd, value)
          stateMachine.transition(TRANSITIONS.FINISHED)
        } else if (typeof pathToAddLastSegment === "number") {
          // case 5: array insertion
          // this handles the insertions, which can only happen in an array
          const currentPathFirstDifferentSegment =
            currentPath.array[newCommonPathIndex]
          if (typeof currentPathFirstDifferentSegment === "number") {
            if (pathToAddLastSegment <= currentPathFirstDifferentSegment) {
              // insert before
              yield* getSequenceFromValue(pathToAdd, value)
              // shift current item
              currentPath.array[pathToAdd.length - 1] =
                currentPathFirstDifferentSegment + 1
              yield item
              stateMachine.transition(TRANSITIONS.INSERT)
            } else {
              yield item
            }
          } else {
            throw new Error(
              `Path segment mismatch: expected array index at segment in path ${currentPath}, at index ${newCommonPathIndex}`,
            )
          }
        } else {
          // if the key is a string, I just go ahead. I will append the
          // new item when I get out of the container
          yield item
        }
        continue
      }

      if (stateMachine.is(STATES.TO_APPEND)) {
        //case 3: append to object/array
        yield* getSequenceFromValue(pathToAdd, value)
        stateMachine.transition(TRANSITIONS.FINISHED)
        yield item
        continue
      }
    }
  }

  for await (const iterable of asyncIterable) {
    if (stateMachine.is(STATES.DONE)) {
      yield iterable
      continue
    }
    yield iter(iterable)
  }
  if (stateMachine.is(STATES.DONE)) return

  stateMachine.transition(TRANSITIONS.NO_MATCH)
  if (stateMachine.is(STATES.TO_APPEND)) {
    yield getSequenceFromValue(pathToAdd, value)
    stateMachine.transition(TRANSITIONS.FINISHED)
  }
  if (!stateMachine.is(STATES.DONE)) {
    throw new Error("Add operation failed: did not find container")
  }
}
