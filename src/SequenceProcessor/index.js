//@ts-check
import { Path, toPathObject } from "../lib/path.js"
import { Value, toValueObject } from "../lib/value.js"
import { GenericBatchIterable, BatchIterable } from "batch-iterable"
import includes from "./includes.js"
import SequenceToObject from "../SequenceToObject.js"
import { toIterableBuffer } from "./toIterableBuffer.js"
import add from "./add.js"
import remove from "./remove.js"
import replace from "./replace.js"
import test from "./test.js"
import { MatcherContainer } from "../lib/pathMatcher.js"
import { transformPointerToJSONPath } from "./JSONPointer.js"

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
   * @param {import("../lib/path.js").JSONPathType} path
   * @param {any} value
   * @returns {this}
   */
  add(path, value) {
    this.iterable = add(this.iterable, toPathObject(path), toValueObject(value))
    return this
  }

  /**
   * remove a value to the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.2
   * @param {import("../lib/path.js").JSONPathType} path
   * @returns {this}
   */
  remove(path) {
    this.iterable = remove(this.iterable, toPathObject(path))
    return this
  }

  /**
   * replace a value in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.3
   * @param {import("../lib/path.js").JSONPathType} path
   * @param {any} value
   * @returns {this}
   */
  replace(path, value) {
    this.iterable = replace(
      this.iterable,
      toPathObject(path),
      toValueObject(value),
    )
    return this
  }

  /**
   * test if a value is in the sequence https://datatracker.ietf.org/doc/html/rfc6902#section-4.6
   * @param {import("../lib/path.js").JSONPathType} path
   * @param {any} value
   * @returns {this}
   */
  test(path, value) {
    this.iterable = test(
      this.iterable,
      toPathObject(path),
      toValueObject(value),
    )
    return this
  }

  /**
   * Apply JSON Patch operations to the sequence https://datatracker.ietf.org/doc/html/rfc6902
   * @param {Array<import("./JSONPointer.js").Operation>} patchArray
   * @returns {this}
   */
  patch(patchArray) {
    for (const operation of patchArray) {
      switch (operation.op) {
        case "add":
          this.add(transformPointerToJSONPath(operation.path), operation.value)
          break
        case "remove":
          this.remove(transformPointerToJSONPath(operation.path))
          break
        case "replace":
          this.replace(
            transformPointerToJSONPath(operation.path),
            operation.value,
          )
          break
        case "test":
          this.test(transformPointerToJSONPath(operation.path), operation.value)
          break
        case "_get":
        case "copy":
        case "move":
          throw new Error(`${operation.op} operation is not supported`)
      }
    }
    return this
  }

  /**
   * Build an object back from the sequence
   * @param {any} [obj] - Options for the sequence to object conversion
   * @param {boolean} [sparse=false] - if true, creates sparse arrays respecting original indexes
   * @returns {Promise<any>}
   */
  async toObject(obj = undefined, sparse = false) {
    const builder = await this.reduce(
      (builder, [path, value]) => {
        builder.add(path, value)
        return builder
      },
      new SequenceToObject(obj, sparse),
    )

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
