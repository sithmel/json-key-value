/**
 *
 * @param {any} value
 * @returns {Value}
 */
export function toValueObject(value: any): Value
export class Value {
  /** @return {any} */
  get decoded(): any
  /** @return {Uint8Array} */
  get encoded(): Uint8Array
  /**
   * @param {Value} _value
   * @return {boolean} */
  isEqual(_value: Value): boolean
}
export class True extends Value {}
export class False extends Value {}
export class Null extends Value {}
/**
 * @template T
 */
export class CachedValue<T> extends Value {
  /** @param {Uint8Array} data */
  constructor(data: Uint8Array)
  data: Uint8Array<ArrayBufferLike>
  /** @type {?T} */
  cache: T | null
  /** @return {T} */
  get decoded(): T
}
/**
 * @extends {CachedValue<string>}
 */
export class CachedString extends CachedValue<string> {
  /** @param {Uint8Array} data */
  constructor(data: Uint8Array)
}
/**
 * @extends {CachedValue<number>}
 */
export class CachedNumber extends CachedValue<number> {
  /** @param {Uint8Array} data */
  constructor(data: Uint8Array)
}
/**
 * @extends {CachedValue<any>}
 */
export class CachedSubObject extends CachedValue<any> {
  /** @param {Uint8Array} data */
  constructor(data: Uint8Array)
}
export const falseValue: False
export const trueValue: True
export const nullValue: Null
export const emptyObjValue: CachedSubObject
export const emptyArrayValue: CachedSubObject
//# sourceMappingURL=value.d.ts.map
