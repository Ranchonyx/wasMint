#include <stdarg.h>
#include <stdint.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>
#include <xmmintrin.h>
#include <wasm_simd128.h>
#include "wasMint.h"

WASMINT_IMPORT void _wasMint_js_print(wasMint_string ptr, int len);

byte* _wasMint_fmt(wasMint_string fmt, ...) {
    size_t base_len = (strlen(fmt) + 0xFF) + 1;
    byte* buf = (byte*) malloc(base_len);
    va_list args;
    
    va_start(args, fmt);
    
    vsnprintf(buf, base_len, fmt, args);
    va_end(args);
    
    return buf;
}

WASMINT_EXPORT void _wasMint_print(wasMint_string str) {
    size_t len = strlen(str);
    byte* buf = (byte*) malloc(len + 1);
    
    strncpy(buf, str, len);
    _wasMint_js_print(str, len);
}

//SIMD Stuff: <param_count>x<type>x<return_count>_<operation>
WASMINT_EXPORT float* _wasMint_8xf32x4_add(float a, float b, float c, float d, float e, float f, float g, float h) {
    __m128 v1 = wasm_f32x4_make(a, b, c, d);
    __m128 v2 = wasm_f32x4_make(e, f, g, h);
    __m128 v3 = wasm_f32x4_add(v1, v2);

    float* s = (float*) malloc(__fl4size);

    memcpy(s, (float*)&v3, __fl4size);

    return s;
}

WASMINT_EXPORT float* _wasMint_8xf32x4_sub(float a, float b, float c, float d, float e, float f, float g, float h) {
    __m128 v1 = wasm_f32x4_make(a, b, c, d);
    __m128 v2 = wasm_f32x4_make(e, f, g, h);
    __m128 v3 = wasm_f32x4_sub(v1, v2);

    float* s = (float*) malloc(__fl4size);

    memcpy(s, (float*)&v3, __fl4size);

    return s;
}

WASMINT_EXPORT float* _wasMint_8xf32x4_div(float a, float b, float c, float d, float e, float f, float g, float h) {
    __m128 v1 = wasm_f32x4_make(a, b, c, d);
    __m128 v2 = wasm_f32x4_make(e, f, g, h);
    __m128 v3 = wasm_f32x4_div(v1, v2);

    float* s = (float*) malloc(__fl4size);

    memcpy(s, (float*)&v3, __fl4size);

    return s;
}

WASMINT_EXPORT float* _wasMint_8xf32x4_mul(float a, float b, float c, float d, float e, float f, float g, float h) {
    __m128 v1 = wasm_f32x4_make(a, b, c, d);
    __m128 v2 = wasm_f32x4_make(e, f, g, h);
    __m128 v3 = wasm_f32x4_mul(v1, v2);

    float* s = (float*) malloc(__fl4size);

    memcpy(s, (float*)&v3, __fl4size);

    return s;
}

WASMINT_EXPORT float* _wasMint_arrayIOTest(float* a, size_t len) {
    float* b = (float*) malloc(len * sizeof(float));
    for(size_t i = 0; i < len; i++) {
        b[i] = a[i] * 2;
    }
    return b;
}

WASMINT_EXPORT uint32_t* _wasMint_arrayXOR(uint32_t* a, size_t alen, uint32_t* b, size_t blen) {
    size_t retlen = alen > blen ? blen : alen;
    uint32_t* c = (uint32_t*) malloc(retlen * sizeof(uint32_t));
    for(size_t i = 0; i < retlen; i++) {
        c[i] = a[i] ^ b[i];
    }
    return c;
}

WASMINT_EXPORT int main() {
    wasMint_string startup_message = "wasMint Initialized!";
    _wasMint_js_print(startup_message, strlen(startup_message));

    return 0;
}