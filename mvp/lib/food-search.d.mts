import type { MealEntry, MealSlot } from "./types";

export type CatalogFood = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit: string;
  category: string;
  source: string;
};

export function searchFoodCatalog(query: string, limit?: number): CatalogFood[];
export function makeFoodEntry(food: CatalogFood, grams: number, slot: MealSlot): MealEntry;
