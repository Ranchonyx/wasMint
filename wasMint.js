class wasMintModule {

    constructor(wasmPath, importConfig = {
        wasi_snapshot_preview1: {
            proc_exit: (rv) => {
                console.log(`PROC_EXIT: ${rv}`);
                return 0;
            }
        },
        env: {
            _wasMint_js_print: (ptr, len) => debugPrint(ptr, len),
            emscripten_notify_memory_growth: (val) => console.info(`Memory growth! ${val}`)
        }
    }, functionConfigOptions, debugPrint = ((ptr, len) => {
        console.log(`debugPrint(${len}b@${ptr}): ${this.wasMintPtrToString(ptr, len)}`)
    })) {
        
        //Assign debugPrint to be callable from WASM / C
        this.debugPrint = debugPrint;

        //Preinitialize those two...
        this.internalModuleInstance = {};
        this.exports = {};

        this.properties = {};
        this.functions = {};

        //Load and instantiate the WASM module
        console.info(`Loading WASM from ${wasmPath}...`);
        WebAssembly.instantiateStreaming(fetch(wasmPath), importConfig).then(obj => {
            this.internalModuleInstance = obj.instance;
            this.exports = obj.instance.exports;

            //Determine what's a function and what isn't and add to the according dictionary
            Object.entries(this.exports).forEach(
                element => typeof element[1] === "function" ? this.functions[element[0]] = element[1] : this.properties[element[0]] = element[1]
            );

            //Firstly check if the WASM Module contains signatures for malloc, free and memory
            if(this.wasmHasSignature("malloc") && this.wasmHasSignature("free") && this.wasmHasSignature("memory")) {
                //Shim malloc and free calls to display debug output
                this.free = (ptr) => {
                    console.info(`[wasMint] free(ptr: ${ptr});`);
                    this.exports.free(ptr);
                }
    
                this.malloc = (size) => {
                    let ptr = this.exports.malloc(size);
                    console.info(`[wasMint] malloc(size: ${size});\n${ptr}<-`);
                    return ptr;
                }

                this.memory = this.exports.memory;

                this.wasMintDispatchEvent("wasMintInfo", "INFO", "malloc & free found and shimmed.");
            } else {
                this.wasMintDispatchEvent("wasMintError", "ERROR", "WASM Module is missing export signatures for 'malloc', 'free' or 'memory' !");
            }
    
            //If the module exports a "main" method assign it, if not assign undefined
            this.potentialEntryPoint = undefined;
            this.wasmHasSignature("main") ? this.potentialEntryPoint = this.exports.main : undefined;

            this.wasMintDispatchEvent("wasMintWASMLoaded", "INFO", "WASM module loaded.");
        }).catch(err => {
            this.wasMintDispatchEvent("wasMintError", "ERROR", `Error occured during WASM loading: ${err} !`)
        });

    }

    wasMintDispatchEvent(name, type, msg) {
        dispatchEvent(new CustomEvent(name, {
            detail: {
                    type: type,
                    msg: msg
                }
            })
        );
    }

    wasmHasSignature(sig) {
        return (Object.keys(this.exports).includes(sig));
    }

    wasMintPtrToString(ptr, len) {
        console.info(`[wasMint] wasmPtrToString(ptr: ${ptr}, len: ${len});`);
        try {
            let array = new Uint8Array(this.memory.buffer, ptr, len);
            let dec = new TextDecoder();
            let string = dec.decode(array);
            console.info(`[wasMint] return ${string};`);
            return string;
        } finally {
            this.free(ptr);
        }
    }

    wasMintStringToPtr(string) {
        console.info(`[wasMint] stringToWasmPtr(string: ${string});`);
        let enc = new TextEncoder();
        let bytes = enc.encode(string);

        let ptr = this.malloc(bytes.byteLength);

        let buffer = new Uint8Array(this.memory.buffer, ptr, bytes.byteLength + 1);
        buffer.set(bytes);

        console.info(`[wasMint] return ptr -> ${buffer};`);
        return ptr;
    }

    wasMintPtrToFloat32Array(ptr, len) {
<<<<<<< HEAD
        let array = new Float32Array(this.memory.buffer, ptr, len);
=======
        let array = new Float32Array(this.memory.buffer.slice(ptr, ptr+(len*4)));
>>>>>>> refs/remotes/origin/master
        try {
            return array;
        } finally {
            this.free(ptr)
        }
    }

<<<<<<< HEAD

=======
>>>>>>> refs/remotes/origin/master
};

