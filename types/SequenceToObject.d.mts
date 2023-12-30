export default class SequenceToObject {
    /**
     * Convert a sequence to a js object
     * @param {{compactArrays?: boolean}} options
     */
    constructor(options?: {
        compactArrays?: boolean | undefined;
    });
    object: import("../types/baseTypes").JSONValueType | undefined;
    compactArrays: boolean;
    /**
     * @package
     * @param {import("../types/baseTypes").JSONSegmentPathType} pathSegment
     * @param {import("../types/baseTypes").JSONValueType} currentObject
     * @returns {import("../types/baseTypes").JSONSegmentPathType}
     */
    _calculateRealIndex(pathSegment: import("../types/baseTypes").JSONSegmentPathType, currentObject: import("../types/baseTypes").JSONValueType): import("../types/baseTypes").JSONSegmentPathType;
    /**
     * Update the object with a new path value pairs
     * @param {import("../types/baseTypes").JSONPathType} path
     * @param {import("../types/baseTypes").JSONValueType} value
     * @returns {void}
     */
    add(path: import("../types/baseTypes").JSONPathType, value: import("../types/baseTypes").JSONValueType): void;
}
//# sourceMappingURL=SequenceToObject.d.mts.map