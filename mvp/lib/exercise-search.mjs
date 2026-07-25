import { exerciseDataset } from "../../data/exercises.mjs";

export function searchExerciseCatalog(query, limit = 10) {
  const keyword = String(query || "").trim().toLowerCase();
  if (!keyword) return [];
  return exerciseDataset
    .filter(exercise => exercise.media?.gif && exercise.steps?.length >= 3)
    .filter(exercise => {
      const haystack = `${exercise.name} ${exercise.part} ${exercise.equipment} ${exercise.guide}`.toLowerCase();
      return haystack.includes(keyword);
    })
    .sort((a, b) => scoreExercise(a, keyword) - scoreExercise(b, keyword) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function makeExercisePlanFromCatalog(exercise, options = {}) {
  const setsPerExercise = Math.min(6, Math.max(1, Math.round(options.setsPerExercise ?? 3)));
  const defaultSet = exercise.sets?.[0] ?? [0, 10];
  const weightKg = Number(defaultSet[0] || 0);
  const reps = Number(defaultSet[1] || 10);
  return {
    id: exercise.id,
    exerciseName: exercise.name,
    muscleGroup: exercise.part,
    restSeconds: weightKg ? 90 : 60,
    steps: exercise.steps.slice(0, 5),
    media: { gif: exercise.media.gif, thumbnail: exercise.media.thumbnail || "" },
    sets: Array.from({ length: setsPerExercise }, (_, index) => ({
      id: `${exercise.id}-${index + 1}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      muscleGroup: exercise.part,
      setIndex: index + 1,
      weightKg,
      reps,
      completed: false
    }))
  };
}

function scoreExercise(exercise, keyword) {
  if (exercise.part === keyword) return 0;
  if (exercise.name.toLowerCase().includes(keyword)) return 1;
  if (exercise.equipment?.toLowerCase().includes(keyword)) return 2;
  return 3;
}
