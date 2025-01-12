/**
 * @private
 */
export class CachedStringBuffer {
  /** @param {Uint8Array} data */
  constructor(data: Uint8Array)
  data: Uint8Array<ArrayBufferLike>
  /** @type {?string} */
  cache: string | null
  /** @return {import("../baseTypes").JSONSegmentPathType} */
  toDecoded(): import("../baseTypes").JSONSegmentPathType
  /** @return {Uint8Array} */
  get(): Uint8Array
}
/**
 * @private
 */
export class Path {
  /**
   * @param {Array<CachedStringBuffer|number|string>} [array]
   * @param {number} [offset]
   */
  constructor(
    array?: Array<CachedStringBuffer | number | string>,
    offset?: number,
  )
  array: (string | number | CachedStringBuffer)[]
  offset: number
  /** @return {number}*/
  get length(): number
  /** @param {CachedStringBuffer|number|string} segment*/
  push(segment: CachedStringBuffer | number | string): void
  /** @return {?CachedStringBuffer|number|string}*/
  pop(): (CachedStringBuffer | number | string) | null
  /**
   * @param {number} index
   * @return {?CachedStringBuffer|number|string}
   */
  get(index: number): (CachedStringBuffer | number | string) | null
  /**
   * @param {(arg0: CachedStringBuffer|number|string) => any} func
   * @return {Array<any>}
   */
  map(func: (arg0: CachedStringBuffer | number | string) => any): Array<any>
  /**
   * @return {Path}
   * */
  rest(): Path
  /** @return {import("../baseTypes").JSONPathType} */
  toDecoded(): import("../baseTypes").JSONPathType
}
//# sourceMappingURL=path.d.ts.map
