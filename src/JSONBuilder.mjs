//@ts-check

import {
  getCommonPathIndex,
  valueToString,
  fromEndToIndex,
  fromIndexToEnd,
  pathSegmentTerminator,
} from "../src/utils.mjs"

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

export default class JSONBuilder {
  /**
   * JSONBuilder
   * @param {(arg0: string) => {}} onData
   */
  constructor(onData) {
    /** @type {import("../types/baseTypes").JSONPathType} */
    this.currentPath = []
    this.onData = onData
    /** @type CONTEXT */
    this.context = CONTEXT.NULL
  }
  /**
   * add a sequence
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
        this.onData("[")
      } else {
        this.onData("{")
      }
    }
    if (previousPath.length >= path.length) {
      if (this.context === CONTEXT.OBJECT) {
        this.onData("}")
      } else if (this.context === CONTEXT.ARRAY) {
        this.onData("]")
      }
    }
    // close all opened path in reverse order
    for (const [index, pathSegment] of fromEndToIndex(
      previousPath,
      commonPathIndex,
    )) {
      if (index === commonPathIndex) {
        this.onData(",")
      } else {
        this.onData(pathSegmentTerminator(pathSegment))
      }
    }
    // open the new paths
    for (const [index, pathSegment] of fromIndexToEnd(path, commonPathIndex)) {
      if (typeof pathSegment === "number") {
        this.onData(`${index === commonPathIndex ? "" : "["}`)

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
        const numberOfNulls = pathSegment - (previousIndex + 1)
        if (numberOfNulls > 0) {
          this.onData(Array(numberOfNulls).fill("null").join(",") + ",")
        }
      } else {
        this.onData(
          `${index === commonPathIndex ? "" : "{"}${valueToString(
            pathSegment,
          )}:`,
        )
      }
    }
    const v = valueToString(value)
    this.context =
      v === "{" ? CONTEXT.OBJECT : v === "[" ? CONTEXT.ARRAY : CONTEXT.NULL
    this.onData(v)
  }

  /**
   * The input stream is completed
   * @returns {void}
   */
  end() {
    if (this.context === CONTEXT.OBJECT) {
      this.onData("}")
    } else if (this.context === CONTEXT.ARRAY) {
      this.onData("]")
    }
    // all opened path in reverse order
    for (const [_index, pathSegment] of fromEndToIndex(this.currentPath, 0)) {
      this.onData(pathSegmentTerminator(pathSegment))
    }
  }
}
