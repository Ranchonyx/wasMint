var hashTab = [];
var idTab = [];

const hash = (obj) =>
  obj
    .toString()
    .split("")
    .map((e) => e.charCodeAt(0))
    .reduce((acc, v, i, arr) => (acc += (v % arr[i - 1]) * (i * (acc ^ v))))
    .toString(16);
function dec2hex(dec) {
  return dec.toString(16).padStart(2, "0");
}

// generateId :: Integer -> String
function generateId(len) {
  var arr = new Uint8Array((len || 40) / 2);
  require("node:crypto").getRandomValues(arr);
  return Array.from(arr, dec2hex).join("");
}

begin = performance.now();
for (let i = 0; i < 1000000; i++) {
  let data = generateId(16);
  let e = hash(data);
  process.stdout.on("resize", () => {
    process.stdout.cursorTo(0)
    process.stdout.clearLine(0)
  })
  process.stdout.write(`i: ${i}\t\td: ${data}\t\th: ${e}\t\thashTabSz: ${hashTab.length}`);

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
    console.log("Hash collided at ", (performance.now() - begin) / 1000)
    break;
  }
  process.stdout.cursorTo(0)
}
console.log("End at ", (performance.now() - begin) / 1000)