//@ts-check

/**
 * Implement JSON reviver feature as for specs of JSON.parse
 * @param {string} obj
 * @param {(arg0: import("../types/baseTypes").JSONSegmentPathType, arg1: import("../types/baseTypes").JSONValueType) => {}} reviver
 * @returns {Object}
 */
export default function JSONReviver(obj, reviver) {
  /**
   * recursively walk the resulting structure
   * @param {Array<any>|Object} holder
   * @param {string|number} key
   * @returns {Object}
   */
  function walk(holder, key) {
    // @ts-ignore
    const value = holder[key]
    // this is false for null and true for obj and arrays
    if (value && typeof value === "object") {
      for (let k in value) {
        if (Object.prototype.hasOwnProperty.call(value, k)) {
          let v = walk(value, k)
          if (v !== undefined) {
            value[k] = v
          } else {
            delete value[k]
          }
        }
      }
    }
    return reviver.call(holder, key, value)
  }

  return typeof reviver === "function" ? walk({ "": obj }, "") : obj
}
