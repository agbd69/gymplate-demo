import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { normalizeExercise, normalizeFood } from "../open-data.mjs";

const root = path.resolve(import.meta.dirname, "..");
const dataDir = path.join(root, "data");
const defaultFoodDir = "/tmp/gymplate-data-sources/china-food-composition-data/json_data_vision_251206_Qwen2-5-VL-72B-Instruct";
const exerciseUrl = "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json";

function usageError(message) {
  console.error(message);
  console.error("可选环境变量：GYMPLATE_FOOD_DIR=/path/to/json_data_vision_251206_Qwen2-5-VL-72B-Instruct");
  console.error("可选环境变量：GYMPLATE_EXERCISES_JSON=/path/to/exercises.json");
  process.exit(1);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

async function loadExercises() {
  if (process.env.GYMPLATE_EXERCISES_JSON) {
    return readJson(process.env.GYMPLATE_EXERCISES_JSON);
  }
  const response = await fetch(exerciseUrl);
  if (!response.ok) usageError(`动作库下载失败：${response.status} ${response.statusText}`);
  return response.json();
}

async function loadFoods() {
  const foodDir = process.env.GYMPLATE_FOOD_DIR || defaultFoodDir;
  let files;
  try {
    files = await readdir(foodDir);
  } catch {
    usageError(`找不到食物库目录：${foodDir}`);
  }
  const jsonFiles = files.filter(file => file.endsWith(".json") && file.startsWith("merged_"));
  const foods = [];
  for (const file of jsonFiles) {
    const category = file.replace(/^merged_/, "").replace(/\.json$/, "");
    const rows = await readJson(path.join(foodDir, file));
    for (const row of rows) {
      const food = normalizeFood(row, category);
      if (food) foods.push(food);
    }
  }
  return foods.sort((a, b) => a.name.localeCompare(b.name, "zh-Hans-CN"));
}

function rankExercise(exercise) {
  const partOrder = ["胸", "背", "腿", "肩", "臂", "核心"];
  const equipmentScore = ["哑铃", "杠铃", "绳索", "器械", "自重"].includes(exercise.equipment) ? 0 : 1;
  const guideScore = exercise.guide ? 0 : 2;
  return partOrder.indexOf(exercise.part) * 1000 + equipmentScore * 100 + guideScore * 10 + exercise.name.length;
}

function pickBalancedExercises(rawExercises) {
  const normalized = rawExercises
    .map(normalizeExercise)
    .filter(exercise => ["胸", "背", "腿", "肩", "臂", "核心"].includes(exercise.part))
    .filter(exercise => exercise.guide || exercise.steps.length);
  const byPart = new Map();
  for (const exercise of normalized.sort((a, b) => rankExercise(a) - rankExercise(b))) {
    if (!byPart.has(exercise.part)) byPart.set(exercise.part, []);
    const bucket = byPart.get(exercise.part);
    if (bucket.length < 60) bucket.push(exercise);
  }
  return [...byPart.values()].flat().sort((a, b) => a.part.localeCompare(b.part, "zh-Hans-CN") || a.name.localeCompare(b.name));
}

async function writeModule(file, exportName, data) {
  const content = `export const ${exportName} = ${JSON.stringify(data, null, 2)};\n`;
  await writeFile(path.join(dataDir, file), content, "utf8");
}

await mkdir(dataDir, { recursive: true });

const [rawExercises, foods] = await Promise.all([loadExercises(), loadFoods()]);
const exercises = pickBalancedExercises(rawExercises);

await writeModule("exercises.mjs", "exerciseDataset", exercises);
await writeModule("foods.mjs", "foodDataset", foods);

console.log(`导入动作 ${exercises.length} 个，食物 ${foods.length} 个`);
