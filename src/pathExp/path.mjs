//@ts-check
/**
 * @typedef {import("../../types/baseTypes").JSONSegmentPathType} JSONSegmentPathType
 * @typedef {import("../../types/baseTypes").JSONPathType} JSONPathType
 */

import { decodeAndParse } from "../utils.mjs"

/**
 * @private
 */
export class CachedStringBuffer {
  /** @param {Uint8Array} data */
  constructor(data) {
    this.data = data
    /** @type {?string} */
    this.cache = null
  }
  /** @return {JSONSegmentPathType} */
  toDecoded() {
    if (this.cache != null) {
      return this.cache
    }
    const cache = decodeAndParse(this.data)
    this.cache = cache
    return cache
  }
  /** @return {Uint8Array} */
  get() {
    return this.data
  }
}

/**
 * @private
 */
export class Path {
  /**
   * @param {Array<CachedStringBuffer|number|string>} [array]
   * @param {number} [offset]
   */
  constructor(array = [], offset = 0) {
    this.array = array
    this.offset = offset
  }

  /** @return {number}*/
  get length() {
    return this.array.length - this.offset
  }

  /** @param {CachedStringBuffer|number|string} segment*/
  push(segment) {
    this.array.push(segment)
  }

  /** @return {?CachedStringBuffer|number|string}*/
  pop() {
    return this.array.pop() ?? null
  }

  /**
   * @param {number} index
   * @return {?CachedStringBuffer|number|string}
   */
  get(index) {
    return this.array[index + this.offset]
  }

  /**
   * @param {(arg0: CachedStringBuffer|number|string) => any} func
   * @return {Array<any>}
   */
  map(func) {
    const length = this.length
    const output = new Array(length) // Preallocate array size
    for (let i = 0; i < length; i++) {
      const segment = this.get(i)
      if (segment == null) {
        throw new Error("Can't be null or undefined")
      }
      output[i] = func(segment)
    }
    return output
  }

  /**
   * @return {Path}
   * */
  rest() {
    return new Path(this.array, this.offset + 1)
  }

  /** @return {JSONPathType} */
  toDecoded() {
    return this.map((segment) => {
      return segment instanceof CachedStringBuffer
        ? segment.toDecoded()
        : segment
    })
  }
}
