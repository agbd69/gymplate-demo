import { foodDataset } from "../data/foods.mjs";

export function searchFoodCatalog(query, limit = 10) {
  const keyword = String(query || "").trim().toLowerCase();
  if (!keyword) return [];
  return foodDataset
    .filter(food => food.name.toLowerCase().includes(keyword) || food.category.toLowerCase().includes(keyword))
    .sort((a, b) => scoreFood(a, keyword) - scoreFood(b, keyword) || a.name.localeCompare(b.name, "zh-Hans-CN"))
    .slice(0, limit);
}

export function makeFoodEntry(food, grams, slot) {
  const amount = Math.max(0, Number(grams) || 0);
  const scale = amount / 100;
  return {
    id: crypto.randomUUID(),
    slot,
    foodName: food.name,
    grams: amount,
    calories: Math.round(food.calories * scale),
    protein: round(food.protein * scale),
    carbs: round(food.carbs * scale),
    fat: round(food.fat * scale),
    source: "food-db",
    macroEdited: false
  };
}

function scoreFood(food, keyword) {
  if (food.name === keyword) return 0;
  if (food.name.startsWith(keyword)) return 1;
  if (food.name.includes(keyword)) return 2;
  return 4;
}

function round(value) {
  return Math.round(value * 10) / 10;
}
