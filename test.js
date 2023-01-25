function hashObj(obj) {
    //Die of death
    if (!(typeof obj === "object")) {
        return obj;
    }

    return Object.values(obj)
        .map(e => Object.values(e)
            .map(e => Object.values(e)
                .map(e => e.toString())))
        .flat(Infinity).join("").split("")
        .map(e => e.charCodeAt(0))
        .reduce((acc, v) => acc += v).toString(16)
}

let cfg = {
    "_wasMint_8xf32x4_add": {
        params: ["Number", "Number", "Number", "Number", "Number", "Number", "Number", "Number"],
        return: {
            type: "Float32Array",
            length: 4
        },
        callback: (args) => console.log(args)
    },
    "_wasMint_8xf32x4_sub": {
        params: ["Number", "Number", "Number", "Number", "Number", "Number", "Number", "Number"],
        return: {
            type: "Float32Array",
            length: 4
        },
        callback: (args) => console.log(args)
    },
    "_wasMint_8xf32x4_mul": {
        params: ["Number", "Number", "Number", "Number", "Number", "Number", "Number", "Number"],
        return: {
            type: "Float32Array",
            length: 4
        },
        callback: (args) => console.log(args)
    },
    "_wasMint_8xf32x4_div": {
        params: ["Number", "Number", "Number", "Number", "Number", "Number", "Number", "Number"],
        return: {
            type: "Float32Array",
            length: 4
        },
        callback: (args) => console.log(args)
    },
    "_wasMint_print": {
        params: ["String"],
        return: {
            type: "Void",
            length: 0
        },
        callback: (args) => console.log(args)
    },
    "_wasMint_arrayIOTest": {
        params: ["Float32Array", "Number"],
        return: {
            type: "Float32Array",
            length: "A1"
        },
        callback: (args) => console.log(args)
    }
};


console.log(hashObj(cfg))