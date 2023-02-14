exports.typeConversionTable = {
    Byte: {
        read: (ptr, len = 0) => {
            return new DataView(this.memory.buffer).getUint8(ptr, true);
        },
        size: 1,
    },
    Word: {
        read: (ptr, len = 0) => {
            return new DataView(this.memory.buffer).getUint16(ptr, true);
        },
        size: 2,
    },
    Dword: {
        read: (ptr, len = 0) => {
            return new DataView(this.memory.buffer).getUint32(ptr, true);
        },
        size: 4,
    },
    Qword: {
        read: (ptr, len = 0) => {
            return new DataView(this.memory.buffer).getBigUint64(ptr, true);
        },
        size: 8,
    },
    Int8Array: {
        read: (ptr, len) => {
            return new Int8Array(this.memory.buffer.slice(ptr, ptr + length * 1));
        },
    },
    Uint8Array: {
        read: (ptr, len) => {
            return new Uint8Array(this.memory.buffer.slice(ptr, ptr + len * 1));
        },
    },
    Uint8ClampedArray: {
        read: (ptr, len) => {
            return new Uint8ClampedArray(
                this.memory.buffer.slice(ptr, ptr + len * 1)
            );
        },
    },
    Int16Array: {
        read: (ptr, len) => {
            return new Int16Array(this.memory.buffer.slice(ptr, ptr + len * 2));
        },
    },
    Uint16Array: {
        read: (ptr, len) => {
            return new Uint16Array(this.memory.buffer.slice(ptr, ptr + len * 2));
        },
    },
    Int32Array: {
        read: (ptr, len) => {
            return new Int32Array(this.memory.buffer.slice(ptr, ptr + len * 4));
        },
    },
    Uint32Array: {
        read: (ptr, len) => {
            return new Uint32Array(this.memory.buffer.slice(ptr, ptr + len * 4));
        },
    },
    Float32Array: {
        read: (ptr, len) => {
            return new Float32Array(this.memory.buffer.slice(ptr, ptr + len * 4));
        },
    },
    Float64Array: {
        read: (ptr, len) => {
            return new Float64Array(this.memory.buffer.slice(ptr, ptr + len * 8));
        },
    },
    BigInt64Array: {
        read: (ptr, len) => {
            return new BigInt64Array(this.memory.buffer.slice(ptr, ptr + len * 8));
        },
    },
    BigUint64Array: {
        read: (ptr, len) => {
            return new BigUint64Array(this.memory.buffer.slice(ptr, ptr + len * 8));
        },
    },
    Struct: {
        read: (ptr, len = 0) => {
            //Read data and increment data_bp according to their sizes
            let bp = ptr;
            let tmpObject = {};
            for (let ft of this.globals[global.name].meta.fields.wasm) {
                if (ft === "String") {
                    tmpObject[`${ft}+*${bp}`] = readTable[ft].read(bp);
                } else {
                    tmpObject[`${ft}+${bp}`] = readTable[ft].read(bp);
                }
                data_bp += readTable[ft].size;
            }
            return tmpObject;
        },
    },
    Number: {
        read: (ptr, len = 0) => {
            return new Number(ptr);
        }
    },
    String: {
        read: (ptr, len = 0, fromFunction = false) => {
            return fromFunction ? this.#wasMintPtrToString() : this.#wasMintPtrToString(this.peekp(ptr));
        },
        size: 4,
    },
    BigInt: {
        read: (ptr, len = 0) => {
            return BigInt(ptr);
        }
    },
    Undefined: {
        read: (ptr, len = 0) => {
            return undefined;
        }
    }
};