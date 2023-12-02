function initObject(pathSegment) {
  return Number.isInteger(pathSegment) && pathSegment >= 0 ? [] : {}
}
export default class ObjBuilder {
  constructor() {
    this.object = undefined
  }
  add(path, value) {
    if (path.length === 0) {
      this.object = value
      return
    }
    if (this.object === undefined) {
      this.object = initObject(path[0])
    }
    let currentObject = this.object
    for (let i = 0; i < path.length - 1; i++) {
      const currentPathSegment = path[i]
      const nextPathSegment = path[i + 1]
      if (currentObject[currentPathSegment] === undefined) {
        currentObject[currentPathSegment] = initObject(nextPathSegment)
      }
      currentObject = currentObject[currentPathSegment]
    }
    currentObject[path[path.length - 1]] = value
  }
}
