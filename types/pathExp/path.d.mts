export class CachedStringBuffer {
    /** @param {Uint8Array} data */
    constructor(data: Uint8Array);
    data: Uint8Array;
    /** @type {?string} */
    cache: string | null;
    /** @return {import("../../types/baseTypes").JSONSegmentPathType} */
    toDecoded(): import("../../types/baseTypes").JSONSegmentPathType;
    /** @return {Uint8Array} data */
    get(): Uint8Array;
}
export class Path {
    /**
     * @param {Array<CachedStringBuffer|number|string>} [array]
     * @param {number} [offset]
     */
    constructor(array?: (string | number | CachedStringBuffer)[] | undefined, offset?: number | undefined);
    array: (string | number | CachedStringBuffer)[];
    offset: number;
    /** @return {number}*/
    get length(): number;
    /** @param {CachedStringBuffer|number|string} segment*/
    push(segment: CachedStringBuffer | number | string): void;
    /** @return {?CachedStringBuffer|number|string}*/
    pop(): (CachedStringBuffer | number | string) | null;
    /**
     * @param {number} index
     * @return {?CachedStringBuffer|number|string}
     */
    get(index: number): (CachedStringBuffer | number | string) | null;
    /**
     * @param {(arg0: CachedStringBuffer|number|string) => any} func
     * @return {Array<any>}
     */
    map(func: (arg0: CachedStringBuffer | number | string) => any): Array<any>;
    /**
     * @return {Path}
     * */
    rest(): Path;
    /** @return {import("../../types/baseTypes").JSONPathType} */
    toDecoded(): import("../../types/baseTypes").JSONPathType;
}
//# sourceMappingURL=path.d.mts.map