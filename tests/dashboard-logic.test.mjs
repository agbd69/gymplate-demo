import assert from "node:assert/strict";
import { bmi, buildWeekPlan, dailySummary, dateKey, dayState, foodEntry, searchFoods, generateWorkout, makePlan, parseMeal, targets, totals, workoutVolume } from "../dashboard-logic.mjs";

const profile = { sex: "male", age: 30, height: 178, weight: 76, goal: "cut", trainingDays: 4, parts: ["胸", "背", "腿", "肩"] };

assert.equal(bmi(178, 76), 24);

const target = targets(profile);
assert.equal(target.bmi, 24);
assert.equal(target.protein, 152);
assert.equal(target.fat, 61);
assert.equal(target.calories > 1900 && target.calories < 2400, true);

const plan = makePlan(profile);
assert.equal(plan.length, 4);
assert.equal(plan[0].name, "推日");
assert.deepEqual(plan[0].ids, ["bench", "press", "pushdown"]);

const chestBackWorkout = generateWorkout({ parts: ["胸", "背"], goal: "bulk", seed: 2, maxExercises: 4 });
assert.equal(chestBackWorkout.length, 4);
assert.equal(chestBackWorkout.every(exercise => ["胸", "背"].includes(exercise.part)), true);
assert.equal(chestBackWorkout.every(exercise => exercise.practical), true);
assert.equal(chestBackWorkout.every(exercise => /[杠哑绳坐高上]/.test(exercise.name)), true);
assert.equal(chestBackWorkout.some(exercise => exercise.name === "杠铃卧推" || exercise.name === "哑铃卧推"), true);
assert.equal(chestBackWorkout.some(exercise => exercise.name === "坐姿划船" || exercise.name === "高位下拉"), true);
assert.equal(chestBackWorkout.every(exercise => exercise.sets.length === 4), true);
assert.equal(chestBackWorkout.every(exercise => exercise.media?.gif), true);

const meal = parseMeal("午餐吃了150克鸡胸肉和30克乳清蛋白");
assert.equal(meal.calories > 290 && meal.calories < 310, true);
assert.equal(meal.protein > 51 && meal.protein < 53, true);

const riceMeal = parseMeal("500g米饭");
assert.equal(riceMeal.name, "米饭（蒸，代表值） 500g");
assert.equal(riceMeal.calories, 580);
assert.equal(riceMeal.carbs, 129.5);

const spokenMeal = parseMeal("早餐两个鸡蛋，一杯牛奶；中午200克米饭和150克鸡胸肉");
assert.match(spokenMeal.name, /鸡蛋（煮） 100g/);
assert.match(spokenMeal.name, /纯牛奶（代表值，全脂） 250g/);
assert.match(spokenMeal.name, /米饭（蒸，代表值） 200g/);
assert.match(spokenMeal.name, /鸡胸脯肉 150g/);
assert.equal(spokenMeal.carbs > 64 && spokenMeal.carbs < 66, true);

const chickenSearch = searchFoods("鸡", 5);
assert.equal(chickenSearch.length, 5);
assert.equal(chickenSearch.some(food => food.name.includes("鸡")), true);
assert.match(chickenSearch[0].source, /china-food-composition-data/);
const chickenEntry = foodEntry({ name: "鸡（代表值）", calories: 145, protein: 20.3, carbs: 0.9, fat: 6.7, unit: "每100g" }, 200);
assert.equal(chickenEntry.name, "鸡（代表值） 200g");
assert.equal(chickenEntry.calories, 290);
assert.equal(chickenEntry.protein, 40.6);
assert.equal(chickenEntry.carbs, 1.8);
assert.equal(chickenEntry.fat, 13.4);

const day = totals([meal, { name: "香蕉", calories: 105, protein: 1, carbs: 27, fat: 0 }]);
assert.equal(day.calories, meal.calories + 105);
assert.equal(day.protein, Math.round((meal.protein + 1) * 10) / 10);

assert.equal(workoutVolume([{ weight: 26, reps: 9 }, { weight: 26, reps: 8 }]), 442);

const summary = dailySummary({
  date: "2026-07-19",
  checkin: { weight: 75.8, steps: 8200, sleep: 7.2, mood: "不错" },
  meals: [meal],
  target,
  workoutLog: [{ weight: 26, reps: 9 }, { weight: 26, reps: 8 }]
});
assert.equal(summary.date, "2026-07-19");
assert.equal(summary.weight, 75.8);
assert.equal(summary.calories, meal.calories);
assert.equal(summary.calorieGap, target.calories - meal.calories);
assert.equal(summary.proteinGap, target.protein - meal.protein);
assert.equal(summary.volume, 442);
assert.equal(summary.steps, 8200);
assert.equal(summary.sleep, 7.2);

const records = {
  "2026-07-18": { meals: [{ name: "鸡蛋", calories: 144, protein: 12, carbs: 1, fat: 10 }], checkin: { weight: 76.1 } }
};
const today = dayState(records, "2026-07-19", { weight: 75.8 });
assert.equal(today.date, "2026-07-19");
assert.equal(today.meals.length, 0);
assert.equal(today.checkin.weight, 75.8);
assert.equal(dayState(records, "2026-07-18", { weight: 75.8 }).meals[0].name, "鸡蛋");
assert.equal(dateKey(new Date("2026-07-19T10:30:00Z")), "2026-07-19");

const weekPlan = buildWeekPlan(profile, { seed: 3 });
assert.equal(weekPlan.days.length, 7);
assert.equal(weekPlan.days.filter(day => day.type === "training").length, 4);
assert.equal(weekPlan.days[0].workout.every(exercise => exercise.media?.gif), true);
assert.deepEqual(weekPlan.days[0].workout.map(exercise => exercise.id), buildWeekPlan(profile, { seed: 3 }).days[0].workout.map(exercise => exercise.id));

const customWeekPlan = buildWeekPlan({ ...profile, trainingDays: 3 }, {
  seed: 4,
  trainingWeekdays: [1, 3, 5],
  exercisesPerDay: 3,
  setsPerExercise: 5
});
assert.deepEqual(customWeekPlan.days.filter(day => day.type === "training").map(day => day.weekday), [1, 3, 5]);
assert.equal(customWeekPlan.days[0].workout.length, 3);
assert.equal(customWeekPlan.days[0].workout.every(exercise => exercise.sets.length === 5), true);

console.log("dashboard logic checks passed");
