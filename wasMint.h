#include <stdint.h>
typedef char byte;
typedef char* wasMint_bytearray;
typedef const wasMint_bytearray wasMint_string;
typedef uint64_t wasMint_bigint;

#define __fl4size 4 * sizeof(float)
#define WASMINT_EXPORT __attribute__((used))
#define WASMINT_IMPORT extern __attribute__((unused))