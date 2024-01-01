//@ts-check

import {
  getCommonPathIndex,
  valueToString,
  fromEndToIndex,
  fromIndexToEnd,
  pathSegmentTerminator,
  isPreviousPathInNewPath,
} from "./utils.mjs"

/**
 * Enum for CONTEXT
 * @readonly
 * @enum {string}
 */
const CONTEXT = {
  OBJECT: "OBJECT",
  ARRAY: "ARRAY",
  NULL: "NULL",
}

export default class SequenceToStream {
  /**
   * Convert a sequence of path value pairs to a stream of characters
   * @param {{onData: (arg0: string) => Promise<void>, compactArrays?: boolean}} onData
   */
  constructor({ onData, compactArrays = false }) {
    /** @type {import("../types/baseTypes").JSONPathType} */
    this.currentPath = []
    this.onData = onData
    /** @type CONTEXT */
    this.context = CONTEXT.NULL
    this.lastWritePromise = Promise.resolve()
    this.compactArrays = compactArrays
  }

  /**
   * @package
   * @param {string} str
   */
  async _output(str) {
    await this.lastWritePromise
    this.lastWritePromise = this.onData(str)
  }
  /**
   * add a new path value pair
   * @param {import("../types/baseTypes").JSONPathType} path
   * @param {import("../types/baseTypes").JSONValueType} value
   * @returns {void}
   */
  add(path, value) {
    const previousPath = this.currentPath
    this.currentPath = path

    // traverse previousPath and path
    // I get an index for the part in common
    // This way I know the common path and
    // a residual of the oldPath and newPath
    const commonPathIndex = getCommonPathIndex(previousPath, path)

    if (
      this.context === CONTEXT.NULL &&
      previousPath.length === 0 &&
      path.length > 0
    ) {
      if (typeof path[0] === "number") {
        this._output("[")
      } else {
        this._output("{")
      }
    }
    if (!isPreviousPathInNewPath(previousPath, path)) {
      if (this.context === CONTEXT.OBJECT) {
        this._output("}")
      } else if (this.context === CONTEXT.ARRAY) {
        this._output("]")
      }
    }
    // close all opened path in reverse order
    for (const [index, pathSegment] of fromEndToIndex(
      previousPath,
      commonPathIndex,
    )) {
      if (index === commonPathIndex) {
        this._output(",")
      } else {
        this._output(pathSegmentTerminator(pathSegment))
      }
    }
    // open the new paths
    for (const [index, pathSegment] of fromIndexToEnd(path, commonPathIndex)) {
      if (typeof pathSegment === "number") {
        this._output(`${index === commonPathIndex ? "" : "["}`)

        const previousIndex =
          index === commonPathIndex ? previousPath[commonPathIndex] ?? -1 : -1
        if (typeof previousIndex === "string") {
          throw new Error(
            `Mixing up array index and object keys is not allowed: before ${previousIndex} then ${pathSegment} in [${path}]`,
          )
        }
        if (previousIndex >= pathSegment) {
          throw new Error(
            `Index are in the wrong order: before ${previousIndex} then ${pathSegment} in [${path}]`,
          )
        }
        if (!this.compactArrays) {
          const numberOfNulls = pathSegment - (previousIndex + 1)
          if (numberOfNulls > 0) {
            this._output(Array(numberOfNulls).fill("null").join(",") + ",")
          }
        }
      } else {
        this._output(
          `${index === commonPathIndex ? "" : "{"}${valueToString(
            pathSegment,
          )}:`,
        )
      }
    }
    const v = valueToString(value)
    this.context =
      v === "{" ? CONTEXT.OBJECT : v === "[" ? CONTEXT.ARRAY : CONTEXT.NULL
    this._output(v)
  }

  /**
   * The input stream is completed
   * @returns {Promise<void>}
   */
  async end() {
    if (this.context === CONTEXT.OBJECT) {
      this._output("}")
    } else if (this.context === CONTEXT.ARRAY) {
      this._output("]")
    }
    // all opened path in reverse order
    for (const [_index, pathSegment] of fromEndToIndex(this.currentPath, 0)) {
      this._output(pathSegmentTerminator(pathSegment))
    }
    await this.lastWritePromise
  }
}
