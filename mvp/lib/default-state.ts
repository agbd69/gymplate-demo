import type { DailyRecord, ExercisePlan, MealTemplate, Profile } from "./types";
import { parseMealText } from "./nutrition";

export const defaultProfile: Profile = {
  sex: "male",
  age: 30,
  heightCm: 178,
  weightKg: 76,
  goal: "cut",
  trainingDays: 4
};

export function defaultTemplates(): MealTemplate[] {
  return [
    { id: "tpl-breakfast", slot: "breakfast", name: "鸡蛋牛奶早餐", isDefault: false, entries: parseMealText("早餐两个鸡蛋一杯牛奶", "breakfast") },
    { id: "tpl-lunch", slot: "lunch", name: "米饭鸡胸午餐", isDefault: false, entries: parseMealText("午餐250克米饭150克鸡胸肉", "lunch") },
    { id: "tpl-snack", slot: "snack", name: "训练后加餐", isDefault: false, entries: parseMealText("训练后30克蛋白粉一根香蕉", "snack") }
  ];
}

export function defaultExercises(): ExercisePlan[] {
  return [
    makeExercise("bench", "杠铃卧推", "胸", 3, 45, 8),
    makeExercise("row", "坐姿划船", "背", 3, 50, 10),
    makeExercise("press", "哑铃肩推", "肩", 3, 18, 10),
    makeExercise("triceps", "绳索下压", "臂", 2, 25, 12)
  ];
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

function makeExercise(id: string, exerciseName: string, muscleGroup: string, setCount: number, weightKg: number, reps: number): ExercisePlan {
  return {
    id,
    exerciseName,
    muscleGroup,
    restSeconds: 90,
    sets: Array.from({ length: setCount }, (_, index) => ({
      id: `${id}-${index + 1}`,
      exerciseId: id,
      exerciseName,
      muscleGroup,
      setIndex: index + 1,
      weightKg,
      reps,
      completed: false
    }))
  };
}
