const __protoClassOf = (obj) => {
  return Object.getPrototypeOf(obj).constructor.name;
};

const __hashOf = (obj) => {
  if (typeof obj === "function")
    throw new Error("Cannot compute hash sum of function.");
  if (
    typeof obj === "number" ||
    typeof obj === "bigint" ||
    typeof obj === "boolean" ||
    typeof obj === "undefined"
  )
    return obj;

  if (obj.hasOwnProperty("length")) {
    if (obj.length === 0) {
      return null;
    }
  }

  let circ = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };

  let sum =
    Object.entries(obj)
      .flat(Infinity)
      .map((e) => JSON.stringify(e, circ()))
      .join("")
      .split("")
      .map((e) => e.charCodeAt(0))
      .reduce(
        (acc, v, i, arr) =>
          (acc += ((v * arr[i - 1]) % 0xffffffffffffffff) * (i + (acc ^ v)))
      ) % 0xffffffffffffffff;
  return "0x" + `${Math.abs(sum)}`.padStart(16, 0);
};

class wasMintModule {
  #moduleConfig = {};

  #internalModuleInstance = {};
  exports = {};

  #waitingForFb = null;

  #growMemoryOnAllocWarning = false;
  #stateInitialised = false;

  #debugPrint = () => { };

  display = null;

  #importConfig = {
    wasi_snapshot_preview1: {
      proc_exit: (rv) => {
        console.log(`PROC_EXIT: ${rv}`);
        return 0;
      },
    },
    env: {
      _wasMint_display_notify: (ptr) => {
        if (this.fbEnabled) {
          //console.log(this.#typeConversionTable.Number.read(ptr));
          this.#wmEmit("wasMintFramebufferUpdate", "", "")
        }
      },
      _wasMint_js_print: (ptr, len) => this.#debugPrint(ptr, len),
      emscripten_notify_memory_growth: (val) =>
        console.info(`Memory growth! ${val}`),
    },
  };

  #malloc = () => {
    return 0;
  };
  #free = () => { };

  #displayControlTable = {
    enable: 0x00000060
  }

  #typeConversionTable = {
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
      ctor: Int8Array
    },
    Uint8Array: {
      read: (ptr, len) => {
        return new Uint8Array(this.memory.buffer.slice(ptr, ptr + len * 1));
      },
      ctor: Uint8Array
    },
    Uint8ClampedArray: {
      read: (ptr, len) => {
        return new Uint8ClampedArray(
          this.memory.buffer.slice(ptr, ptr + len * 1)
        );
      },
      ctor: Uint8ClampedArray
    },
    Int16Array: {
      read: (ptr, len) => {
        return new Int16Array(this.memory.buffer.slice(ptr, ptr + len * 2));
      },
      ctor: Int16Array
    },
    Uint16Array: {
      read: (ptr, len) => {
        return new Uint16Array(this.memory.buffer.slice(ptr, ptr + len * 2));
      },
      ctor: Uint16Array
    },
    Int32Array: {
      read: (ptr, len) => {
        return new Int32Array(this.memory.buffer.slice(ptr, ptr + len * 4));
      },
      ctor: Int32Array
    },
    Uint32Array: {
      read: (ptr, len) => {
        return new Uint32Array(this.memory.buffer.slice(ptr, ptr + len * 4));
      },
      ctor: Uint32Array
    },
    Float32Array: {
      read: (ptr, len) => {
        return new Float32Array(this.memory.buffer.slice(ptr, ptr + len * 4));
      },
      ctor: Float32Array
    },
    Float64Array: {
      read: (ptr, len) => {
        return new Float64Array(this.memory.buffer.slice(ptr, ptr + len * 8));
      },
      ctor: Float64Array
    },
    BigInt64Array: {
      read: (ptr, len) => {
        return new BigInt64Array(this.memory.buffer.slice(ptr, ptr + len * 8));
      },
      ctor: BigInt64Array
    },
    BigUint64Array: {
      read: (ptr, len) => {
        return new BigUint64Array(this.memory.buffer.slice(ptr, ptr + len * 8));
      },
      ctor: BigUint64Array
    },
    Struct: {
      read: (ptr, len = 0) => {
        //Read data and increment data_bp according to their sizes
        let bp = ptr;
        let tmpObject = {};
        for (let ft of this.globals[global.name].meta.fields.wasm) {
          if (ft === "String") {
            tmpObject[`${ft}+*${bp}`] = this.#typeConversionTable[ft].read(bp);
          } else {
            tmpObject[`${ft}+${bp}`] = this.#typeConversionTable[ft].read(bp);
          }
          data_bp += this.#typeConversionTable[ft].size;
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
        return fromFunction ? this.#wmPtrToString() : this.#wmPtrToString(this.peekp(ptr));
      },
      size: 4,
    },
    BigInt: {
      read: (ptr, len = 0) => {
        return BigInt(ptr);
      }
    },
    Void: {
      read: (ptr, len = 0) => {
        return 0;
      }
    }
  };

  constructor(
    wasmPath,
    moduleConfig,
    globaliseFunctions = false,
    growMemoryOnAllocWarning = false,
    memory = new WebAssembly.Memory({
      initial: 16,
      maximum: 32,
      shared: false,
    }),
    debugPrint = (ptr, len) => {
      console.log(
        `debugPrint(${len}b@${ptr}): ${this.#wmPtrToString(ptr)}`
      );
      this.#free(ptr);
    },
    display = new wasMintDisplay(document.getElementById("wasMintModuleScreen"))
  ) {
    if (!("WebAssembly" in window)) {
      alert("You need a browser with wasm support enabled :(");
    }

    let tmpGlobals = {};
    let tmpFunctions = {};
    let __functions__ = {};

    this.display = display;

    this.#growMemoryOnAllocWarning = growMemoryOnAllocWarning;

    this.#importConfig.env.memory = memory;

    this.#moduleConfig = moduleConfig;

    //Assign debugPrint to be callable from WASM / C
    this.#debugPrint = debugPrint;

    this.#internalModuleInstance = {};
    this.exports = {};

    this.unassignedProperties = {};

    this.functions = {};
    this.globals = {};

    //Load and instantiate the WASM module
    this.#wmEmit(
      "wasMintInfo",
      "INFO",
      `Loading WASM from ${wasmPath}...`
    );
    (async () => {
      await WebAssembly.instantiateStreaming(
        fetch(wasmPath),
        this.#importConfig
      )
        .then((obj) => {
          this.#wmEmit(
            "wasMintWASMLoaded",
            "INFO",
            "WASM module loaded."
          );

          this.#internalModuleInstance = obj.instance;
          this.exports = obj.instance.exports;

          this.#wmEmit(
            "wasMintInfo",
            "INFO",
            "Determining types of exported data..."
          );

          //Determine what's a function and what's not and add to the according dictionary
          Object.entries(this.#internalModuleInstance.exports).forEach(
            (entry) => {
              if (__protoClassOf(entry[1]) === "Function") {
                this.#wmEmit(
                  "wasMintInfo",
                  "INFO",
                  `${entry[0]} => Function`
                );
                tmpFunctions[entry[0]] = entry[1];
              } else if (__protoClassOf(entry[1]) === "Global") {
                this.#wmEmit(
                  "wasMintInfo",
                  "INFO",
                  `${entry[0]} => Global`
                );
                tmpGlobals[entry[0]] = entry[1];
              } else {
                this.#wmEmit(
                  "wasMintInfo",
                  "INFO",
                  `${entry[0]} => Unassigned`
                );
                this.unassignedProperties[entry[0]] = entry[1];
              }
            }
          );

          //Firstly check if the WASM Module contains signatures for malloc and free
          if (
            this.#wmHasExportSig("malloc") &&
            this.#wmHasExportSig("free")
          ) {
            //Shim malloc and free calls to display debug output
            this.#free = (ptr) => {
              if (ptr === 0)
                throw new Error("[wasMint] free(ptr) := Cannot free *0!");
              this.exports.free(ptr);
              console.info(`[wasMint] free(ptr: ${ptr});`);
            };

            this.#malloc = (size) => {
              if (size <= 0) {
                throw new Error(
                  "[wasMint] malloc(size) := Cannot allocate 0 bytes!"
                );
              }
              if (size > this.memory.buffer.byteLength) {
                if (this.#growMemoryOnAllocWarning) {
                  console.warn(
                    "[wasMint] Memory allocation warning, growing by 1 page (64k)!"
                  );
                } else {
                  throw new Error(
                    "[wasMint] malloc(size) := Not enough memory!"
                  );
                }
              }
              let ptr = this.exports.malloc(size);
              console.info(`[wasMint] malloc(size: ${size}) := ${ptr}`);
              return ptr;
            };

            this.memory = this.#importConfig.env.memory;
            this.memory._grow = this.memory.grow;
            this.memory.grow = (pages) => {
              console.info(
                `Memory growth requested, growing by ${pages} * 64k bytes`
              );
              return this.memory._grow(pages);
            };

            this.#wmEmit(
              "wasMintInfo",
              "INFO",
              "malloc & free found and shimmed."
            );
          } else {
            this.#wmEmit(
              "wasMintError",
              "ERROR",
              "WASM Module is missing export signatures for 'malloc', 'free' or 'memory' !"
            );
          }

          //If the module exports a "main" method assign it, if not assign undefined
          this.potentialEntryPoint = undefined;

          if (this.#wmHasExportSig("WMINIT")) {
            this.potentialEntryPoint = this.exports.WMINIT;
            this.init = (...initArgs) => {
              if (this.#stateInitialised === false) {
                this.potentialEntryPoint(initArgs);
                this.#wmEmit(
                  "wasMintInfo",
                  "INFO",
                  "WASM Module initialised."
                );
                this.#stateInitialised = true;
              } else {
                this.#wmEmit(
                  "wasMintInfo",
                  "INFO",
                  "WASM Module already initialised."
                );
              }
            };
          }

          this.#wmEmit(
            "wasMintInfo",
            "INFO",
            "Configuring WASM functions..."
          );

          //Assign metadata to functions
          this.#wmEmit(
            "wasMintInfo",
            "INFO",
            `Attempting to generate metadata for ${Object.keys(this.#moduleConfig.functions).length
            } configurable functions...`
          );
          for (let funKey in tmpFunctions) {
            if (Object.keys(this.#moduleConfig.functions).includes(funKey)) {
              __functions__[funKey] = this.#moduleConfig.functions[funKey];
              __functions__[funKey]._function = tmpFunctions[funKey];
              this.#wmEmit(
                "wasMintInfo",
                "INFO",
                `Generated metadata for $${funKey}!`
              );
            }
          }
          this.#wmEmit(
            "wasMintInfo",
            "INFO",
            `Finished generation of ${Object.keys(__functions__).length
            } sets of metadata!`
          );

          this.#wmEmit(
            "wasMintInfo",
            "INFO",
            `Attempting to generate interop layers for ${Object.keys(__functions__).length
            } exported functions...`
          );
          for (let funKey in __functions__) {
            this.#wmEmit(
              "wasMintInfo",
              "INFO",
              `Generated Interop layer for $${funKey}!`
            );
            __functions__[funKey].call = (...primaryArgs) => {
              if (__functions__[funKey].showCallback) {
                __functions__[funKey].callback ??= (args) =>
                  console.log(`Callback ${funKey} := ${args}`);
                __functions__[funKey].callback(
                  `$${funKey}(${primaryArgs.join(", ").length > 512
                    ? `${primaryArgs.join(", ").substring(0, 512)}...`
                    : primaryArgs.join(", ")
                  })`
                );
              }
              if (
                primaryArgs.length < 0 ||
                primaryArgs.length > __functions__[funKey].params.length ||
                primaryArgs.length < __functions__[funKey].params.length
              ) {
                throw new Error(
                  `Invalid parameter count of [${primaryArgs.length}] for [${funKey}]`
                );
              }

              for (let i = 0; i < __functions__[funKey].params.length; i++) {
                if (
                  __protoClassOf(primaryArgs[i]) !==
                  __functions__[funKey].params[i]
                ) {
                  throw new Error(
                    `Invalid parameter type of [${__protoClassOf(
                      primaryArgs[i]
                    )}] instead of [${__functions__[funKey].params[i]
                    }] at [${i}] for [${funKey}]`
                  );
                }
              }

              let castArgs = (args) => {
                let tmpArgs = [];
                for (let arg of args) {
                  switch (__protoClassOf(arg)) {
                    case "Number":
                      tmpArgs.push(new Number(arg));
                      break;
                    case "BigInt":
                      tmpArgs.push(BigInt(arg));
                      break;
                    case "String":
                      tmpArgs.push(this.#wmAllocString(arg));
                      break;
                    default:
                      tmpArgs.push(
                        this.#wmAllocArray(arg, __protoClassOf(arg))
                      );
                      break;
                  }
                }
                return tmpArgs;
              };
              let finalArgs = castArgs(primaryArgs);
              let primaryResult = __functions__[funKey]._function(...finalArgs);

              let castResult = (ptr, len) => {
                return this.#typeConversionTable[__functions__[funKey].return.type].read(ptr ?? 0, len);
              };

              //Let castResult decide what should be returned
              let returnLength = __functions__[funKey].return.length;

              if (__protoClassOf(returnLength) !== "Number") {
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
              if (__functions__[funKey].return.type === "Void") {
                return;
              } else if (
                __protoClassOf(finalResult) !==
                __functions__[funKey].return.type
              ) {
                //Return type check via more accurate typeof
                throw new Error(
                  `Invalid return type configuration of [${__protoClassOf(
                    finalResult
                  )}] instead of [${__functions__[funKey].return.type
                  }] for [${funKey}]`
                );
              } else {
                return finalResult;
              }
            };
          }
          this.#wmEmit(
            "wasMintInfo",
            "INFO",
            `Finished generation of interop layers for ${Object.keys(__functions__).length
            } exported functions!`
          );
        })
        .catch((err) => {
          this.#wmEmit(
            "wasMintError",
            "ERROR",
            `Error occured during WASM loading: ${err} !`
          );
        });

      for (let funcIdentifier of Object.keys(__functions__)) {
        this.functions[funcIdentifier] = __functions__[funcIdentifier].call;
        Object.defineProperty(this.functions[funcIdentifier], "name", {
          value: `wasMint_func$${funcIdentifier}`,
          enumerable: false,
        });
        if (globaliseFunctions) {
          globalThis[funcIdentifier] = __functions__[funcIdentifier].call;
          Object.defineProperty(globalThis[funcIdentifier], "name", {
            value: `wasMint_func$${funcIdentifier}`,
            enumerable: false,
          });
        }
      }

      for (let entry of Object.entries(this.#moduleConfig.globals)) {
        if (Object.keys(tmpGlobals).includes(entry[0])) {
          Object.defineProperties((this.globals[entry[0]] = {}), {
            ptr: {
              value: tmpGlobals[entry[0]].value,
              writable: false,
            },
            name: {
              value: entry[0],
              writable: false,
            },
            meta: {
              value: entry[1],
              writable: false,
            },
          });
        }
      }

      console.table("Configured function listing", this.functions);
      console.table("Exported globals", this.globals);
      this.#wmEmit(
        "wasMintWASMConfigured",
        "INFO",
        "WASM Module configured."
      );
      this.hash = __hashOf(this);
      //Object.freeze(this);
    })();
  }

  #wmEmit(name, type, msg) {
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

  #wmHasExportSig(sig) {
    return Object.keys(this.exports).includes(sig);
  }

  #wmHasFunSig(sig) {
    return Object.keys(this.functions).includes(sig);
  }

  #wmHasGlbSig(sig) {
    return Object.keys(this.globals).includes(sig);
  }

  #wmStrlen(ptr) {
    return new Uint8Array(
      this.memory.buffer.slice(ptr, this.memory.buffer.byteLength)
    ).indexOf(0);
  }

  #wmPtrToString(ptr) {
    let dec = new TextDecoder();
    let string = dec.decode(
      new Uint8Array(this.memory.buffer, ptr, this.#wmStrlen(ptr))
    );
    return string;
  }

  #wmAllocString(string) {
    let enc = new TextEncoder();
    let bytes = enc.encode(string);

    let ptr = this.#malloc(bytes.byteLength);

    let buffer = new Uint8Array(this.memory.buffer, ptr, bytes.byteLength + 1);
    buffer.set(bytes);
    return ptr;
  }

  #wmAllocArray(array, type) {
    let ptr = this.#malloc(array.byteLength);

    let buffer = new this.#typeConversionTable[type].ctor(
      this.memory.buffer,
      ptr,
      array.length,
      type
    );
    buffer.set(array);
    return ptr;
  }

  /**
   * Check the alignment of `ptr` via `ptr % align === 0`
   * @param {number} ptr
   * @param {number} align
   * @returns true | false
   */
  alignCheck = (ptr, align) => {
    return ptr % align === 0;
  };

  /**
   * Aligns `ptr` upwards to the nearest pointer where `ptr % align === 0`
   * @param {number} ptr
   * @param {align} align
   * @returns The up-aligned pointer
   */
  alignUp = (ptr, align) => {
    while (ptr % align !== 0) {
      ++ptr;
    }
    return ptr;
  };

  peek = (ptr) => {
    return new Uint8Array(this.memory.buffer, ptr, 1)[0] ?? "NULL";
  };

  peekw = (ptr) => {
    if (!this.alignCheck(ptr, 2))
      throw new Error(
        `Memory alignment check failed for *0x${ptr.toString(16)}`
      );
    return new Uint16Array(this.memory.buffer, ptr, 1)[0] ?? "NULL";
  };

  peekd = (ptr) => {
    if (!this.alignCheck(ptr, 4))
      throw new Error(
        `Memory alignment check failed for *0x${ptr.toString(16)}`
      );
    return new Uint32Array(this.memory.buffer, ptr, 1)[0] ?? "NULL";
  };

  poke = (ptr, data) => {
    new Uint8Array(this.memory.buffer, ptr, 1).set([data]);
    return this.peek(ptr) === data;
  };

  pokew = (ptr, data) => {
    if (!this.alignCheck(ptr, 2))
      throw new Error(
        `Memory alignment check failed for *0x${ptr.toString(16)}`
      );
    new Uint16Array(this.memory.buffer, ptr, 1).set([data]);
    return this.peekw(ptr) === data;
  };

  poked = (ptr, data) => {
    if (!this.alignCheck(ptr, 4))
      throw new Error(
        `Memory alignment check failed for *0x${ptr.toString(16)}`
      );
    new Uint32Array(this.memory.buffer, ptr, 1).set([data]);
    return this.peekd(ptr) === data;
  };

  peekp = (ptr) => {
    return new DataView(this.memory.buffer).getUint32(ptr, true);
  };

  readCharArrayExport = (ptr) => {
    return this.#wmPtrToString(ptr);
  };

  readGlobal = (global) => {
    return [this.globals[global.name].meta.type].read(global.ptr, global.meta.length || 0);
  }

  //Screen stuff...
  display_init = () => {
    if ((this.#wmHasGlbSig("fb") === false) || (this.#wmHasFunSig("render") === false)) {
      throw new Error("Unable to initialise display since either no 'fb' global or no 'render' function was exported!");
      return;
    }

    this.enableWASMFramebuffer = () => {
      this.fbEnabled = true;
      return (this.poke(this.#displayControlTable.enable, 0x01));
    }

    this.disableWASMFramebuffer = () => {
      this.fbEnabled = false;
      return (this.poke(this.#displayControlTable.enable, 0x00));
    }

    this.wmRenderFbAndRegisterInt = (key = "Escape", dspStandby = this.display.renderStandby, fbRead = this.#typeConversionTable["Uint8ClampedArray"].read, fbFrame = this.display.flatFrame, fbDisable = this.disableWASMFramebuffer, fbPtr = this.globals["fb"].ptr, fbLen = this.display.byteLength) => {

      if (this.fbEnabled) {
        let renderFb = () => {
          fbFrame(fbRead(fbPtr, fbLen));
        }
        addEventListener("wasMintFramebufferUpdate", renderFb)
        addEventListener("keydown", function interrupt(event) {
          if (event.key === key) {
            removeEventListener("keydown", interrupt);
            removeEventListener("wasMintFramebufferUpdate", renderFb);
            fbDisable();
            dspStandby();
          }
        })
        this.functions["render"]();
        return 0;
      }
      return -1;
    }

    return 0;
  }
}

class wasMintModuleManager {
  *#genID() {
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
    if (__protoClassOf(wasMintModule) !== "wasMintModule") {
      return false;
    }
    let aF = false;
    if (name === undefined || name === "") return false;
    for (const n of this.__modules__.values()) {
      if (this.allowDuplicates === true) {
        break;
      }
      if (n.name === name) aF = true;
      break;
    }

    if (!aF) {
      if (this.modulePoolSize++ != this.maxModulePoolSize) {
        this.__modules__[this.#nextID()] = {
          name: name,
          module: wasMintModule,
        };
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
    if (this.__modules__.some((mod) => mod.name === name)) {
      this.__modules__ = this.__modules__.filter((mod) => mod.name !== name);
      return true;
    }
    return false;
  }

  initAll() {
    this.__modules__.forEach((mod) => {
      if (Object.keys(mod.module).includes("init")) {
        console.log(`Initialising ${mod.name}`);
        mod.module.init();
      }
    });
  }

  getWASMModuleByName(name) {
    return this.__modules__.find((mod) => mod.name === name)?.module ?? null;
  }
}

class wasMintDisplay {
  constructor(pCanvas) {
    this.canvas = pCanvas;
    this.width = pCanvas.width;
    this.height = pCanvas.height;

    this.pixelLenght = this.width * this.height;
    this.byteLength = this.pixelLenght * 4; //RGBA, 1 byte for each channel

    this.initContext(this.canvas);
    this.ctx.moveTo(0, 0);
  }

  renderStandby() {
    this.nestedFrame(new Array((240 * 480)).fill([0xFF, 0xCC, 0x00, 0xFF], 0));
    this.ctx.font = "30px sans-serif";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Waiting for RGBA Input", this.width / 2, this.height / 2);
  }

  initContext() {
    this.ctx = this.canvas.getContext("2d");
    this.renderStandby()
  }

  initContextFast() {
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.renderStandby();
  }

  flatFrame(u8Arr) {
    let d = this.ctx.getImageData(0, 0, this.width, this.height);
    d.data.set(u8Arr);
    this.ctx.putImageData(d, 0, 0);
  }

  nestedFrame(arrOfU8Arr) {
    let d = this.ctx.getImageData(0, 0, this.width, this.height);
    d.data.set(arrOfU8Arr.flat(Infinity));
    this.ctx.putImageData(d, 0, 0);
  }

  pixel(x, y, pixel) {
    let d = this.ctx.createImageData(1, 1);
    pixel[3] ??= 0xFF;
    d.data.set(pixel);

    this.ctx.putImageData(d, x, y);
  }

}