const PART_MAP = {
  chest: "胸",
  back: "背",
  "upper back": "背",
  "lower back": "背",
  lats: "背",
  waist: "核心",
  abs: "核心",
  core: "核心",
  shoulders: "肩",
  shoulder: "肩",
  "upper arms": "臂",
  arms: "臂",
  biceps: "臂",
  triceps: "臂",
  "upper legs": "腿",
  "lower legs": "腿",
  legs: "腿",
  quads: "腿",
  hamstrings: "腿",
  glutes: "腿",
  calves: "腿"
};

const EQUIPMENT_MAP = {
  "body weight": "自重",
  barbell: "杠铃",
  dumbbell: "哑铃",
  cable: "绳索",
  lever: "器械",
  "assisted": "辅助器械",
  kettlebell: "壶铃",
  band: "弹力带",
  medicine: "药球",
  stability: "稳定球",
  ez: "EZ 杆"
};

function numberOrNull(value) {
  if (value === undefined || value === null) return null;
  const normalized = String(value).replace(/[^\d.-]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed * 10) / 10 : null;
}

function partFrom(raw) {
  const candidates = [raw.body_part, raw.bodyPart, raw.category, raw.target, raw.muscle].filter(Boolean);
  for (const candidate of candidates) {
    const key = String(candidate).toLowerCase();
    if (PART_MAP[key]) return PART_MAP[key];
    const fuzzy = Object.keys(PART_MAP).find(item => key.includes(item));
    if (fuzzy) return PART_MAP[fuzzy];
  }
  return "全身";
}

function equipmentFrom(value = "") {
  const key = String(value).toLowerCase();
  const fuzzy = Object.keys(EQUIPMENT_MAP).find(item => key.includes(item));
  return fuzzy ? EQUIPMENT_MAP[fuzzy] : value || "器械";
}

function mediaUrl(value) {
  if (!value) return "";
  const url = String(value);
  if (/^https?:\/\//.test(url)) return url;
  return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${url.replace(/^\/+/, "")}`;
}

function mediaFrom(raw) {
  return {
    gif: mediaUrl(raw.gifUrl || raw.gif_url || raw.gif || raw.image),
    thumbnail: mediaUrl(raw.thumbnail || raw.thumbnailUrl || raw.thumbnail_url || raw.imageUrl)
  };
}

export function normalizeExercise(raw) {
  const id = raw.id || raw.exerciseId || raw.name;
  const zhSteps = raw.instruction_steps?.zh || raw.instructions_steps?.zh || [];
  const guide = raw.instructions?.zh || raw.instruction?.zh || raw.description?.zh || raw.instructions || "";
  return {
    id: `open-${id}`,
    name: raw.name_zh || raw.zhName || raw.name || "未命名动作",
    part: partFrom(raw),
    equipment: equipmentFrom(raw.equipment),
    guide: String(guide).trim(),
    steps: Array.isArray(zhSteps) ? zhSteps.map(step => String(step).trim()).filter(Boolean) : [],
    sets: [[0, 10], [0, 10], [0, 10]],
    media: mediaFrom(raw),
    source: "hasaneyldrm/exercises-dataset"
  };
}

export function normalizeFood(raw, category = "") {
  const calories = numberOrNull(raw.energyKCal ?? raw.calories ?? raw.energy);
  const protein = numberOrNull(raw.protein);
  const carbs = numberOrNull(raw.CHO ?? raw.carbs ?? raw.carbohydrate);
  const fat = numberOrNull(raw.fat);
  if (calories === null || protein === null || carbs === null || fat === null) return null;
  return {
    id: `food-${raw.foodCode || raw.id || raw.foodName || raw.name}`,
    name: raw.foodName || raw.name || "未命名食物",
    calories,
    protein,
    carbs,
    fat,
    unit: "每100g",
    category,
    source: "Sanotsu/china-food-composition-data · 中国食物成分表标准版第6版"
  };
}
