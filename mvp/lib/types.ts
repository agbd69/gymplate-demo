export type MealSlot = "breakfast" | "lunch" | "dinner" | "snack";
export type Goal = "cut" | "maintain" | "bulk";

export type Macro = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealEntry = Macro & {
  id: string;
  slot: MealSlot;
  foodName: string;
  grams: number;
  source: "food-db" | "ai-estimate" | "user-template" | "manual";
  macroEdited: boolean;
};

export type MealTemplate = {
  id: string;
  slot: MealSlot;
  name: string;
  isDefault: boolean;
  entries: MealEntry[];
};

export type Profile = {
  sex: "male" | "female";
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  trainingDays: number;
};

export type PlanSettings = {
  exerciseCount: number;
  setsPerExercise: number;
};

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  setIndex: number;
  weightKg: number;
  reps: number;
  completed: boolean;
};

export type ExercisePlan = {
  id: string;
  exerciseName: string;
  muscleGroup: string;
  restSeconds: number;
  steps: string[];
  media: {
    gif: string;
    thumbnail?: string;
  };
  sets: WorkoutSet[];
};

export type DailyRecord = {
  date: string;
  meals: MealEntry[];
  exercises: ExercisePlan[];
  weightKg: number;
  steps: number;
  sleepHours: number;
  mood: string;
};
