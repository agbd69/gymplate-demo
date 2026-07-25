const weekdayTemplates = {
  1: [[1]],
  2: [[1], [4]],
  3: [[1], [3], [5]],
  4: [[1], [2], [4], [6]],
  5: [[1], [2], [3], [5], [6]],
  6: [[1], [2], [3], [4], [5], [6]],
  7: [[1], [2], [3], [4], [5], [6], [7]]
};

const exercisePool = {
  cut: [
    ["bench", "杠铃卧推", "胸", 45, 8],
    ["row", "坐姿划船", "背", 50, 10],
    ["squat", "史密斯深蹲", "腿", 55, 10],
    ["press", "哑铃肩推", "肩", 18, 10],
    ["pulldown", "高位下拉", "背", 45, 10],
    ["lunge", "哑铃弓步蹲", "腿", 16, 10],
    ["pushdown", "绳索下压", "臂", 25, 12],
    ["plank", "平板支撑", "核心", 0, 45]
  ],
  bulk: [
    ["bench", "杠铃卧推", "胸", 50, 6],
    ["row", "杠铃划船", "背", 50, 8],
    ["squat", "杠铃深蹲", "腿", 60, 6],
    ["deadlift", "罗马尼亚硬拉", "腿", 60, 8],
    ["press", "杠铃推举", "肩", 35, 6],
    ["pulldown", "高位下拉", "背", 50, 8],
    ["curl", "哑铃弯举", "臂", 14, 10],
    ["raise", "侧平举", "肩", 8, 12]
  ],
  maintain: [
    ["bench", "哑铃卧推", "胸", 22, 10],
    ["row", "坐姿划船", "背", 45, 10],
    ["legpress", "腿举", "腿", 80, 10],
    ["press", "哑铃肩推", "肩", 16, 10],
    ["pulldown", "高位下拉", "背", 42, 10],
    ["pushup", "俯卧撑", "胸", 0, 12],
    ["pushdown", "绳索下压", "臂", 22, 12],
    ["crunch", "卷腹", "核心", 0, 15]
  ]
};

export function makeProfileMetrics(profile) {
  const bmi = Math.round(profile.weightKg / ((profile.heightCm / 100) ** 2) * 10) / 10;
  const bmr = Math.round(10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + (profile.sex === "female" ? -161 : 5));
  const activity = profile.trainingDays >= 5 ? 1.62 : profile.trainingDays >= 3 ? 1.48 : 1.35;
  const calories = Math.round(bmr * activity + (profile.goal === "bulk" ? 250 : profile.goal === "cut" ? -400 : 0));
  const protein = Math.round(profile.weightKg * 2);
  const fat = Math.round(profile.weightKg * 0.8);
  const carbs = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 0);
  return { bmi, bmr, calories, protein, fat, carbs };
}

export function makeWeeklyPlan(profile, options = {}) {
  const exerciseCount = clamp(Math.round(options.exerciseCount ?? 4), 2, 8);
  const setsPerExercise = clamp(Math.round(options.setsPerExercise ?? 3), 1, 6);
  const weekdays = (weekdayTemplates[profile.trainingDays] ?? weekdayTemplates[3]).flat();
  return Array.from({ length: 7 }, (_, index) => {
    const weekday = index + 1;
    if (!weekdays.includes(weekday)) return { weekday, type: "rest", exercises: [] };
    return {
      weekday,
      type: "training",
      exercises: pickExercises(profile.goal, weekday, exerciseCount).map(item => toExercise(item, setsPerExercise))
    };
  });
}

function pickExercises(goal, weekday, count) {
  const pool = exercisePool[goal] ?? exercisePool.cut;
  const offset = Math.max(weekday - 1, 0) % pool.length;
  return Array.from({ length: count }, (_, index) => pool[(offset + index) % pool.length]);
}

function toExercise(item, setCount) {
  const [id, exerciseName, muscleGroup, weightKg, reps] = item;
  return {
    id,
    exerciseName,
    muscleGroup,
    restSeconds: weightKg ? 90 : 60,
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
