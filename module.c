#include "./wasMint/wasMint.h"

#define WIDTH 200
#define HEIGHT 200
#define BLOCK WIDTH * HEIGHT

WASMINT_EXPORT wmByte fb[BLOCK];

wmRawPointer fill(wmRawPointer s, wmByte c, uint32_t len) {
    uint8_t* p = s;
    while(len--) {
        *p++ = (wmByte) c;
    }
    return s;
}

WASMINT_EXPORT void next_frame(uint8_t color) {
    fill(fb, color, BLOCK);
    return;
}

WMENTRY() {
    wmString msg = "FB module initialised!";
    _wasMint_print(msg);
    fill(fb, '0', BLOCK);
    return;
}