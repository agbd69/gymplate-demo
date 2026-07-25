import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

const [pkg, schema, seed, page, storage, auth, nutrition, types] = await Promise.all([
  read("mvp/package.json"),
  read("mvp/supabase/schema.sql"),
  read("mvp/supabase/seed-open-data.sql"),
  read("mvp/app/page.tsx"),
  read("mvp/lib/app-storage.ts"),
  read("mvp/lib/auth.ts"),
  read("mvp/lib/nutrition.ts"),
  read("mvp/lib/types.ts")
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
assert(page.includes("loadStoredState"), "page should load through the storage adapter");
assert(page.includes("saveStoredState"), "page should save through the storage adapter");
assert(page.includes("sync-pill"), "page should tell users whether data is local or cloud-synced");
assert(page.includes("auth-strip"), "page should include an auth entry point");
assert(page.includes("sendMagicLink"), "page should let users request an email login link");
assert(page.includes("signOut"), "page should let signed-in users sign out");
assert(page.includes('fetch("/api/parse-meal"'), "meal parsing should go through the API route before falling back");
assert(page.includes("保存这一餐为常用餐"), "food page should let users save repeated meals");
assert(page.includes("addSet("), "training page should support adding sets");
assert(page.includes("deleteSet("), "training page should support deleting sets");
assert(page.includes("身体日志"), "data page should include editable body log inputs");
assert(page.includes("EditableMealRow"), "meal macros should be editable by the user");

assert(types.includes("ExercisePlan"), "training data should model exercises with nested sets");
assert(nutrition.includes('source: "manual"'), "unknown foods should not get fake random nutrition values");
assert(!nutrition.includes("calories: 450"), "unknown foods should not default to a misleading 450 kcal estimate");

const route = await read("mvp/app/api/parse-meal/route.ts");
assert(route.includes("normalizeMeals"), "parse API should normalize OpenAI output");
assert(route.includes("crypto.randomUUID()"), "parse API should attach stable ids for rendered meal rows");
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

console.log("mvp-structure tests passed");
