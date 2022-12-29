//Parameter Types: "number", "string", "char", ""

functionConfig = {
    "_wasMint_8xf32x4_div": {
        params: ["number", "number", "number", "number", "number", "number", "number", "number"],
        return: {
          type: "Float32Array",
          length: 4
        }
    }
};

configuredFunctions = {
  
};

tmpFunctions = {
};

properties = {
};

Object.entries(Module.exports).forEach(
    element => typeof element[1] === "function" ? tmpFunctions[element[0]] = element[1] : properties[element[0]] = element[1]
);

//Assign metadata to functions
for(funKey in tmpFunctions) {
  if(Object.keys(functionConfig).includes(funKey)) {
    configuredFunctions[funKey] = functionConfig[funKey];
    configuredFunctions[funKey]._function = tmpFunctions[funKey];
  }
}

for(funKey in configuredFunctions) {
  console.log(configuredFunctions[funKey]);
  configuredFunctions[funKey].call = (...args) => {
		if(args.length < 0 ||
        args.length > configuredFunctions[funKey].params.length ||
        args.length < configuredFunctions[funKey].params.length) {
			throw new Error(`Invalid parameter count of ${args.length} for ${funKey}`);
			return NaN;
        }
		
    for(let i = 0; i < configuredFunctions[funKey].params.length; i++) {
      if(configuredFunctions[funKey].params[i] !== typeof args[i]) {
            throw new Error(`Invalid parameter type of ${typeof args[i]} instead of ${configuredFunctions[funKey].params[i]} at ${i} for ${funKey}`);
            return NaN;
        }
    }
    
    let primaryResult = configuredFunctions[funKey]._function(args);
    let convertResult = (ptr, len=1) => {
        switch (configuredFunctions[funKey].return.type) {
            case "char":
                return String.fromCharCode(ptr);
            case "number":
                return ptr;
            case "string":
                return wasMintPtrToString(ptr, len);
                break;
            case "Int8Array":
                return new Int8Array(this.memory.buffer.slice(ptr, ptr+(len * 1)));
                break;
            case "Uint8Array":
                return new Uint8Array(this.memory.buffer.slice(ptr, ptr+(len * 1)))
                break;
            case "Uint8ClampedArray":
                return new Uint8ClampedArray(this.memory.buffer.slice(ptr, ptr+(len * 1)));
                break;
            case "Int16Array":
                return new Int16Array(this.memory.buffer.slice(ptr, ptr+(len * 2)));
                break;
            case "UInt16Array":
                return new Uint16Array(this.memory.buffer.slice(ptr, ptr+(len * 2)));
                break;
            case "Int32Array":
                return new Int32Array(this.memory.buffer.slice(ptr, ptr+(len * 4)));
                break;
            case "Uint32Array":
                return new Uint32Array(this.memory.buffer.slice(ptr, ptr+(len * 4)));
                break;
            case "Float32Array":
                return new Float32Array(this.memory.buffer.slice(ptr, ptr+(len * 4)));
                break;
            case "Float64Array":
                return new Float64Array(this.memory.buffer.slice(ptr, ptr+(len * 8)))
                break;
            case "BigInt64Array":
                return new BigInt64Array(this.memory.buffer.slice(ptr, ptr+(len * 8)));
                break;
            case "BigUint64Array":
                return new BigUint64Array(this.memory.buffer.slice(ptr, ptr+(len * 8)));
            default:
                return ptr;
                break;
        }
    }
    let finalResult = convertResult(primaryResult, configuredFunctions[funKey].return.length);
    if(configuredFunctions[funKey].return.type !== typeof finalResult) {
        throw new Error(`Invalid return type configuration of ${typeof finalResult} instead of ${configuredFunctions[funKey].return.type} for ${funKey}`);
        return NaN;
    }
    return finalResult;
  }  
}
