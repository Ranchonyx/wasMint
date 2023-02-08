var hashTab = [];
var idTab = [];

const __hashOf = (obj) => {
  if(typeof obj === "function") throw new Error("Cannot compute hash sum of function.");
  if(typeof obj === "number" || typeof obj === "bigint" || typeof obj === "boolean" || typeof obj === "undefined" ) return obj;

  let circ = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };

  let sum = Object.entries(obj)
    .flat(Infinity)
    .map(e => JSON.stringify(e, circ()))
    .join("")
    .split("")
    .map((e) => e.charCodeAt(0))
    .reduce((acc, v, i, arr) => (acc += (v * arr[i - 1] % 0xFFFFFFFFFFFFFFFF) * (i + (acc ^ v)))) % 0xFFFFFFFFFFFFFFFF
  return "0x"+`${Math.abs(sum)}`.padStart(16, 0)
};

function dec2hex(dec) {
  return dec.toString(16).padStart(2, "0");
}

// generateId :: Integer -> String
function generateId(len) {
  let arr = new Uint8Array((len || 40) / 2);
  require("crypto").getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
}

process.stdout.on("resize", () => {
  process.stdout.cursorTo(0)
  process.stdout.clearLine(0)
})

let begin = performance.now();
for (let i = 0; i < 1000000; i++) {
  let data = generateId(16);
  let e = __hashOf(data);
  process.stdout.write(`IDX: ${i}\n`);
  process.stdout.write(`DAT: ${data}\n`)
  process.stdout.write(`HSH: ${e}\n`)
  if(!idTab.includes(data)) {
    idTab.push(data);
  } else {
    console.log("ID collision at ", i, e);
    console.log("ID collided at ", (performance.now() - begin) / 1000)
    break;
}
  if (!hashTab.includes(e)) {
    hashTab.push(e);
  } else {
    console.log("Hash collision at ", i, e);
    break;
  }
  process.stdout.cursorTo(0, 1)
}
console.log("End at ", (performance.now() - begin) / 1000)
