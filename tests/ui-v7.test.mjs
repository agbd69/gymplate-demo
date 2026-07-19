import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

assert.match(html, /GymPlate/);
assert.match(html, /dashboard\.html/);
assert.match(html, /location\.replace\("dashboard\.html" \+ location\.hash\)/);

console.log("index redirect smoke checks passed");
