import assert from "node:assert/strict";
import { makeFoodEntry, searchFoodCatalog } from "../mvp/lib/food-search.mjs";

const riceResults = searchFoodCatalog("米饭", 8);
assert.equal(riceResults.length > 0, true);
assert.equal(riceResults.some(food => food.name.includes("米饭")), true);
assert.equal(riceResults[0].source.includes("Sanotsu/china-food-composition-data"), true);

const rice = riceResults.find(food => food.name.includes("米饭")) ?? riceResults[0];
const entry = makeFoodEntry(rice, 250, "lunch");
assert.equal(entry.slot, "lunch");
assert.equal(entry.grams, 250);
assert.equal(entry.calories > 250 && entry.calories < 330, true);
assert.equal(entry.carbs > 60 && entry.carbs < 70, true);
assert.equal(entry.source, "food-db");
assert.equal(entry.macroEdited, false);

assert.deepEqual(searchFoodCatalog("", 5), []);

console.log("mvp food search checks passed");
