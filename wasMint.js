class wasMintVoid {
  constructor() {
    //Fill the void in my soul due to lack of affection by maidens
  }
}

class wasMintModule {
  constructor(
    wasmPath,
    importConfig = {
      wasi_snapshot_preview1: {
        proc_exit: (rv) => {
          console.log(`PROC_EXIT: ${rv}`);
          return 0;
        },
      },
      env: {
        _wasMint_js_print: (ptr, len) => debugPrint(ptr, len),
        emscripten_notify_memory_growth: (val) =>
          console.info(`Memory growth! ${val}`),
      },
    },
    functionConfig,
    debugPrint = (ptr, len) => {
      console.log(
        `debugPrint(${len}b@${ptr}): ${this.wasMintPtrToString(ptr, len)}`
      );
    }
  ) {
    if (!("WebAssembly" in window)) {
      alert("you need a browser with wasm support enabled :(");
    }

    this.typedArrCtors = {
      Int8Array: Int8Array,
      Uint8Array: Uint8Array,
      Uint8ClampedArray: Uint8ClampedArray,
      Int16Array: Int16Array,
      Uint16Array: Uint16Array,
      Int32Array: Int32Array,
      Uint32Array: Uint32Array,
      Float32Array: Float32Array,
      Float64Array: Float64Array,
      BigInt64Array: BigInt64Array,
      BigUint64Array: BigUint64Array,
    };

    this.functionConfig = functionConfig;

    //Assign debugPrint to be callable from WASM / C
    this.debugPrint = debugPrint;

    //Preinitialize those two...
    this.internalModuleInstance = {};
    this.exports = {};

    this.properties = {};
    this.functions = {};

    //Load and instantiate the WASM module
    this.wasMintDispatchEvent(
      "wasMintInfo",
      "INFO",
      `Loading WASM from ${wasmPath}...`
    );
    (async () => {
      await WebAssembly.instantiateStreaming(fetch(wasmPath), importConfig)
        .then((obj) => {
          this.internalModuleInstance = obj.instance;
          this.exports = obj.instance.exports;

          let tmpFunctions = {};

          //Determine what's a function and what's not and add to the according dictionary
          Object.entries(this.internalModuleInstance.exports).forEach(
            (element) =>
              typeof element[1] === "function"
                ? (tmpFunctions[element[0]] = element[1])
                : (this.properties[element[0]] = element[1])
          );

          //Firstly check if the WASM Module contains signatures for malloc, free and memory
          if (
            this.wasMintHasSignature("malloc") &&
            this.wasMintHasSignature("free") &&
            this.wasMintHasSignature("memory")
          ) {
            //Shim malloc and free calls to display debug output
            this.free = (ptr) => {
              console.info(`[wasMint] free(ptr: ${ptr});`);
              if (ptr === 0)
                throw new Error(
                  "[wasMint] Memory deallocation error, attempted to call free(ptr); with ptr = 0!"
                );
              this.exports.free(ptr);
            };

            this.malloc = (size) => {
              let ptr = this.exports.malloc(size);
              if (size === 0)
                throw new Error(
                  "[wasMint] Memory allocation error, attempted to call malloc(size); with size = 0!"
                );
              console.info(`[wasMint] malloc(size: ${size}) := ${ptr}`);
              return ptr;
            };

            this.memory = this.exports.memory;

            this.wasMintDispatchEvent(
              "wasMintInfo",
              "INFO",
              "malloc & free found and shimmed."
            );
          } else {
            this.wasMintDispatchEvent(
              "wasMintError",
              "ERROR",
              "WASM Module is missing export signatures for 'malloc', 'free' or 'memory' !"
            );
          }

          //If the module exports a "main" method assign it, if not assign undefined
          this.potentialEntryPoint = undefined;
          this.wasMintHasSignature("main")
            ? (this.potentialEntryPoint = this.exports.main)
            : undefined;
          this.init = () => {
            this.potentialEntryPoint.call();
          };

          this.wasMintDispatchEvent(
            "wasMintWASMLoaded",
            "INFO",
            "WASM module loaded."
          );
          this.wasMintDispatchEvent(
            "wasMintInfo",
            "INFO",
            "Configuring WASM functions..."
          );

          //Assign metadata to functions
          this.wasMintDispatchEvent(
            "wasMintInfo",
            "INFO",
            `Attempting to generate metadata for ${
              Object.keys(functionConfig).length
            } configurable functions...`
          );
          for (let funKey in tmpFunctions) {
            if (Object.keys(this.functionConfig).includes(funKey)) {
              this.functions[funKey] = this.functionConfig[funKey];
              this.functions[funKey]._function = tmpFunctions[funKey];
              this.wasMintDispatchEvent(
                "wasMintInfo",
                "INFO",
                `Generated metadata for $${funKey}!`
              );
            }
          }
          this.wasMintDispatchEvent(
            "wasMintInfo",
            "INFO",
            `Finished generation of ${
              Object.keys(this.functions).length
            } sets of metadata!`
          );

          this.wasMintDispatchEvent(
            "wasMintInfo",
            "INFO",
            `Attempting to generate call wrappers for ${
              Object.keys(this.functions).length
            } exported functions...`
          );
          for (let funKey in this.functions) {
            this.wasMintDispatchEvent(
              "wasMintInfo",
              "INFO",
              `Generated call wrapper for $${funKey}!`
            );
            this.functions[funKey].call = (...primaryArgs) => {
              this.functions[funKey].callback ??= (args) => console.log(args);
              this.functions[funKey].callback(`$${funKey}(${primaryArgs})`);
              if (
                primaryArgs.length < 0 ||
                primaryArgs.length > this.functions[funKey].params.length ||
                primaryArgs.length < this.functions[funKey].params.length
              ) {
                throw new Error(
                  `Invalid parameter count of [${primaryArgs.length}] for [${funKey}]`
                );
              }

              let _typeof = (val) => {
                return Object.prototype.toString.call(val).slice(8, -1);
              };
              for (let i = 0; i < this.functions[funKey].params.length; i++) {
                if (
                  _typeof(primaryArgs[i]) !== this.functions[funKey].params[i]
                ) {
                  throw new Error(
                    `Invalid parameter type of [${_typeof(
                      primaryArgs[i]
                    )}] instead of [${
                      this.functions[funKey].params[i]
                    }] at [${i}] for [${funKey}]`
                  );
                }
              }

              let castArgs = (args) => {
                let tmpArgs = [];
                for (let arg of args) {
                  switch (_typeof(arg)) {
                    case "Number":
                      tmpArgs.push(new Number(arg));
                      break;
                    case "BigInt":
                      tmpArgs.push(BigInt(arg));
                      break;
                    case "String":
                      tmpArgs.push(this.wasMintStringToPtr(arg));
                      break;
                    default:
                      tmpArgs.push(this.wasMintArrayToPtr(arg, _typeof(arg)));
                      break;
                  }
                }
                return tmpArgs;
              };
              let finalArgs = castArgs(primaryArgs);
              let primaryResult = this.functions[funKey]._function(
                ...finalArgs
              );

              let castResult = (ptr, len) => {
                switch (this.functions[funKey].return.type) {
                  case "Number":
                    return new Number(ptr);
                    break;
                  case "BigInt":
                    return BigInt(ptr);
                  case "String":
                    return this.wasMintPtrToString(ptr, len);
                    break;
                  case "Int8Array":
                    return new Int8Array(
                      this.memory.buffer.slice(ptr, ptr + len * 1)
                    );
                    break;
                  case "Uint8Array":
                    return new Uint8Array(
                      this.memory.buffer.slice(ptr, ptr + len * 1)
                    );
                    break;
                  case "Uint8ClampedArray":
                    return new Uint8ClampedArray(
                      this.memory.buffer.slice(ptr, ptr + len * 1)
                    );
                    break;
                  case "Int16Array":
                    return new Int16Array(
                      this.memory.buffer.slice(ptr, ptr + len * 2)
                    );
                    break;
                  case "Uint16Array":
                    return new Uint16Array(
                      this.memory.buffer.slice(ptr, ptr + len * 2)
                    );
                    break;
                  case "Int32Array":
                    return new Int32Array(
                      this.memory.buffer.slice(ptr, ptr + len * 4)
                    );
                    break;
                  case "Uint32Array":
                    return new Uint32Array(
                      this.memory.buffer.slice(ptr, ptr + len * 4)
                    );
                    break;
                  case "Float32Array":
                    return new Float32Array(
                      this.memory.buffer.slice(ptr, ptr + len * 4)
                    );
                    break;
                  case "Float64Array":
                    return new Float64Array(
                      this.memory.buffer.slice(ptr, ptr + len * 8)
                    );
                    break;
                  case "BigInt64Array":
                    return new BigInt64Array(
                      this.memory.buffer.slice(ptr, ptr + len * 8)
                    );
                    break;
                  case "BigUint64Array":
                    return new BigUint64Array(
                      this.memory.buffer.slice(ptr, ptr + len * 8)
                    );
                    break;
                  case "Undefined":
                    return void 0; //undefined alias
                    break;
                  default:
                    return new Number(ptr);
                    break;
                }
              };

              //Let castResult decide what should be returned
              let returnLength = this.functions[funKey].return.length;

              if (_typeof(returnLength) !== "Number") {
                //Assume calculative formula
                if (returnLength.length > 2 && returnLength.startsWith("M")) {
                  //Return length to be determined by mathematical expression
                  let strArgsToIndices = [...returnLength.matchAll(/A\d+/g)];
                  returnLength = returnLength.substring(2);
                  strArgsToIndices.forEach(
                    (e) =>
                      (returnLength = returnLength.replace(
                        e[0],
                        finalArgs[e[0].split("")[1]]
                      ))
                  );
                  returnLength = returnLength
                    .replaceAll(" ", "")
                    .match(
                      /^([+\-]?\d+(\.\d+)?([+\-*/]\d+(\.\d+)?)*|[a-zA-Z][a-zA-Z0-9]*([+\-*/][a-zA-Z][a-zA-Z0-9]*)*)$/g
                    );
                  returnLength = Function(
                    `"use strict";return ${returnLength};`
                  )();
                } else if (
                  returnLength.length > 2 &&
                  returnLength.startsWith("J")
                ) {
                  //Return length to be determined by javscript code
                  let strArgsToIndices = [...returnLength.matchAll(/A\d+/g)];
                  returnLength = returnLength.substring(2);
                  strArgsToIndices.forEach(
                    (e) =>
                      (returnLength = returnLength.replace(
                        e[0],
                        finalArgs[e[0].split("")[1]]
                      ))
                  );
                  returnLength = Function(
                    `"use strict";return ${returnLength};`
                  )();
                } else {
                  //Assume normal single args return length
                  returnLength = finalArgs[returnLength.split("")[1]];
                }
              }

              let finalResult = castResult(primaryResult, returnLength);

              //Handle void function without a return value
              if (this.functions[funKey].return.type === "Void") {
                return;
              } else if (
                _typeof(finalResult) !== this.functions[funKey].return.type
              ) {
                //Return type check via more accurate typeof
                throw new Error(
                  `Invalid return type configuration of [${_typeof(
                    finalResult
                  )}] instead of [${
                    this.functions[funKey].return.type
                  }] for [${funKey}]`
                );
              } else {
                return finalResult;
              }
            };
          }
          this.wasMintDispatchEvent(
            "wasMintInfo",
            "INFO",
            `Finished generation of call wrappers for ${
              Object.keys(this.functions).length
            } exported functions!`
          );
        })
        .catch((err) => {
          this.wasMintDispatchEvent(
            "wasMintError",
            "ERROR",
            `Error occured during WASM loading: ${err} !`
          );
        });
      console.table("Configured function listing", this.functions);
    })();
  }

  wasMintDispatchEvent(name, type, msg) {
    if (type === "ERROR") {
      console.trace();
    }
    dispatchEvent(
      new CustomEvent(name, {
        detail: {
          type: type,
          msg: msg,
        },
      })
    );
  }

  wasMintHasSignature(sig) {
    return Object.keys(this.exports).includes(sig);
  }

  wasMintPtrToString(ptr, len) {
    try {
      let array = new Uint8Array(this.memory.buffer, ptr, len);
      let dec = new TextDecoder();
      let string = dec.decode(array);
      return string;
    } finally {
      this.free(ptr);
    }
  }

  wasMintStringToPtr(string) {
    let enc = new TextEncoder();
    let bytes = enc.encode(string);

    let ptr = this.malloc(bytes.byteLength);

    let buffer = new Uint8Array(this.memory.buffer, ptr, bytes.byteLength + 1);
    buffer.set(bytes);
    return ptr;
  }

  wasMintArrayToPtr(array, type) {
    let ptr = this.malloc(array.byteLength);

    let buffer = new this.typedArrCtors[type](
      this.memory.buffer,
      ptr,
      array.length,
      type
    );
    buffer.set(array);
    return ptr;
  }
}
class wasMintModuleManager {
  * #genID() {
    let id = 0;

    while (true) {
      yield id++;
    }
  }

  #wasMintModuleIDGenerator = this.#genID();

  #nextID = () => this.#wasMintModuleIDGenerator.next().value;

  constructor(maxModulePoolSize = 0xf, allowDuplicates = false) {
    this.__modules__ = [];
    this.maxModulePoolSize = maxModulePoolSize;
    this.modulePoolSize = 0;
    this.allowDuplicates = allowDuplicates;
  }

  addModule(wasMintModule, name) {
    let aF = false;
    if(name === undefined || name === "") return false;
    for (const n of this.__modules__.values()) {
      if (this.allowDuplicates === true) {
        break;
      }
      if (n.name === name) aF = true;
      break;
    }

    if (!aF) {
      if (this.modulePoolSize++ != this.maxModulePoolSize) {
        this.__modules__[this.#nextID()] = { name: name, module: wasMintModule };
      } else {
        this.modulePoolSize--;
        console.warn(
          `Skipping module addition of module "${name}" due to module pool size threshold.`
        );
        return false;
      }
    } else {
      console.warn(
        `Skipping module addition of module "${name}" because it already exists.`
      );
      return false;
    }
    return true;
  }

  removeModule(name) {
    if(this.__modules__.some(mod => mod.name === name)) {
        this.__modules__ = this.__modules__.filter((mod) => mod.name !== name);
        return true;
    }
    return false;
  }
}
