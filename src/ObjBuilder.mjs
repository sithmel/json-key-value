export default class ObjBuilder {
  constructor(obj = {}) {
    this.object = obj

    this.currentObject = this.object
    this.currentPath = []
    this.objStack = [this.object]
  }
  addAttribute(pathSegment, value) {
    this.currentObject[pathSegment] = value
  }
  _openObject(pathSegment, value) {
    this.currentPath.push(pathSegment)
    this.currentObject[pathSegment] = value
    this.objStack.push(this.currentObject)
    this.currentObject = this.currentObject[pathSegment]
  }
  openObject(pathSegment) {
    this._openObject(pathSegment, {})
  }
  openArray(pathSegment) {
    this._openObject(pathSegment, [])
  }
  close() {
    this.currentPath.pop()
    this.currentObject = this.objStack.pop()
  }
}
