//IformatOptions = number, array, string, pointer
//OformatOptions = IformatOptions

var functionConfig = {
    "_wasMint_8xf32x4_div": {
        params: ["number", "number", "number", "number", "number", "number", "number", "number"],
        ret: ["Float32Array", 4]
    }
};



var properties = {

};

var configuredFunctions = {

};

function configureFunctions(exports) {
    let tmpFunctions = {

    };

    Object.entries(exports).forEach(
        element => typeof element[1] === "function" ? tmpFunctions[element[0]] = element[1] : properties[element[0]] = element[1]
    );

    //Assign metadata to functions
    for(funKey in tmpFunctions) {
        if(Object.keys(functionConfig).includes(funKey)) {
            configureFunctions.funKey = functionConfig[funKey];
            configureFunctions.funKey.call = tmpFunctions[funKey];
        }
    }
}