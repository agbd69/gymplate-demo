import assert from "node:assert/strict";
import { makeProfileMetrics, makeWeeklyPlan } from "../mvp/lib/planner.mjs";

const cutProfile = {
  sex: "male",
  age: 30,
  heightCm: 178,
  weightKg: 76,
  goal: "cut",
  trainingDays: 3
};

const metrics = makeProfileMetrics(cutProfile);
assert.equal(metrics.bmi, 24);
assert.equal(metrics.bmr, 1728);
assert.equal(metrics.calories > 2000 && metrics.calories < 2300, true);
assert.equal(metrics.protein, 152);
assert.equal(metrics.fat, 61);
assert.equal(metrics.carbs >= 250 && metrics.carbs < 310, true);

const week = makeWeeklyPlan(cutProfile, { exerciseCount: 6, setsPerExercise: 4 });
assert.equal(week.length, 7);
assert.deepEqual(week.filter(day => day.type === "training").map(day => day.weekday), [1, 3, 5]);
assert.equal(week.find(day => day.weekday === 1).exercises.length, 6);
assert.equal(week.find(day => day.weekday === 1).exercises.every(exercise => exercise.sets.length === 4), true);
assert.equal(week.find(day => day.weekday === 2).type, "rest");
assert.equal(week.find(day => day.weekday === 1).exercises.some(exercise => exercise.muscleGroup === "胸"), true);
assert.equal(week.find(day => day.weekday === 1).exercises.some(exercise => exercise.muscleGroup === "背"), true);

const fourDayWeek = makeWeeklyPlan({ ...cutProfile, trainingDays: 4 }, { exerciseCount: 4, setsPerExercise: 3 });
assert.deepEqual(fourDayWeek.filter(day => day.type === "training").map(day => day.weekday), [1, 2, 4, 6]);

console.log("mvp planner checks passed");
