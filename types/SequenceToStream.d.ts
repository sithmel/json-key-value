export default SequenceToStream;
/**
 * Convert a sequence of path value pairs to a stream of bytes
 */
declare class SequenceToStream {
    currentPath: Path;
    /**
     * add a new path value pair
     * @param {Path} path - an array of path segments
     * @param {Value} value - the value at the corresponding path
     * @returns {Uint8Array}
     */
    add(path: Path, value: Value): Uint8Array;
    /**
     * The input stream is completed
     * @returns {Uint8Array}
     */
    end(): Uint8Array;
}
import { Path } from "./lib/path.js";
import { Value } from "./lib/value.js";
//# sourceMappingURL=SequenceToStream.d.ts.map