# wasMint

#### Requirements:

- Emsdk (Emscripten SDK)
- Python
- A web browser (No shit)
- Any source code editor

## Story

> "I fucking hate emscripten's glue code!" I thought to myself one sunn day at work
> That's it. I'm trying to make my own sort of ... WASM framework/runtime/thing

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
> `wasmPath` denotes the URI/URL/Whatever of the WASM file to load, wasMint uses `fetch()` to load the WASM file.
> `functionConfig` denotes the aforementioned function config as a JSON object.
> `globaliseFunctions` denotes if configured wasMint functions should be available on the `globalThis` Object or exclusively as properties of the containing wasMint module.
> `growMemoryOnAllocWarning` denotes if wasMint should attempt to grow available memory when an internal `malloc(size_t)` call would fail due to not having enough available memory.
> `memory` allows you to supply your own `Webassembly.Memory` object, if not supplied wasMint will use a memory with 16 initial pages and 32 maximum pages.

> `debugPrint(ptr, len)` is oftentimes called as an indicator when a configured wasMint function is called. This behaviour can be toggled by setting the `showCallback` property's value in the `functionConfig` to `false` for the respective function.