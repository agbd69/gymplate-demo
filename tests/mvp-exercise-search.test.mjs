import assert from "node:assert/strict";
import { makeExercisePlanFromCatalog, searchExerciseCatalog } from "../mvp/lib/exercise-search.mjs";

const backResults = searchExerciseCatalog("背", 8);
assert.equal(backResults.length > 0, true);
assert.equal(backResults.every(exercise => exercise.media?.gif?.endsWith(".gif")), true);
assert.equal(backResults.every(exercise => exercise.steps.length >= 3), true);

const row = backResults.find(exercise => exercise.name.includes("row")) ?? backResults[0];
const plan = makeExercisePlanFromCatalog(row, { setsPerExercise: 4 });
assert.equal(plan.exerciseName, row.name);
assert.equal(plan.muscleGroup, row.part);
assert.equal(plan.sets.length, 4);
assert.equal(plan.sets.every(set => set.exerciseId === row.id), true);
assert.equal(plan.media.gif, row.media.gif);
assert.equal(plan.steps.length >= 3, true);

assert.deepEqual(searchExerciseCatalog("", 5), []);

console.log("mvp exercise search checks passed");
