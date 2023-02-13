#include <stdarg.h>
#include <stdint.h>
#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <xmmintrin.h>
#include <wasm_simd128.h>
//#include <pthread.h>

#define FMT_MAX_CHARS 256

typedef char wmByte;
typedef char* wmBytea;
typedef const char* wmString;
typedef uint64_t wmBigInt;

typedef void* wmRawPointer;

typedef void(*init_func_t)(void);

#define MODULE_INIT(init_func) \
WASMINT_EXPORT void WMINIT(init_func_t* init_func) { \
    wmString startup_message = "wasMint Initialized!"; \
    _wasMint_print(startup_message); \
    (*init_func)(); \
    return;\
} \


#define WASMINT_EXPORT __attribute__((used))
#define WASMINT_IMPORT extern __attribute__((unused))
#define WASMINT_STRUCT __attribute__((packed))
#define WMENTRY WASMINT_EXPORT void WMINIT

#define __fl4size 4 * sizeof(float)

//Begin wasMint export declarations
WASMINT_EXPORT wmBytea _wasMint_fmt(wmString fmt, ...);
WASMINT_EXPORT void _wasMint_print(wmString str);

//Begin wasMint import declarations
WASMINT_IMPORT void _wasMint_js_print(wmString ptr, int len);

//IPC Channel
WASMINT_EXPORT wmByte ipc[8];

wmBytea _wasMint_fmt(wmString fmt, ...) {
    size_t base_len = (strlen(fmt) + FMT_MAX_CHARS) + 1;
    wmBytea buf = (wmBytea) malloc(base_len);
    va_list args;
    
    va_start(args, fmt);
    
    vsnprintf(buf, base_len, fmt, args);
    va_end(args);
    
    return buf;
}

int wmStrlen(const char *s)
{
	const char *a = s;
	for (; *s; s++);
	return s-a;
}

WASMINT_EXPORT void _wasMint_print(wmString str) {
    size_t len = wmStrlen(str);

    if(len > FMT_MAX_CHARS) {
            return;
    } else {
        wmBytea buf = (wmBytea) malloc(len + 1);
        
        strncpy(buf, str, len);
        _wasMint_js_print(str, len);
    }
}
