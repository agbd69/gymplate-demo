import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [pkg, schema, seed, page, layout, manifest, searchRoute, exerciseRoute, storage, auth, planner, history, foodSearch, exerciseSearch, nutrition, types, vercel, deployment] = await Promise.all([
  read("mvp/package.json"),
  read("mvp/supabase/schema.sql"),
  read("mvp/supabase/seed-open-data.sql"),
  read("mvp/app/page.tsx"),
  read("mvp/app/layout.tsx"),
  read("mvp/app/manifest.ts"),
  read("mvp/app/api/search-food/route.ts"),
  read("mvp/app/api/search-exercise/route.ts"),
  read("mvp/lib/app-storage.ts"),
  read("mvp/lib/auth.ts"),
  read("mvp/lib/planner.mjs"),
  read("mvp/lib/history.mjs"),
  read("mvp/lib/food-search.mjs"),
  read("mvp/lib/exercise-search.mjs"),
  read("mvp/lib/nutrition.ts"),
  read("mvp/lib/types.ts"),
  read("mvp/vercel.json"),
  read("mvp/DEPLOYMENT.md")
]);

const packageJson = JSON.parse(pkg);

assert(packageJson.dependencies.next, "MVP should be a Next.js app");
assert(packageJson.dependencies["@supabase/supabase-js"], "MVP should include Supabase client dependency");
assert(packageJson.dependencies["@supabase/ssr"], "MVP should include Supabase SSR dependency");

for (const table of ["food_catalog", "exercise_catalog", "profiles", "daily_records", "meal_templates", "meal_entries", "training_plans", "training_sessions", "training_sets"]) {
  assert(schema.includes(`create table if not exists public.${table}`), `schema should create ${table}`);
  assert(schema.includes(`alter table public.${table} enable row level security`), `${table} should have RLS enabled`);
}

assert(schema.includes("create table if not exists public.app_snapshots"), "schema should create app_snapshots for MVP cloud state");
assert(schema.includes("app snapshots are owned by user"), "app snapshots should be protected by RLS");
assert(schema.includes("food catalog is readable"), "food catalog should be readable by the app");
assert(schema.includes("exercise catalog is readable"), "exercise catalog should be readable by the app");
assert(schema.includes("gif_url text"), "exercise catalog should store GIF URLs");
assert(schema.includes("daily_record_id is not null and template_id is null"), "meal entries should belong to either a day or a template");
assert(schema.includes("auth.uid() = user_id"), "schema should scope user data to auth.uid()");

assert(page.includes('useState<"training" | "food" | "data">'), "page should expose three primary tabs");
assert(page.includes("确认加入今天"), "food entries should require explicit confirmation");
assert(page.includes("addManualPendingMeal"), "food page should support manual pending meal entries");
assert(page.includes("searchCatalog"), "food page should search the food catalog");
assert(page.includes("food-results"), "food page should render catalog search results");
assert(page.includes("foodName"), "meal editor should support editing food names");
assert(page.includes("loadStoredState"), "page should load through the storage adapter");
assert(page.includes("saveStoredState"), "page should save through the storage adapter");
assert(page.includes("sync-pill"), "page should tell users whether data is local or cloud-synced");
assert(page.includes("auth-strip"), "page should include an auth entry point");
assert(page.includes("sendMagicLink"), "page should let users request an email login link");
assert(page.includes("signOut"), "page should let signed-in users sign out");
assert(page.includes('fetch("/api/parse-meal"'), "meal parsing should go through the API route before falling back");
assert(page.includes("createTimeoutSignal"), "meal parsing should time out instead of locking the input");
assert(page.includes("保存这一餐为常用餐"), "food page should let users save repeated meals");
assert(page.includes("生成今日默认餐盘"), "food page should apply repeated meals as a daily default plate");
assert(page.includes("applyDailyMealDefaults"), "food page should have one action that fills today's meals from templates");
assert(page.includes("templateApplied"), "daily default plate should be idempotent instead of duplicating meals");
assert(page.includes("deleteTemplate"), "food page should let users delete repeated meals");
assert(page.includes("editingTemplateId"), "food page should let users open a repeated meal editor");
assert(page.includes("updateTemplateEntry"), "food page should let users correct saved meal macros");
assert(page.includes("addManualTemplateEntry"), "food page should let users add foods to saved meal templates");
assert(page.includes("deleteTemplateEntry"), "food page should let users remove foods from saved meal templates");
assert(page.includes("保存常用餐修改"), "food page should expose a clear save action for repeated meal edits");
assert(page.includes("addSet("), "training page should support adding sets");
assert(page.includes("deleteSet("), "training page should support deleting sets");
assert(page.includes("身体日志"), "data page should include editable body log inputs");
assert(page.includes("保存今日到历史"), "data page should let users settle today's record");
assert(page.includes("保存并开启下一天"), "data page should support starting the next daily record");
assert(page.includes('type="date"'), "data page should let users choose the active record date");
assert(page.includes("restoreHistory"), "data page should let users revisit a saved day");
assert(page.includes("trendFromHistory"), "data page should render trends from saved history");
assert(page.includes("history-list"), "data page should show recent history records");
assert(page.includes("基础设置"), "data page should include profile setup controls");
assert(page.includes("计划生成器"), "training page should include a plan generator");
assert(page.includes("makeWeeklyPlan"), "page should generate weekly training plans from profile settings");
assert(page.includes("exercise-guide"), "training cards should show exercise guidance");
assert(page.includes("动作演示"), "training cards should render GIF demos with useful alt text");
assert(page.includes("searchExercises"), "training page should search the exercise catalog");
assert(page.includes("exercise-results"), "training page should render exercise search results");
assert(page.includes("EditableMealRow"), "meal macros should be editable by the user");

assert(types.includes("ExercisePlan"), "training data should model exercises with nested sets");
assert(types.includes("PlanSettings"), "training preferences should be persisted as plan settings");
assert(planner.includes("makeProfileMetrics"), "planner should compute BMI, BMR, and macro targets");
assert(planner.includes("makeWeeklyPlan"), "planner should generate weekly plans");
assert(history.includes("summarizeRecord"), "history helper should summarize daily records");
assert(history.includes("trendFromHistory"), "history helper should create trend series");
assert(foodSearch.includes("foodDataset"), "food search should use the open Chinese food dataset");
assert(searchRoute.includes("searchFoodCatalog"), "search API should expose catalog search");
assert(exerciseSearch.includes("exerciseDataset"), "exercise search should use the open exercise dataset");
assert(exerciseRoute.includes("searchExerciseCatalog"), "exercise API should expose catalog search");
assert(nutrition.includes('source: "manual"'), "unknown foods should not get fake random nutrition values");
assert(!nutrition.includes("calories: 450"), "unknown foods should not default to a misleading 450 kcal estimate");

const route = await read("mvp/app/api/parse-meal/route.ts");
assert(route.includes("normalizeMeals"), "parse API should normalize OpenAI output");
assert(route.includes("crypto.randomUUID()"), "parse API should attach stable ids for rendered meal rows");
assert(route.includes("AbortSignal.timeout"), "parse API should not wait indefinitely for OpenAI");
assert(storage.includes("createOptionalClient"), "storage adapter should use Supabase when configured");
assert(storage.includes(".from(\"app_snapshots\")"), "storage adapter should sync app snapshots to Supabase");
assert(storage.includes("window.localStorage.setItem"), "storage adapter should preserve local fallback persistence");
assert(auth.includes("signInWithOtp"), "auth helper should support email magic link login");
assert(auth.includes("onAuthStateChange"), "auth helper should react to login/logout changes");
assert(seed.includes("insert into public.food_catalog"), "seed should insert foods into Supabase");
assert(seed.includes("insert into public.exercise_catalog"), "seed should insert exercises into Supabase");
assert(seed.includes("Sanotsu/china-food-composition-data"), "seed should preserve the Chinese food source");
assert(seed.includes("hasaneyldrm/exercises-dataset"), "seed should preserve the exercise source");
assert(seed.includes(".gif"), "seed should contain exercise GIF URLs");
assert(vercel.includes('"framework": "nextjs"'), "Vercel config should target Next.js");
assert(vercel.includes("pnpm run build"), "Vercel config should build the MVP");
assert(deployment.includes("Root Directory: `mvp`"), "deployment docs should explain the Vercel root directory");
assert(deployment.includes("Supabase Auth"), "deployment docs should explain auth redirect setup");
assert(layout.includes("appleWebApp"), "layout metadata should support adding the MVP to iOS home screen");
assert(layout.includes("themeColor"), "layout should define a mobile browser theme color");
assert(manifest.includes("display: \"standalone\""), "manifest should make the MVP installable");
assert(manifest.includes("GymPlate"), "manifest should use the product name");

console.log("mvp-structure tests passed");
