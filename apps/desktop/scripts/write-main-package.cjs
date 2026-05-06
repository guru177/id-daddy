const { mkdirSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const dist = join(__dirname, "..", "dist-main");
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, "package.json"), JSON.stringify({ type: "commonjs" }, null, 2));
