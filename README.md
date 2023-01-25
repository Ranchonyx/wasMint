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

This example defines a native C/WASM/etc function's structure
The function's identifier/name in this case is `_wasMint_8xf32x4_add`
Its parameters are eight `Number` types.
It returns an array of 32-bit floating point numbers with 4 elements.