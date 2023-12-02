// lifted from json2
// https://github.com/douglascrockford/JSON-js

export default function JSONReviver(obj, reviver) {
  function walk(holder, key) {
    // The walk method is used to recursively walk the resulting structure so
    // that modifications can be made.

    const value = holder[key]
    if (value && typeof value === "object") {
      for (let k in value) {
        if (Object.prototype.hasOwnProperty.call(value, k)) {
          let v = walk(value, k)
          if (v !== undefined) {
            value[k] = v
          } else {
            delete value[k]
          }
        }
      }
    }
    return reviver.call(holder, key, value)
  }

  return typeof reviver === "function" ? walk({ "": obj }, "") : obj
}
