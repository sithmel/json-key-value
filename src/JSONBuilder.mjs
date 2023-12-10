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
   * Implement JSON reviver feature as for specs of JSON.parse
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
   * Implement JSON reviver feature as for specs of JSON.parse
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
    for (const [pathSegment, isLast] of fromEndToIndex(
      previousPath,
      commonPathIndex,
    )) {
      if (isLast) {
        this.onData(",")
      } else {
        this.onData(pathSegmentTerminator(pathSegment))
      }
    }
    // open the new paths
    for (const [pathSegment, isFirst] of fromIndexToEnd(
      path,
      commonPathIndex,
    )) {
      if (typeof pathSegment === "number") {
        this.onData(`${isFirst ? "" : "["}`)
        if (
          previousPath.length === path.length &&
          commonPathIndex === path.length - 1
        ) {
          const lastIndex = previousPath[commonPathIndex]
          // [a, b, 0] [a, b, 1]
          if (typeof lastIndex === "string") {
            throw new Error(
              `Mixing up array index and object keys is not allowed: before ${lastIndex} then ${pathSegment} in [${path}]`,
            )
          }
          if (lastIndex >= pathSegment) {
            throw new Error(
              `Index are in the wrong order: before ${lastIndex} then ${pathSegment} in [${path}]`,
            )
          }
          this.onData(
            Array(pathSegment - (lastIndex + 1))
              .fill("null")
              .join(","),
          )
        }
      } else {
        this.onData(`${isFirst ? "" : "{"}${valueToString(pathSegment)}:`)
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
    for (const [pathSegment, _isLast] of fromEndToIndex(this.currentPath, 0)) {
      this.onData(pathSegmentTerminator(pathSegment))
    }
  }
}
