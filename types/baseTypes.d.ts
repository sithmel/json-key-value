export type JSONSegmentPathType = string | number
export type JSONPathType = Array<JSONSegmentPathType>
export type JSONValueType = string | number | boolean | null | [] | {}
export type JSONPathValueType = [JSONPathType, JSONValueType]

export type MatchKeyOrIndexType = {
  type: "match"
  match: JSONSegmentPathType
}
export type MatchSliceType = {
  type: "slice"
  sliceFrom: number
  sliceTo: number
}

export type MatchSegmentType = MatchKeyOrIndexType | MatchSliceType

export type MatchPathType = Array<MatchSegmentType>
