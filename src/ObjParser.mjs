import isPlainObject from "lodash.isplainobject"

export default class ObjParser {
  constructor({ onAddAttribute, onOpenObject, onOpenArray, onClose, onInit }) {
    this.onAddAttribute = onAddAttribute
    this.onOpenObject = onOpenObject
    this.onOpenArray = onOpenArray
    this.onClose = onClose
    this.onInit = onInit
  }
  _parse(path, obj, asArray) {
    const keysValues = asArray ? obj.map((v, i) => [i, v]) : Object.entries(obj)
    for (const [pathSegment, value] of keysValues) {
      path.push(pathSegment)
      if (Array.isArray(value)) {
        this.onOpenArray(path)
        this._parse(path, obj[pathSegment], true)
        this.onClose(path)
      } else if (isPlainObject(value)) {
        this.onOpenObject(path)
        this._parse(path, obj[pathSegment], false)
        this.onClose(path)
      } else {
        this.onAddAttribute(path, value)
      }
      path.pop()
    }
  }
  parse(obj) {
    if (Array.isArray(obj)) {
      this.onInit([])
      this._parse([], obj, true)
    } else if (isPlainObject(obj)) {
      this.onInit({})
      this._parse([], obj, false)
    } else {
      this.onInit(obj)
    }
  }
}
