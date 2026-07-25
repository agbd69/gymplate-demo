export function summarizeRecord(record) {
  const macros = total(record.meals ?? []);
  const sets = (record.exercises ?? []).flatMap(exercise => exercise.sets ?? []);
  const completed = sets.filter(set => set.completed);
  return {
    date: record.date,
    weightKg: record.weightKg,
    calories: macros.calories,
    protein: macros.protein,
    carbs: macros.carbs,
    fat: macros.fat,
    volume: completed.reduce((sum, set) => sum + Number(set.weightKg || 0) * Number(set.reps || 0), 0),
    completedSets: completed.length,
    steps: record.steps ?? 0,
    sleepHours: record.sleepHours ?? 0,
    mood: record.mood ?? ""
  };
}

export function addHistoryRecord(history, record) {
  const summary = summarizeRecord(record);
  return [...(history ?? []).filter(item => item.date !== summary.date), summary]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-90);
}

export function trendFromHistory(history) {
  const rows = [...(history ?? [])].sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  return {
    weight: rows.map(row => point(row.date, row.weightKg)),
    calories: rows.map(row => point(row.date, row.calories)),
    protein: rows.map(row => point(row.date, row.protein)),
    volume: rows.map(row => point(row.date, row.volume))
  };
}

function total(entries) {
  return entries.reduce((sum, item) => ({
    calories: sum.calories + Number(item.calories || 0),
    protein: round(sum.protein + Number(item.protein || 0)),
    carbs: round(sum.carbs + Number(item.carbs || 0)),
    fat: round(sum.fat + Number(item.fat || 0))
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function point(date, value) {
  return { date, value: Number(value || 0) };
}

function round(value) {
  return Math.round(value * 10) / 10;
}
