import type { ExercisePlan } from "./types";

export type CatalogExercise = {
  id: string;
  name: string;
  part: string;
  equipment: string;
  guide: string;
  steps: string[];
  sets: Array<[number, number]>;
  media: {
    gif: string;
    thumbnail?: string;
  };
  source: string;
};

export function searchExerciseCatalog(query: string, limit?: number): CatalogExercise[];
export function makeExercisePlanFromCatalog(exercise: CatalogExercise, options?: {
  setsPerExercise?: number;
}): ExercisePlan;
