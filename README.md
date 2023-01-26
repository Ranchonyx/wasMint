# wasMint

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
    ...
  }
```

This example defines a native C/WASM/etc function's structure.
The function's identifier/name in this case is `_wasMint_8xf32x4_add`.
Its parameters are eight `Number` types.
It returns an `array of 32-bit floating point numbers with 4 elements`.

Since accessing and correctly interpreting/working with WASM's underlying memory area can be a major source of pain, anxiety and reason for alcohol abuse, wasMint automatically converts WASM's returned pointers and values et cetera to their JavaScript counterparts by utilising this function configuration.
As a matter of fact, this format is somewhat inspired by Emscripten's `ccall` syntax for calling native/WASM functions.

When exporting the `main` function from the WASM source code, wasMint will automatically assign this function to be the respective module's init function, it can be compared to the _Arduino IDE's_ `void setup()` function and is only able to be ran once.

## Usage

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

## Events
wasMint emits the following events, further details about the event can be found in the event's detail parameters:
- > `wasMintError` Emitted when wasMint encounters an error.
- > `wasMintInfo` Emitted for purely informational and debug output.
- > `wasMintWASMLoaded` Emitted when the WASM file has been loaded.
- > `wasMintWASMConfigured` Emitted when wasMint successfully configured a Module.

## Errors
wasMint throws the following errors:
### Malloc & Free
- > `free(ptr) := Cannot free *0!` when an attempt to call `free(ptr)` with ptr := 0 is detected.
- > `malloc(size) := Cannot allocate 0 bytes!` when an attempt to call `malloc(size)` with size := 0 is detected.
- > `malloc(size) := Not enough memory!` when an attempt to call `malloc(size)` with a size greater than the maximum available memory is detected.
### Function calls
- > `Invalid parameter count of <count> for <function>` when an attempt to call a wasMint configured function with either too little or too many parameters is detected.
- > `Invalid parameter type of <supplied_type> instead of <expected_type> at <paramater_index> for <function>` when an attempt to supply the parameters for a wasMint configured function with a wrong data type.
- > `Invalid return type configuration of <supplied_type> instead of <expected_type> for <function>` when a wasMint configured functions returns a type that it was not configured for.

## C Counterpart
wasMint comes with a C header file, `wasMint.h` which contains basic necessary function definitions, implementations, defines, typedefs etc for wasMint to run without nuking itself.

## Building
### Windows
> Execute `activate_emcc.bat` which executes emsdk's `emsdk_env.bat` which should be in `..\emsdk`
> Execute `build.ps1`

### Linux systems
> Time to wait since I have not yet done anything to make this shebang run on linux systems, however it should be very easy for you to port the build scripts and optain a linux version of emsdk.
