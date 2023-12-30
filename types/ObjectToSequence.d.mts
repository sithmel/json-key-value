export default class ObjectToSequence {
    /**
     * parse a json or json fragment
     * @param {any} obj
     * @param {import("../types/baseTypes").JSONPathType} currentPath
     * @returns {Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>}
     */
    iter(obj: any, currentPath?: import("../types/baseTypes").JSONPathType): Iterable<[import("../types/baseTypes").JSONPathType, import("../types/baseTypes").JSONValueType]>;
}
//# sourceMappingURL=ObjectToSequence.d.mts.map