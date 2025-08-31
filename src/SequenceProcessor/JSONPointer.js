//@ts-check

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
export function transformPointerToJSONPath(pointer) {
  let unescape = false
  // Handle fragment identifier (starts with #)
  if (pointer.startsWith("#")) {
    unescape = true
    pointer = pointer.substring(1)
  }

  // Handle empty string - root reference
  if (pointer === "") return []

  // Must start with / for non-empty pointers
  if (!pointer.startsWith("/")) {
    throw new Error("Invalid JSON Pointer: must start with /")
  }

  // Split by / and remove the first empty element (before the leading /)
  const tokens = pointer.split("/").slice(1)

  return tokens.map((token) => {
    token = unescape ? decodeURIComponent(token) : token
    // Decode escape sequences according to RFC 6901
    // ~1 becomes / and ~0 becomes ~
    let decoded = token.replace(/~1/g, "/").replace(/~0/g, "~")

    // Try to convert to number if it looks like an array index
    if (/^\d+$/.test(decoded)) {
      return parseInt(decoded, 10)
    }

    return decoded
  })
}
