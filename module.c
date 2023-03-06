#include "./wasMint/wasMint.h"

#define WIDTH 240
#define HEIGHT 480
#define BLOCK WIDTH * HEIGHT

WASMINT_IMPORT void _wasMint_display_notify(uint32_t bytesWritten);
WASMINT_EXPORT uint32_t fb[BLOCK];

static wmByte* mm_cr0 = (wmByte*)0x00000060;
static uint8_t ctr = 0;
void fill(wmRawPointer s, uint32_t c, uint32_t len) {
    uint32_t* _p = s;
    while(len--) {
        *_p++ = (uint32_t) c;
    }
    return;
}

uint32_t colours[2] = {0xFF0000FF, 0xFFFF0000};

WASMINT_EXPORT void render() {
    while(*mm_cr0 == 0x01) {
        fill(fb, colours[ctr], BLOCK);
        _wasMint_display_notify(BLOCK);
        if(ctr == 0) {
            ctr = 1;
        } else {
            ctr = 0;
        }
    }
    return;
}

WMENTRY() {
    wmString msg = "FB module initialised!";
    _wasMint_print(msg);
    return;
}