import assert from "node:assert/strict";
import { addHistoryRecord, summarizeRecord, trendFromHistory } from "../mvp/lib/history.mjs";

const baseRecord = {
  date: "2026-07-20",
  weightKg: 76,
  steps: 8000,
  sleepHours: 7,
  mood: "正常",
  meals: [
    { calories: 580, protein: 13, carbs: 129.5, fat: 1.5 },
    { calories: 177, protein: 36.9, carbs: 0.9, fat: 2.8 }
  ],
  exercises: [
    {
      sets: [
        { weightKg: 50, reps: 8, completed: true },
        { weightKg: 50, reps: 8, completed: true },
        { weightKg: 50, reps: 8, completed: false }
      ]
    }
  ]
};

const summary = summarizeRecord(baseRecord);
assert.equal(summary.date, "2026-07-20");
assert.equal(summary.calories, 757);
assert.equal(summary.protein, 49.9);
assert.equal(summary.carbs, 130.4);
assert.equal(summary.fat, 4.3);
assert.equal(summary.volume, 800);
assert.equal(summary.completedSets, 2);

const history = addHistoryRecord([
  { ...summary, date: "2026-07-19", weightKg: 76.4, calories: 1900, protein: 140, carbs: 210, fat: 55, volume: 6000, completedSets: 12, steps: 7000, sleepHours: 6.5, mood: "一般" }
], baseRecord);
assert.equal(history.length, 2);
assert.equal(history.at(-1).date, "2026-07-20");

const replaced = addHistoryRecord(history, { ...baseRecord, weightKg: 75.8 });
assert.equal(replaced.length, 2);
assert.equal(replaced.at(-1).weightKg, 75.8);

const trend = trendFromHistory(replaced);
assert.equal(trend.weight.at(-1).value, 75.8);
assert.equal(trend.calories.at(-1).value, 757);
assert.equal(trend.volume.at(-1).value, 800);

console.log("mvp history checks passed");
