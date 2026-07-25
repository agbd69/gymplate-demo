import type { DailyRecord, ExercisePlan, MealTemplate, PlanSettings, Profile } from "./types";
import { parseMealText } from "./nutrition";
import { makeWeeklyPlan } from "./planner.mjs";

export const defaultProfile: Profile = {
  sex: "male",
  age: 30,
  heightCm: 178,
  weightKg: 76,
  goal: "cut",
  trainingDays: 4
};

export const defaultPlanSettings: PlanSettings = {
  exerciseCount: 4,
  setsPerExercise: 3,
  trainingWeekdays: [1, 3, 5, 6]
};

export function defaultTemplates(): MealTemplate[] {
  return [
    { id: "tpl-breakfast", slot: "breakfast", name: "鸡蛋牛奶早餐", isDefault: false, entries: parseMealText("早餐两个鸡蛋一杯牛奶", "breakfast") },
    { id: "tpl-lunch", slot: "lunch", name: "米饭鸡胸午餐", isDefault: false, entries: parseMealText("午餐250克米饭150克鸡胸肉", "lunch") },
    { id: "tpl-snack", slot: "snack", name: "训练后加餐", isDefault: false, entries: parseMealText("训练后30克蛋白粉一根香蕉", "snack") }
  ];
}

export function defaultExercises(): ExercisePlan[] {
  return makeWeeklyPlan(defaultProfile, defaultPlanSettings)
    .find(day => day.type === "training")?.exercises ?? [];
}

export function defaultRecord(): DailyRecord {
  return {
    date: new Date().toISOString().slice(0, 10),
    meals: [],
    exercises: defaultExercises(),
    weightKg: defaultProfile.weightKg,
    steps: 8000,
    sleepHours: 7,
    mood: "正常"
  };
}
