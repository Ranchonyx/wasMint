#include <stdarg.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#define WASMINTEXPORT __attribute__((used))
#define WASMINTIMPORT extern

WASMINTIMPORT void _wasMint_js_print(const char* ptr, int len);

char* _wasMint_fmt(const char* fmt, ...) {
    size_t base_len = (strlen(fmt) + 0xFF) + 1;
    char* buf = (char*) malloc(base_len);
    va_list args;
    va_start(args, fmt);
    vsnprintf(buf, base_len, fmt, args);
    va_end(args);
    return buf;
}

WASMINTEXPORT void _wasMint_print(const char* str) {
    size_t len = strlen(str);
    char* fmt = _wasMint_fmt("[wasMint_WASM] str: %s, len: %i", str, len);
    _wasMint_js_print(fmt, strlen(fmt));
    char* buf = (char*) malloc(len + 1);
    strncpy(buf, str, len);
    _wasMint_js_print(str, len);
}

WASMINTEXPORT int main() {
    char* fmt = _wasMint_fmt("Hello, %s!", "World");
    _wasMint_print(fmt);
    free(fmt);
}