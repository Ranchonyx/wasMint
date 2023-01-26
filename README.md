# wasMint
![wasMintLogo](https://github.com/ranchonyx/wasMint/raw/master/wasMintLogo.png)

#### Requirements:

- Emsdk (Emscripten SDK)
- Python
- A web browser (No shit)
- Any source code editor

## Story

> "I fucking hate emscripten's glue code!" I thought to myself one sunny day at work.

> Yeah that's basically it. I'm trying to make my own sort of ... WASM framework/runtime/shebang

## Description

wasMint abstracts the classic WASM module object inside an overlaying module object.
Each one of the, via emscripten's SDK, exported functions is assigned a "function configuration" which looks something like this

```json
  "_wasMint_8xf32x4_add": {
    "params": [
      "Number",
      "Number",
      "Number",
      "Number",
      "Number",
      "Number",
      "Number",
      "Number"
    ],
    "return": {
      "type": "Float32Array",
      "length": 4
    },
    "showCallback": false
  }
```

This example defines a native C/WASM/etc function's structure.
The function's identifier/name in this case is `_wasMint_8xf32x4_add`.
Its parameters are eight `Number` types.
It returns an `array of 32-bit floating point numbers with 4 elements`.

Since accessing and correctly interpreting/working with WASM's underlying memory area can be a major source of pain, anxiety and reason for alcohol abuse, wasMint automatically converts WASM's returned pointers and values et cetera to their JavaScript counterparts by utilising this function configuration.
As a matter of fact, this format is somewhat inspired by Emscripten's `ccall` syntax for calling native/WASM functions.

When exporting the `main` function from the WASM source code, wasMint will automatically assign this function to be the respective module's init function, it can be compared to the _Arduino IDE's_ `void setup()` function and is only able to be ran once.

### Usage

The syntax for constructing a new wasMint Module is as follows:

```javascript
constructor wasMintModule(wasmPath, functionConfig, globaliseFunctions, growMemoryOnAllocWarning, memory?, debugPrint?);
```

- > `wasmPath` denotes the URI/URL/Whatever of the WASM file to load, wasMint uses `fetch()` to load the WASM file.
- > `functionConfig` denotes the aforementioned function config as a JSON object.
- > `globaliseFunctions` denotes if configured wasMint functions should be available on the `globalThis` Object or exclusively as properties of the containing wasMint module.
- > `growMemoryOnAllocWarning` denotes if wasMint should attempt to grow available memory when an internal `malloc(size_t)` call would fail due to not having enough available memory.
- > `memory` allows you to supply your own `Webassembly.Memory` object, if not supplied wasMint will use a memory with 16 initial pages and 32 maximum pages.
- > `debugPrint(ptr, len)` is oftentimes called as an indicator when a configured wasMint function is called. This behaviour can be toggled by setting the `showCallback` property's value in the `functionConfig` to `false` for the respective function.

After the constructor is done ... constructing, you will be able to find your wanted functions on the respective wasMint module's `functions` property, or, if you have `globaliseFunctions` enabled, on the `globalThis` object, without having to call them from the respective wasMint module directly, which is quite nice.

### Somewhat reliable typechecking

- > `__protoClassOf(obj)` fairly reliably returns the class name of any class instance, or the classic `typeof` if it is given a standard object.

```javascript
const __protoClassOf = (obj) => {
  return Object.getPrototypeOf(obj).constructor.name;
};
```

### Events

wasMint emits the following events, further details about the event can be found in the event's detail parameters:

- > `wasMintError` Emitted when wasMint encounters an error.
- > `wasMintInfo` Emitted for purely informational and debug output.
- > `wasMintWASMLoaded` Emitted when the WASM file has been loaded.
- > `wasMintWASMConfigured` Emitted when wasMint successfully configured a Module.

### Errors

wasMint throws the following errors:

#### Malloc & Free

- > `free(ptr) := Cannot free *0!` when an attempt to call `free(ptr)` with ptr := 0 is detected.
- > `malloc(size) := Cannot allocate 0 bytes!` when an attempt to call `malloc(size)` with size := 0 is detected.
- > `malloc(size) := Not enough memory!` when an attempt to call `malloc(size)` with a size greater than the maximum available memory is detected.

#### Function calls

- > `Invalid parameter count of <count> for <function>` when an attempt to call a wasMint configured function with either too little or too many parameters is detected.
- > `Invalid parameter type of <supplied_type> instead of <expected_type> at <paramater_index> for <function>` when an attempt to supply the parameters for a wasMint configured function with a wrong data type.
- > `Invalid return type configuration of <supplied_type> instead of <expected_type> for <function>` when a wasMint configured function returns a type that it was not configured for.

### C Counterpart

wasMint comes with a C header file, `wasMint.h` which contains basic necessary function definitions, implementations, defines, typedefs etc for wasMint to run without nuking itself.

### Building

#### Windows

> Execute `activate_emcc.bat` which executes emsdk's `emsdk_env.bat` which should be in `..\emsdk`
> Execute `build.ps1`

#### Linux systems

> Time to wait since I have not yet done anything to make this shebang run on linux systems, however it should be very easy for you to port the build scripts and optain a linux version of emsdk.

### "You're my heart, you're my soul, brother func-tion-config-uration"

#### The function configuration in-depth

##### Valid configuration datatypes listing:

| Data Type           | Return Behaviour                                                          |
| ------------------- | ------------------------------------------------------------------------- |
| `String`            | ptr/val -> JSString                                                       |
| `Number`            | ptr/val -> JSNumber                                                       |
| `BigInt`            | ptr/val -> JSBigInt                                                       |
| `Int8Array`         | ptr/val -> JSInt8Array                                                    |
| `Uint8Array`        | ptr/val -> JSUint8Array                                                   |
| `Int16Array`        | ptr/val -> JSInt16Array                                                   |
| `Uint16Array`       | ptr/val -> JSUint16Array                                                  |
| `Uint8ClampedArray` | ptr/val -> JSUint8ClampedArray                                            |
| `Int32Array`        | ptr/val -> JSInt32Array                                                   |
| `Uint32Array`       | ptr/val -> JSUint32Array                                                  |
| `Float32Array`      | ptr/val -> JSFloat32Array                                                 |
| `Float64Array`      | ptr/val -> JSFloat64Array                                                 |
| `BigInt64Array`     | ptr/val -> JSBigInt64Array                                                |
| `BigUint64Array`    | ptr/val -> JSBigUint64Array                                               |
| `Undefined`         | ptr/val -> return JSUndefined (Normal return behaviour)                   |
| `Void`              | ptr/val -> return; (Returns nothing and must be paired with `"length":0`) |

##### Figure 1

```json
"_wasMint_print": {
    "params": ["String"],
    "return": {
      "type": "Void",
      "length": 0
    },
    "showCallback": false
  }
```

> This function accepts 1 String as its argument and returns Void.
> No callback function is going to be executed when this function is called.

##### Figure 2

```json
  "_wasMint_arrayIOTest": {
    "params": ["Float32Array", "Number"],
    "return": {
      "type": "Float32Array",
      "length": "A1"
    },
    "showCallback": false
  }
```

> This function takes 1 array of 32-bit floating point numbers (Plainly "Number"s in JS) and 1 additional Number argument.
> All is looking normal so far until we have a look at the "return" object.
> Obviously we cannot always know the length of a returned Array for sure, and as such wasMint implements _argument configurable return lengths_.
> In this case `"length": "A1"` stands for _The length of the returned value shall be the same as Argument1 (A1)_, so in this case the additional Number argument.

##### Figure 3

```json
  "_wasMint_arrayXOR": {
    "params": ["Uint32Array", "Number", "Uint32Array", "Number"],
    "return": {
      "type": "Uint32Array",
      "length": "J A1 < A3 ? A1 : A3"
    },
    "showCallback": false
  }
```

> Let's skip over the params and have a direct look at the "return" object again.
> This time we can see a _J_ followed by the previously mentioned _Argument Identifiers_ forming a _ternary expression_.
> Let's go over it:
> `J` denotes that the return lenght of this function shall be determined by evaluating a _very limited JavsScript expression_.
> `AI < A3 ? A1 : A3` denotes that if _Argument 1_ is less than _Argument 3_, _Argument 1_ shall be the return length, otherwise it shall be _Argument 3_.

As a matter of fact, wasMint implements similar behaviour when the `J` is replaced by a `M`, which then denotes that the return length of this function shall be determined by a mathematical expression.
