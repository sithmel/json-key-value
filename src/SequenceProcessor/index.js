//@ts-check
import { Path } from "../lib/path.js"
import { Value } from "../lib/value.js"
import { GenericBatchIterable, BatchIterable } from "batch-iterable"
import includes from "./includes.js"
import SequenceToObject from "../SequenceToObject.js"
import { toIterableBuffer } from "./toIterableBuffer.js"
import add from "./add.js"
import remove from "./remove.js"
import replace from "./replace.js"
import test from "./test.js"
import { MatcherContainer } from "../lib/pathMatcher.js"

/**
 * @extends {GenericBatchIterable<[Path, Value, number?, number?]>}
 */
export class SequenceProcessor extends GenericBatchIterable {
  /**
   * It filters the sequence based on the given expression
   * @param {string|MatcherContainer} [expression]
   * @returns {this}
   */
  includes(expression) {
    if (expression != null) {
      this.iterable = includes(this.iterable, expression)
    }
    return this
  }

  /**
   * add a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.1
   * @param {Path} path
   * @param {Value} value
   * @returns {this}
   */
  add(path, value) {
    this.iterable = add(this.iterable, path, value)
    return this
  }

  /**
   * remove a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.2
   * @param {Path} path
   * @returns {this}
   */
  remove(path) {
    this.iterable = remove(this.iterable, path)
    return this
  }

  /**
   * replace a value in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.3
   * @param {Path} path
   * @param {Value} value
   * @returns {this}
   */
  replace(path, value) {
    this.iterable = replace(this.iterable, path, value)
    return this
  }

  /**
   * test if a value is in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.6
   * @param {Path} path
   * @param {Value} value
   * @returns {this}
   */
  test(path, value) {
    this.iterable = test(this.iterable, path, value)
    return this
  }

  /**
   * Build an object back from the sequence
   * @param {any} [obj] - Options for the sequence to object conversion
   * @returns {Promise<any>}
   */
  async toObject(obj = undefined) {
    const builder = await this.reduce((builder, [path, value]) => {
      builder.add(path, value)
      return builder
    }, new SequenceToObject(obj))

    return builder.getObject()
  }

  /**
   * Build an stream back from the sequence
   * @returns {BatchIterable}
   */
  toIterableBuffer() {
    return new BatchIterable(toIterableBuffer(this.iterable))
  }
}
