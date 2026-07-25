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
    exercise("bench", "杠铃卧推", "胸", 45, 8, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-ROD1foV.gif"),
    exercise("row", "坐姿划船", "背", 50, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0861-fUBheHs.gif"),
    exercise("squat", "史密斯深蹲", "腿", 55, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0751-0teFYah.gif"),
    exercise("press", "哑铃肩推", "肩", 18, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0405-sYbBWyF.gif"),
    exercise("pulldown", "高位下拉", "背", 45, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0150-Poo2iz0.gif"),
    exercise("lunge", "哑铃弓步蹲", "腿", 16, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/1688-K9VL0Jq.gif"),
    exercise("pushdown", "绳索下压", "臂", 25, 12, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0200-e9wXgkq.gif"),
    exercise("plank", "平板支撑", "核心", 0, 45, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0463-GlAq7Bf.gif")
  ],
  bulk: [
    exercise("bench", "杠铃卧推", "胸", 50, 6, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0025-ROD1foV.gif"),
    exercise("row", "杠铃划船", "背", 50, 8, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0027-Lil7ZJV.gif"),
    exercise("squat", "杠铃深蹲", "腿", 60, 6, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0043-PAdzXLH.gif"),
    exercise("deadlift", "罗马尼亚硬拉", "腿", 60, 8, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0085-RROZF93.gif"),
    exercise("press", "杠铃推举", "肩", 35, 6, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0041-aNoPwDB.gif"),
    exercise("pulldown", "高位下拉", "背", 50, 8, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0150-Poo2iz0.gif"),
    exercise("curl", "哑铃弯举", "臂", 14, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0031-25GPyDY.gif"),
    exercise("raise", "侧平举", "肩", 8, 12, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0334-EWKlMpZ.gif")
  ],
  maintain: [
    exercise("bench", "哑铃卧推", "胸", 22, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0289-oUbuLU8.gif"),
    exercise("row", "坐姿划船", "背", 45, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0861-fUBheHs.gif"),
    exercise("legpress", "腿举", "腿", 80, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0739-OBcc7eM.gif"),
    exercise("press", "哑铃肩推", "肩", 16, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0405-sYbBWyF.gif"),
    exercise("pulldown", "高位下拉", "背", 42, 10, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0150-Poo2iz0.gif"),
    exercise("pushup", "俯卧撑", "胸", 0, 12, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0662-3pJfPDZ.gif"),
    exercise("pushdown", "绳索下压", "臂", 22, 12, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0200-e9wXgkq.gif"),
    exercise("crunch", "卷腹", "核心", 0, 15, "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/videos/0274-sh6kzMe.gif")
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
  return {
    id: item.id,
    exerciseName: item.exerciseName,
    muscleGroup: item.muscleGroup,
    restSeconds: item.weightKg ? 90 : 60,
    steps: item.steps,
    media: { gif: item.gif },
    sets: Array.from({ length: setCount }, (_, index) => ({
      id: `${item.id}-${index + 1}`,
      exerciseId: item.id,
      exerciseName: item.exerciseName,
      muscleGroup: item.muscleGroup,
      setIndex: index + 1,
      weightKg: item.weightKg,
      reps: item.reps,
      completed: false
    }))
  };
}

function exercise(id, exerciseName, muscleGroup, weightKg, reps, gif) {
  return {
    id,
    exerciseName,
    muscleGroup,
    weightKg,
    reps,
    gif,
    steps: [
      "先用较轻重量热身，确认动作轨迹稳定。",
      "保持核心收紧，发力过程不要借力甩动。",
      "离心阶段放慢，顶端或底端短暂停顿后再进入下一次。"
    ]
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
