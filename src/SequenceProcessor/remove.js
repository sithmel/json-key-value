// @ts-check
import { Path } from "../lib/path.js"
import { Value, emptyArrayValue, emptyObjValue } from "../lib/value.js"
import { StateMachine } from "./utils.js"
/**
 * @enum {string}
 */
const STATES = {
  SEARCHING: "SEARCHING",
  CONTAINER_FOUND: "CONTAINER_FOUND",
  PATH_FOUND_INSIDE_CONTAINER: "PATH_FOUND_INSIDE_CONTAINER",
  PATH_FOUND_OUTSIDE_CONTAINER: "PATH_FOUND_OUTSIDE_CONTAINER",
  COMPACT_ARRAY: "COMPACT_ARRAY",
  ADD_EMPTY_CONTAINER: "ADD_EMPTY_CONTAINER",
  DONE: "DONE",
  NOT_FOUND: "NOT_FOUND",
}
const TRANSITIONS = {
  MATCH_CONTAINER: "MATCH_CONTAINER",
  NO_MATCH: "NO_MATCH",
  MATCH_PATH: "MATCH_PATH",
  FINISHED: "FINISHED",
}
const STATE_MAP = {
  // searching for container or path to remove
  [STATES.SEARCHING]: {
    [TRANSITIONS.MATCH_CONTAINER]: STATES.CONTAINER_FOUND,
    [TRANSITIONS.NO_MATCH]: STATES.SEARCHING,
    [TRANSITIONS.MATCH_PATH]: STATES.PATH_FOUND_OUTSIDE_CONTAINER,
  },
  // I have found the container but it does not match yet
  [STATES.CONTAINER_FOUND]: {
    [TRANSITIONS.MATCH_CONTAINER]: STATES.CONTAINER_FOUND,
    [TRANSITIONS.MATCH_PATH]: STATES.PATH_FOUND_INSIDE_CONTAINER,
    [TRANSITIONS.NO_MATCH]: STATES.NOT_FOUND,
  },
  // path found. I have been in the container so I know this path has siblings
  // I can go directly to DONE because I don't need to add an empty container
  [STATES.PATH_FOUND_INSIDE_CONTAINER]: {
    [TRANSITIONS.MATCH_CONTAINER]: STATES.COMPACT_ARRAY,
    [TRANSITIONS.NO_MATCH]: STATES.DONE,
    [TRANSITIONS.MATCH_PATH]: STATES.PATH_FOUND_INSIDE_CONTAINER,
  },
  // path found I have not been in the container
  // up until now I have not found siblings,
  // unless I match the container
  [STATES.PATH_FOUND_OUTSIDE_CONTAINER]: {
    [TRANSITIONS.MATCH_CONTAINER]: STATES.COMPACT_ARRAY,
    [TRANSITIONS.NO_MATCH]: STATES.ADD_EMPTY_CONTAINER,
    [TRANSITIONS.MATCH_PATH]: STATES.PATH_FOUND_OUTSIDE_CONTAINER,
  },
  // compacting array
  [STATES.COMPACT_ARRAY]: {
    [TRANSITIONS.MATCH_CONTAINER]: STATES.COMPACT_ARRAY,
    [TRANSITIONS.NO_MATCH]: STATES.DONE,
  },
  // adding empty obj/array
  [STATES.ADD_EMPTY_CONTAINER]: {
    [TRANSITIONS.FINISHED]: STATES.DONE,
  },
  [STATES.DONE]: {},
}

/**
 * remove a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.2
 * @param {AsyncIterable<Iterable<[Path, Value, number?, number?]>>} asyncIterable
 * @param {Path} pathToRemove
 * @returns {AsyncIterable<Iterable<[Path, Value, number?, number?]>>}
 */
export default async function* remove(asyncIterable, pathToRemove) {
  const stateMachine = new StateMachine(STATE_MAP, STATES.SEARCHING)
  const pathToRemoveLastSegment = pathToRemove.array[pathToRemove.length - 1]

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
      const [currentPath, value] = item
      const newCommonPathIndex = currentPath.getCommonPathIndex(pathToRemove)

      if (newCommonPathIndex === pathToRemove.length) {
        stateMachine.transition(TRANSITIONS.MATCH_PATH)
      } else if (newCommonPathIndex === pathToRemove.length - 1) {
        stateMachine.transition(TRANSITIONS.MATCH_CONTAINER)
      } else {
        stateMachine.transition(TRANSITIONS.NO_MATCH)
      }

      if (stateMachine.is(STATES.NOT_FOUND)) {
        throw new Error(
          `The path ${pathToRemove.decoded} was not found. Removal not possible`,
        )
      } else if (
        stateMachine.is(
          STATES.PATH_FOUND_INSIDE_CONTAINER,
          STATES.PATH_FOUND_OUTSIDE_CONTAINER,
        )
      ) {
        // removing
        continue
      } else if (stateMachine.is(STATES.COMPACT_ARRAY)) {
        // I am unable to match but I am still inside the container
        // if this is an array I need to fix the indexes
        const currentPathFirstDifferentSegment =
          currentPath.array[newCommonPathIndex]

        if (typeof currentPathFirstDifferentSegment === "number") {
          const newPathArray = [...currentPath.array]
          newPathArray[newCommonPathIndex] =
            currentPathFirstDifferentSegment - 1
          yield [new Path(newPathArray), value]
          continue
        }
        // I don't need to compact items if they are not array items
      } else if (stateMachine.is(STATES.ADD_EMPTY_CONTAINER)) {
        // if I am here, I am no longer matching path to remove and I have not seen any siblings of that path
        // I will insert an empty object/array
        const emptyValue =
          typeof pathToRemoveLastSegment === "number"
            ? emptyArrayValue
            : emptyObjValue
        const pathToRemoveContainer = new Path(pathToRemove.array.slice(0, -1))
        yield [pathToRemoveContainer, emptyValue]

        stateMachine.transition(TRANSITIONS.FINISHED)
      }
      yield item
    }
  }

  for await (const iterable of asyncIterable) {
    if (stateMachine.is(STATES.DONE)) {
      yield iterable
      continue
    }
    yield inner(iterable)
  }

  if (stateMachine.is(STATES.DONE)) return

  stateMachine.transition(TRANSITIONS.NO_MATCH)

  if (stateMachine.is(STATES.ADD_EMPTY_CONTAINER)) {
    // case 4: handle empty object/array at end of sequence
    // when this is the last item in the sequence
    const emptyValue =
      typeof pathToRemoveLastSegment === "number"
        ? emptyArrayValue
        : emptyObjValue

    const pathToRemoveContainer = new Path(pathToRemove.array.slice(0, -1))
    yield [[pathToRemoveContainer, emptyValue]]

    stateMachine.transition(TRANSITIONS.FINISHED)
  }

  if (!stateMachine.is(STATES.DONE)) {
    throw new Error(
      `The path ${pathToRemove.decoded} was not found. Removal not possible`,
    )
  }
}
