globalThis.hashObj = (obj) => {
  //Die of death
  if (!(typeof obj === "object")) {
    return obj;
  }

  return Object.entries(obj)
    .flat(Infinity)
    .map((e) => e.toString())
    .join("")
    .split("")
    .map((e) => e.charCodeAt(0))
    .reduce((acc, v) => (acc += v))
    .toString(16);
};
