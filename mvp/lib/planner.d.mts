import type { ExercisePlan, Profile } from "./types";

export type WeeklyPlanDay = {
  weekday: number;
  type: "training" | "rest";
  exercises: ExercisePlan[];
};

export function makeProfileMetrics(profile: Profile): {
  bmi: number;
  bmr: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
};

export function makeWeeklyPlan(profile: Profile, options?: {
  exerciseCount?: number;
  setsPerExercise?: number;
}): WeeklyPlanDay[];
