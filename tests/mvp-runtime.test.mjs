import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 4185;
const cwd = new URL("../mvp/", import.meta.url);
const child = spawn("pnpm", ["run", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd,
  env: { ...process.env, OPENAI_API_KEY: "invalid-test-key" },
  stdio: ["ignore", "pipe", "pipe"]
});

let logs = "";
child.stdout.on("data", chunk => { logs += chunk.toString(); });
child.stderr.on("data", chunk => { logs += chunk.toString(); });

try {
  await waitForServer(`http://127.0.0.1:${port}`);

  const page = await fetch(`http://127.0.0.1:${port}`);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /GymPlate/);

  const parseStarted = Date.now();
  const api = await fetch(`http://127.0.0.1:${port}/api/parse-meal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "午餐500克米饭150克鸡胸肉", slot: "lunch" })
  });
  assert.equal(api.status, 200);
  const payload = await api.json();
  assert(Date.now() - parseStarted < 8000, "meal parser should not hang when AI parsing is unavailable");
  assert.equal(payload.source, "rules-fallback");
  const rice = payload.meals.find(item => item.foodName === "米饭");
  const chicken = payload.meals.find(item => item.foodName === "鸡胸肉");
  assert.equal(rice.grams, 500);
  assert.equal(rice.carbs, 129.5);
  assert.equal(chicken.grams, 150);
  assert.equal(chicken.protein, 36.9);

  const search = await fetch(`http://127.0.0.1:${port}/api/search-food?q=${encodeURIComponent("米饭")}`);
  assert.equal(search.status, 200);
  const searchPayload = await search.json();
  assert.equal(searchPayload.foods.some(item => item.name.includes("米饭")), true);

  const exerciseSearch = await fetch(`http://127.0.0.1:${port}/api/search-exercise?q=${encodeURIComponent("背")}`);
  assert.equal(exerciseSearch.status, 200);
  const exercisePayload = await exerciseSearch.json();
  assert.equal(exercisePayload.exercises.some(item => item.media?.gif), true);

  console.log("mvp runtime checks passed");
} finally {
  child.kill("SIGTERM");
}

async function waitForServer(url) {
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (child.exitCode !== null) throw new Error(`dev server exited early:\n${logs}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw new Error(`dev server did not start:\n${logs}`);
}
