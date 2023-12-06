//@ts-check

import { reversed } from "../src/utils.mjs"

export default class JSONBuilder {
  /**
   * Implement JSON reviver feature as for specs of JSON.parse
   * @param {(arg0: string) => {}} onData
   */
  constructor(onData) {
    /** @type {import("../types/baseTypes").JSONPathType} */
    this.currentPath = []
    this.onData = onData
  }
  /**
   * Implement JSON reviver feature as for specs of JSON.parse
   * @param {import("../types/baseTypes").JSONPathType} path
   * @param {import("../types/baseTypes").JSONValueType} value
   * @returns {void}
   */
  add(path, value) {
    // Step 1:
    // traverse oldPath (this.currentPath) and newPath (path)
    // Nothing to do for the part in common
    // I should have a residual of the oldPath and newPath
    // Step 2:
    // if oldPath and newPath differ of only 1 pathSegment then:
    // if these 2 paths are strings -> ", ${path}=value"
    // if these 2 paths are numbers -> ", value"
    // (in this case I have to calculate the difference and add some undefined value)
    // Step3:
    // if oldPath and newPath differ of more than 1 pathSegment then:
    // I closed all objects and arrays using oldPath residual
    // I open all objects and arrays using newPath residual
  }

  /**
   * The input stream is completed
   * @returns {void}
   */
  end() {
    for (const pathSegment of reversed(this.currentPath)) {
      this.onData(typeof pathSegment === "string" ? "}" : "]")
    }
  }
}
