export default class ObjParser {
    /**
     * parse a json or json fragment
     * @param {Object} obj
     * @param {import("../types/baseTypes").JSONPathType} currentPath
     * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
     */
    parse(obj: Object, currentPath?: import("../types/baseTypes").JSONPathType): Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>;
}
//# sourceMappingURL=ObjParser.d.mts.map