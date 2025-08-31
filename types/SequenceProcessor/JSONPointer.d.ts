/** @typedef {{op: "_get", path: string}} GetOperation */
/** @typedef {{op: "add", path: string, value: any}} AddOperation */
/** @typedef {{op: "remove", path: string}} RemoveOperation */
/** @typedef {{op: "replace", path: string, value: any}} ReplaceOperation */
/** @typedef {{op: "test", path: string, value: any}} TestOperation */
/** @typedef {{op: "copy", path: string, from: string}} CopyOperation */
/** @typedef {{op: "move", path: string, from: string}} MoveOperation */
/** @typedef {GetOperation | AddOperation | RemoveOperation | ReplaceOperation | TestOperation | CopyOperation | MoveOperation} Operation */
/** @typedef {Operation[]} Operations */
/**
 * Transform a JSONPointer into an array
 * @param {string} pointer
 * @returns {import("../lib/path.js").JSONPathType}
 */
export function transformPointerToJSONPath(
  pointer: string,
): import("../lib/path.js").JSONPathType
export type GetOperation = {
  op: "_get"
  path: string
}
export type AddOperation = {
  op: "add"
  path: string
  value: any
}
export type RemoveOperation = {
  op: "remove"
  path: string
}
export type ReplaceOperation = {
  op: "replace"
  path: string
  value: any
}
export type TestOperation = {
  op: "test"
  path: string
  value: any
}
export type CopyOperation = {
  op: "copy"
  path: string
  from: string
}
export type MoveOperation = {
  op: "move"
  path: string
  from: string
}
export type Operation =
  | GetOperation
  | AddOperation
  | RemoveOperation
  | ReplaceOperation
  | TestOperation
  | CopyOperation
  | MoveOperation
export type Operations = Operation[]
//# sourceMappingURL=JSONPointer.d.ts.map
