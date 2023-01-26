#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <xmmintrin.h>
#include <wasm_simd128.h>

#define FMT_MAX_CHARS 256

typedef char byte;
typedef char* wasMint_bytearray;
typedef const wasMint_bytearray wasMint_string;
typedef uint64_t wasMint_bigint;

#define __fl4size 4 * sizeof(float)
#define WASMINT_EXPORT __attribute__((used))
#define WASMINT_IMPORT extern __attribute__((unused))

//Begin wasMint export declarations
WASMINT_EXPORT wasMint_bytearray _wasMint_fmt(wasMint_string fmt, ...);
WASMINT_EXPORT void _wasMint_print(wasMint_string str);

//Begin wasMint import declarations
WASMINT_IMPORT void _wasMint_js_print(wasMint_string ptr, int len);

wasMint_bytearray _wasMint_fmt(wasMint_string fmt, ...) {
    size_t base_len = (strlen(fmt) + FMT_MAX_CHARS) + 1;
    wasMint_bytearray buf = (wasMint_bytearray) malloc(base_len);
    va_list args;
    
    va_start(args, fmt);
    
    vsnprintf(buf, base_len, fmt, args);
    va_end(args);
    
    return buf;
}

WASMINT_EXPORT void _wasMint_print(wasMint_string str) {
    size_t len = strlen(str);

    if(len > FMT_MAX_CHARS) {
            return;
    } else {
        wasMint_bytearray buf = (wasMint_bytearray) malloc(len + 1);
        
        strncpy(buf, str, len);
        _wasMint_js_print(str, len);
    }
}
