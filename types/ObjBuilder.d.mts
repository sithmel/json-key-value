export default class ObjBuilder {
    object: import("../types/baseTypes").JSONValueType | undefined;
    /**
     * Implement JSON reviver feature as for specs of JSON.parse
     * @param {import("../types/baseTypes").JSONPathType} path
     * @param {import("../types/baseTypes").JSONValueType} value
     * @returns {void}
     */
    add(path: import("../types/baseTypes").JSONPathType, value: import("../types/baseTypes").JSONValueType): void;
}
//# sourceMappingURL=ObjBuilder.d.mts.map