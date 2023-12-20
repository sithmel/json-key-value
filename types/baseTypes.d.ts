export type JSONSegmentPathType = string | number
export type JSONPathType = Array<JSONSegmentPathType>
export type JSONValueType = string | number | boolean | null | [] | {}
export type JSONPathValueType = [JSONPathType, JSONValueType]

export type JSONPathMatchSegmentType = {
  type: "match"
  match: JSONSegmentPathType
}
export type JSONPathMatchSliceType = {
  type: "slice"
  sliceFrom: JSONSegmentPathType
  sliceTo: JSONSegmentPathType
}

export type JSONPathMatchType = Array<
  JSONPathMatchSegmentType | JSONPathMatchSliceType
>
