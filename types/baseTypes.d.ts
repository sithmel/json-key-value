export type JSONSegmentPathType = string | number
export type JSONPathType = Array<JSONSegmentPathType>

export type JSONSegmentPathBufferType = Uint8Array | number
export type JSONPathBufferType = Array<JSONSegmentPathBufferType>

export type JSONSegmentPathOrJSONSegmentPathBufferType =
  | JSONSegmentPathType
  | JSONSegmentPathBufferType
export type JSONPathOrJSONPathBufferType = JSONPathType | JSONPathBufferType

export type JSONValueType = string | number | boolean | null | [] | {}
export type JSONPathValueType = [JSONPathType, JSONValueType]
