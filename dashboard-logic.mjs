import { exerciseDataset } from "./data/exercises.mjs";
import { foodDataset } from "./data/foods.mjs";

const fallbackFoods = [
  { name: "鸡胸肉米饭", calories: 680, protein: 52, carbs: 82, fat: 14 },
  { name: "希腊酸奶碗", calories: 520, protein: 42, carbs: 55, fat: 12 },
  { name: "乳清蛋白", calories: 120, protein: 24, carbs: 3, fat: 2 },
  { name: "香蕉", calories: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "鸡蛋", calories: 144, protein: 12, carbs: 1, fat: 10 },
  { name: "米饭", calories: 260, protein: 5, carbs: 58, fat: 1 }
];

const fallbackExercises = [
  { id: "bench", name: "哑铃卧推", part: "胸", guide: "肩胛骨收紧，下放慢一点，推起时让哑铃回到胸口正上方。", sets: [[24, 10], [26, 9], [26, 8]] },
  { id: "incline", name: "上斜哑铃卧推", part: "胸", guide: "凳子调到 30 度左右，胸上部发力，不要耸肩。", sets: [[20, 10], [22, 9], [22, 8]] },
  { id: "fly", name: "绳索夹胸", part: "胸", guide: "手肘微弯，想象用胸把手臂合到身体前侧。", sets: [[18, 12], [20, 12], [20, 10]] },
  { id: "press", name: "坐姿哑铃推肩", part: "肩", guide: "核心收紧，肋骨不要外翻，下放到耳朵附近即可。", sets: [[16, 10], [18, 8], [18, 8]] },
  { id: "lateral", name: "哑铃侧平举", part: "肩", guide: "手肘带动上抬，不要借力甩，顶端停半秒。", sets: [[8, 14], [8, 12], [8, 12]] },
  { id: "rear_delt", name: "反向飞鸟", part: "肩", guide: "身体稳定，肩后束发力打开，避免斜方肌抢力。", sets: [[7, 14], [7, 12], [7, 12]] },
  { id: "pushdown", name: "绳索下压", part: "臂", guide: "手肘固定在身体两侧，底部把绳子向外分开。", sets: [[30, 12], [32, 11], [32, 10]] },
  { id: "curl", name: "哑铃弯举", part: "臂", guide: "上臂保持稳定，顶端收缩，下降时控制离心。", sets: [[12, 12], [12, 10], [10, 12]] },
  { id: "row", name: "坐姿划船", part: "背", guide: "先沉肩再拉，想象用手肘向后划。", sets: [[50, 12], [55, 10], [55, 9]] },
  { id: "lat_pull", name: "高位下拉", part: "背", guide: "胸口微挺，肩胛先下沉，再把肘拉向身体两侧。", sets: [[45, 12], [50, 10], [50, 10]] },
  { id: "pullover", name: "直臂下压", part: "背", guide: "手臂微弯固定，用背阔肌把杆拉到大腿前。", sets: [[25, 12], [27, 12], [27, 10]] },
  { id: "squat", name: "杠铃深蹲", part: "腿", guide: "脚掌踩稳，膝盖跟脚尖方向一致，核心收紧后再下蹲。", sets: [[70, 8], [80, 6], [80, 6]] },
  { id: "leg_press", name: "腿举", part: "腿", guide: "脚掌踩稳平台，下放到膝盖舒适角度，推起不要锁死。", sets: [[120, 12], [140, 10], [140, 10]] },
  { id: "rdl", name: "罗马尼亚硬拉", part: "腿", guide: "髋向后折叠，背保持中立，感受腘绳肌拉伸。", sets: [[60, 10], [70, 8], [70, 8]] },
  { id: "plank", name: "平板支撑", part: "核心", guide: "肋骨收紧，骨盆微后倾，保持稳定呼吸。", sets: [[0, 45], [0, 45], [0, 40]] },
  { id: "deadbug", name: "死虫", part: "核心", guide: "腰背贴地，对侧手脚缓慢伸展，保持核心稳定。", sets: [[0, 12], [0, 12], [0, 12]] }
];

const practicalExerciseSpecs = [
  { id: "barbell_bench_press", sourceName: "barbell bench press", name: "杠铃卧推", part: "胸", equipment: "杠铃 / 卧推凳", guide: "肩胛骨向后向下收紧，脚踩稳地面，杠铃下放到胸中下部，再沿略向后的轨迹推起。", steps: ["握距略宽于肩，手腕保持中立。", "下放时手肘约 45 度，不要外展成直角。", "推起时胸部发力，顶端不要耸肩。"], sets: [[40, 10], [45, 8], [45, 8]] },
  { id: "dumbbell_bench_press", sourceName: "dumbbell bench press", name: "哑铃卧推", part: "胸", equipment: "哑铃 / 卧推凳", guide: "肩胛骨稳定，哑铃下放到胸两侧，推起时让哑铃回到胸口正上方。", steps: ["下放慢一点，感受胸部拉伸。", "手腕保持直，不要向后折。", "推起时保持左右速度一致。"], sets: [[22, 10], [24, 10], [24, 8]] },
  { id: "incline_cable_press", sourceName: "cable incline bench press", name: "上斜卧推", part: "胸", equipment: "上斜凳 / 绳索或哑铃", guide: "凳子约 30 度，胸上部发力，避免耸肩和腰部过度反弓。", steps: ["肩胛收紧后再开始推。", "下放到上胸附近。", "推起时不要让肩膀抢力。"], sets: [[20, 10], [22, 9], [22, 8]] },
  { id: "cable_fly", sourceName: "cable incline fly", name: "绳索夹胸", part: "胸", equipment: "龙门架", guide: "手肘微弯固定，用胸把手臂合到身体前方，不要变成推的动作。", steps: ["身体微微前倾，核心收紧。", "打开时控制速度。", "合拢时胸部主动夹紧半秒。"], sets: [[15, 12], [17, 12], [17, 10]] },
  { id: "seated_row", sourceName: "cable seated row", name: "坐姿划船", part: "背", equipment: "坐姿划船机", guide: "先沉肩，再用手肘向后拉，顶端夹紧肩胛，避免身体大幅后仰借力。", steps: ["起始位背部挺直。", "手肘贴近身体向后拉。", "还原时让背阔肌充分拉伸。"], sets: [[45, 12], [50, 10], [50, 10]] },
  { id: "lat_pulldown", sourceName: "cable pulldown", name: "高位下拉", part: "背", equipment: "高位下拉机", guide: "胸口微挺，肩胛先下沉，再把手肘拉向身体两侧。", steps: ["握距略宽于肩。", "不要用手腕硬拉。", "下拉到上胸附近即可。"], sets: [[40, 12], [45, 10], [45, 10]] },
  { id: "incline_row", sourceName: "dumbbell incline row", name: "上斜哑铃划船", part: "背", equipment: "哑铃 / 上斜凳", guide: "胸贴凳面，减少腰部借力，用手肘向后划，顶端夹背。", steps: ["凳子调到 30-45 度。", "拉起时手肘略向身体两侧。", "下放时保持控制。"], sets: [[18, 12], [20, 10], [20, 10]] },
  { id: "barbell_squat", sourceName: "barbell full squat", name: "杠铃深蹲", part: "腿", equipment: "深蹲架 / 杠铃", guide: "脚掌踩稳，膝盖跟脚尖方向一致，核心收紧后下蹲。", steps: ["先吸气收紧核心。", "髋膝同时启动下蹲。", "站起时保持脚掌三点受力。"], sets: [[60, 8], [70, 8], [70, 6]] },
  { id: "front_squat", sourceName: "barbell front squat", name: "前蹲", part: "腿", equipment: "杠铃", guide: "躯干更直立，肘部抬高，重点训练股四头肌和核心稳定。", steps: ["杠铃放在前三角和锁骨附近。", "下蹲时保持胸口向上。", "起身不要塌腰。"], sets: [[40, 8], [45, 8], [45, 6]] },
  { id: "hack_squat", sourceName: "barbell hack squat", name: "哈克深蹲", part: "腿", equipment: "哈克机或杠铃", guide: "脚掌踩稳，控制下放，推起时不要锁死膝盖。", steps: ["选择舒适站距。", "下放到膝盖可控范围。", "推起时保持膝盖方向稳定。"], sets: [[80, 12], [90, 10], [90, 10]] },
  { id: "shoulder_press", sourceName: "lever shoulder press", name: "器械推肩", part: "肩", equipment: "推肩机", guide: "背部贴稳，肋骨不要外翻，推起时让肩部发力而不是耸肩。", steps: ["座椅高度调到手柄接近耳侧。", "推起到手臂接近伸直。", "下放时保持肩部控制。"], sets: [[25, 10], [30, 10], [30, 8]] },
  { id: "dumbbell_lateral_raise", sourceName: "dumbbell lateral raise", name: "哑铃侧平举", part: "肩", equipment: "哑铃", guide: "手肘带动上抬，不要甩重量，顶端停半秒。", steps: ["身体保持稳定。", "手肘略弯并高于手腕。", "下放时继续控制。"], sets: [[6, 14], [7, 12], [7, 12]] },
  { id: "rear_delt_raise", sourceName: "dumbbell rear delt raise", name: "俯身反向飞鸟", part: "肩", equipment: "哑铃", guide: "肩后束发力打开手臂，避免斜方肌耸起来抢力。", steps: ["髋部折叠，背部保持中立。", "手臂向两侧打开。", "顶端略停顿再下放。"], sets: [[5, 14], [6, 12], [6, 12]] },
  { id: "cable_pushdown", sourceName: "cable pushdown", name: "绳索下压", part: "臂", equipment: "龙门架 / 绳索", guide: "手肘固定在身体两侧，底部把绳子向外分开，三头肌充分收缩。", steps: ["上臂尽量不前后晃。", "下压到底再停半秒。", "还原时不要让重量把手臂拉飞。"], sets: [[25, 12], [30, 10], [30, 10]] },
  { id: "barbell_curl", sourceName: "barbell curl", name: "杠铃弯举", part: "臂", equipment: "杠铃或 EZ 杆", guide: "上臂稳定，顶端收缩，下降时控制离心。", steps: ["核心收紧，不要后仰甩。", "弯举到前臂接近竖直。", "下放到手臂接近伸直。"], sets: [[15, 12], [17.5, 10], [17.5, 10]] },
  { id: "floor_crunch", sourceName: "crunch floor", name: "卷腹", part: "核心", equipment: "垫子", guide: "用腹部带动胸口向骨盆靠近，不要用脖子硬拉。", steps: ["下背轻贴地面。", "呼气卷起上背。", "顶端收紧后慢慢还原。"], sets: [[0, 15], [0, 15], [0, 12]] },
  { id: "dead_bug", sourceName: "dead bug", name: "死虫", part: "核心", equipment: "垫子", guide: "腰背贴地，对侧手脚缓慢伸展，保持核心稳定。", steps: ["先把肋骨收住。", "对侧手脚缓慢伸展。", "腰不要离开地面。"], sets: [[0, 12], [0, 12], [0, 12]] }
];

function practicalExerciseFromSpec(spec) {
  const source = exerciseDataset.find(exercise => exercise.name === spec.sourceName);
  return {
    ...source,
    ...spec,
    id: spec.id,
    source: source?.source || "实用中文动作池",
    media: source?.media || null,
    practical: true
  };
}

const practicalExercises = practicalExerciseSpecs.map(practicalExerciseFromSpec);

export const foods = [...fallbackFoods, ...foodDataset];

export const exercises = [...practicalExercises, ...fallbackExercises, ...exerciseDataset];

export function bmi(height, weight) {
  return Math.round(weight / ((height / 100) ** 2) * 10) / 10;
}

export function targets(profile) {
  const bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + (profile.sex === "female" ? -161 : 5);
  const activity = profile.trainingDays >= 5 ? 1.62 : profile.trainingDays >= 3 ? 1.48 : 1.35;
  const maintenance = bmr * activity;
  const calories = Math.round(maintenance + (profile.goal === "bulk" ? 250 : profile.goal === "cut" ? -400 : 0));
  const protein = Math.round(profile.weight * 2);
  const fat = Math.round(profile.weight * 0.8);
  const carbs = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 0);
  return { bmr: Math.round(bmr), calories, protein, carbs, fat, bmi: bmi(profile.height, profile.weight) };
}

export function makePlan(profile) {
  const split = [
    { day: "周一", name: "推日", parts: ["胸", "肩", "臂"], ids: ["bench", "press", "pushdown"] },
    { day: "周二", name: "拉日", parts: ["背", "臂"], ids: ["row", "press", "pushdown"] },
    { day: "周四", name: "腿日", parts: ["腿", "核心"], ids: ["squat", "row", "press"] },
    { day: "周六", name: "上肢补强", parts: ["胸", "背"], ids: ["bench", "row", "pushdown"] },
    { day: "周日", name: "弱项加练", parts: profile.parts.slice(0, 2), ids: ["squat", "bench", "row"] }
  ];
  return split.slice(0, profile.trainingDays).map(item => ({ ...item, setGoal: profile.goal === "bulk" ? 4 : 3 }));
}

export function dateKey(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  return value.toISOString().slice(0, 10);
}

export function dayState(records, date, fallbackCheckin = {}) {
  const saved = records?.[date] || {};
  return {
    date,
    meals: saved.meals || [],
    completed: saved.completed || {},
    workout: saved.workout || [],
    checkin: {
      weight: saved.checkin?.weight ?? fallbackCheckin.weight ?? 0,
      steps: saved.checkin?.steps ?? fallbackCheckin.steps ?? 0,
      sleep: saved.checkin?.sleep ?? fallbackCheckin.sleep ?? 0,
      mood: saved.checkin?.mood ?? fallbackCheckin.mood ?? ""
    },
    settled: saved.settled || null
  };
}

export function buildWeekPlan(profile, { seed = 1, trainingWeekdays, exercisesPerDay, setsPerExercise } = {}) {
  const labels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  const plan = makePlan(profile);
  const defaultWeekdays = [1, 3, 5, 6, 7].slice(0, profile.trainingDays);
  const activeWeekdays = (trainingWeekdays?.length ? trainingWeekdays : defaultWeekdays).slice(0, profile.trainingDays);
  const maxExercises = Math.max(Number(exercisesPerDay) || (profile.goal === "bulk" ? 5 : 4), 1);
  const setGoal = Math.max(Number(setsPerExercise) || (profile.goal === "bulk" ? 4 : 3), 1);
  return {
    id: `week-${profile.goal}-${profile.trainingDays}-${profile.parts.join("-")}-${seed}`,
    goal: profile.goal,
    trainingDays: profile.trainingDays,
    parts: [...profile.parts],
    days: labels.map((label, index) => {
      const weekday = index + 1;
      const trainingIndex = activeWeekdays.indexOf(weekday);
      const planItem = trainingIndex >= 0 ? plan[trainingIndex] : null;
      if (!planItem) return { day: label, weekday, type: "rest", name: "休息 / 拉伸", parts: [], workout: [] };
      const workout = generateWorkout({
        parts: planItem.parts.length ? planItem.parts : profile.parts,
        goal: profile.goal,
        seed: seed + index,
        maxExercises,
        setGoal
      });
      return {
        day: label,
        weekday,
        type: "training",
        name: planItem.name,
        parts: planItem.parts,
        workout
      };
    })
  };
}

export function generateWorkout({ parts, goal = "cut", seed = 0, maxExercises = 4, setGoal: configuredSetGoal }) {
  const selectedParts = parts?.length ? parts : ["胸", "背", "腿", "肩"];
  const practicalPool = practicalExercises.filter(exercise => selectedParts.includes(exercise.part));
  const sourcePool = practicalPool.length ? practicalPool : exercises.filter(exercise => selectedParts.includes(exercise.part));
  const gifPool = sourcePool.filter(exercise => exercise.media?.gif);
  const pool = gifPool.length >= Math.min(maxExercises, sourcePool.length) ? gifPool : sourcePool;
  const ordered = [...pool].sort((a, b) => {
    const aScore = (a.id.charCodeAt(0) + seed * 7 + selectedParts.indexOf(a.part) * 3) % 17;
    const bScore = (b.id.charCodeAt(0) + seed * 7 + selectedParts.indexOf(b.part) * 3) % 17;
    return aScore - bScore;
  });
  const perPart = selectedParts.flatMap(part => ordered.filter(exercise => exercise.part === part).slice(0, goal === "bulk" ? 2 : 1));
  const filled = [...perPart, ...ordered.filter(exercise => !perPart.includes(exercise))];
  const setGoal = configuredSetGoal || (goal === "bulk" ? 4 : 3);
  return filled.slice(0, maxExercises).map(exercise => {
    const generatedSets = Array.from({ length: setGoal }, (_, index) => {
      const source = exercise.sets[Math.min(index, exercise.sets.length - 1)];
      return [...source];
    });
    return {
      ...exercise,
      sets: generatedSets,
      setGoal,
      repRange: goal === "bulk" ? "8-10" : "10-12"
    };
  });
}

export function parseMeal(text) {
  const normalized = text || "";
  const picked = [];
  for (const food of foods) {
    const canUseShortMatch = !food.source;
    const shortName = food.name.slice(0, 2);
    const matched = normalized.includes(food.name) || (canUseShortMatch && normalized.includes(shortName));
    const isContainedByPicked = picked.some(item => item.name.includes(food.name) || (canUseShortMatch && item.name.includes(shortName)));
    if (matched && !isContainedByPicked) picked.push(scaleFoodForText(food, normalized));
  }
  if (picked.length === 0) return { name: text || "自定义一餐", calories: 450, protein: 25, carbs: 50, fat: 14 };
  return picked.reduce((sum, item) => ({
    name: sum.name ? `${sum.name} + ${item.name}` : item.name,
    calories: sum.calories + item.calories,
    protein: sum.protein + item.protein,
    carbs: sum.carbs + item.carbs,
    fat: sum.fat + item.fat
  }), { name: "", calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export function searchFoods(query, limit = 8) {
  const normalized = String(query || "").trim();
  if (!normalized) return [];
  const searchableFoods = foodDataset.length ? foodDataset : foods;
  return searchableFoods
    .filter(food => food.name.includes(normalized))
    .sort((a, b) => {
      const aExact = a.name === normalized ? 0 : a.name.startsWith(normalized) ? 1 : 2;
      const bExact = b.name === normalized ? 0 : b.name.startsWith(normalized) ? 1 : 2;
      return aExact - bExact || a.name.length - b.name.length;
    })
    .slice(0, limit);
}

export function foodEntry(food, grams) {
  const amount = Math.max(Number(grams) || 0, 0);
  const scale = amount / 100;
  return {
    name: `${food.name} ${Math.round(amount)}g`,
    calories: Math.round(food.calories * scale),
    protein: Math.round(food.protein * scale * 10) / 10,
    carbs: Math.round(food.carbs * scale * 10) / 10,
    fat: Math.round(food.fat * scale * 10) / 10,
    grams: amount,
    unit: food.unit || "每100g",
    source: food.source || "本地食物"
  };
}

function scaleFoodForText(food, text) {
  const escapedName = food.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const shortName = food.name.slice(0, 2).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const amountMatch = text.match(new RegExp(`(?:${escapedName}|${shortName})[^\\d]*(\\d+(?:\\.\\d+)?)\\s*(克|g|斤|两)?`, "i"))
    || text.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(克|g|斤|两)?[^，。；,.]*?(?:${escapedName}|${shortName})`, "i"));
  if (!amountMatch) return food;
  const amount = Number(amountMatch[1]);
  const unit = amountMatch[2] || "克";
  const grams = unit === "斤" ? amount * 500 : unit === "两" ? amount * 50 : amount;
  const scale = grams / 100;
  return {
    ...food,
    name: `${food.name} ${Math.round(grams)}g`,
    calories: Math.round(food.calories * scale),
    protein: Math.round(food.protein * scale * 10) / 10,
    carbs: Math.round(food.carbs * scale * 10) / 10,
    fat: Math.round(food.fat * scale * 10) / 10
  };
}

export function totals(meals) {
  return meals.reduce((sum, meal) => ({
    calories: sum.calories + meal.calories,
    protein: sum.protein + meal.protein,
    carbs: sum.carbs + meal.carbs,
    fat: sum.fat + meal.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

export function workoutVolume(log) {
  return log.reduce((sum, set) => sum + Number(set.weight || 0) * Number(set.reps || 0), 0);
}

export function dailySummary({ date, checkin, meals, target, workoutLog }) {
  const total = totals(meals || []);
  const volume = workoutVolume(workoutLog || []);
  return {
    date,
    weight: Number(checkin?.weight || 0),
    calories: total.calories,
    protein: total.protein,
    carbs: total.carbs,
    fat: total.fat,
    calorieGap: target.calories - total.calories,
    proteinGap: target.protein - total.protein,
    volume,
    steps: Number(checkin?.steps || 0),
    sleep: Number(checkin?.sleep || 0),
    mood: checkin?.mood || ""
  };
}

export function trend(seed, count, step) {
  return Array.from({ length: count }, (_, index) => Math.round((seed + Math.sin(index / 2) * step + index * step * 0.35) * 10) / 10);
}
