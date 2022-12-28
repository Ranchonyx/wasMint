//IformatOptions = number, array, string, pointer
//OformatOptions = IformatOptions

var functionConfig = {
    "_wasMint_8xf32x4_div": {
        params: ["number", "number", "number", "number", "number", "number", "number", "number"],
        ret: ["Float32Array", 4]
    }
};

var functions = {

};

var properties = {

};

function configureFunctions(exports) {
    Object.entries(this.exports).forEach(
        element => typeof element[1] === "function" ? this.functions[element[0]] = element[1] : this.properties[element[0]] = element[1]
    );


}