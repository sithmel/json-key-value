import isPlainObject from "lodash.isplainobject"

export default class ObjParser {
  *parse(obj, currentPath = []) {
    if (Array.isArray(obj)) {
      yield [currentPath, []]
      for (const [pathSegment, value] of obj.map((v, i) => [i, v])) {
        currentPath.push(pathSegment)
        yield* this.parse(value, currentPath)
        currentPath.pop()
      }
    } else if (isPlainObject(obj)) {
      yield [currentPath, {}]
      for (const [pathSegment, value] of Object.entries(obj)) {
        currentPath.push(pathSegment)
        yield* this.parse(value, currentPath)
        currentPath.pop()
      }
    } else {
      yield [currentPath, obj]
    }
  }
}
