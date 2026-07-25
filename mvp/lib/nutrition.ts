import type { Macro, MealEntry, MealSlot, Profile } from "./types";

const foodAliases = [
  { aliases: ["米饭", "熟米饭", "白米饭"], name: "米饭", grams: 150, units: { 碗: 150 }, macro: { calories: 116, protein: 2.6, carbs: 25.9, fat: 0.3 } },
  { aliases: ["鸡胸肉", "鸡胸"], name: "鸡胸肉", grams: 150, units: { 块: 150, 份: 150 }, macro: { calories: 118, protein: 24.6, carbs: 0.6, fat: 1.9 } },
  { aliases: ["鸡蛋"], name: "鸡蛋", grams: 50, units: { 个: 50, 颗: 50, 枚: 50 }, macro: { calories: 143, protein: 12.1, carbs: 0.1, fat: 10.5 } },
  { aliases: ["牛奶", "纯牛奶"], name: "牛奶", grams: 250, units: { 杯: 250, 盒: 250 }, macro: { calories: 65, protein: 3.3, carbs: 4.9, fat: 3.6 } },
  { aliases: ["香蕉"], name: "香蕉", grams: 100, units: { 根: 100, 个: 100 }, macro: { calories: 93, protein: 1.4, carbs: 22, fat: 0.2 } },
  { aliases: ["乳清", "蛋白粉", "乳清蛋白"], name: "蛋白粉", grams: 30, units: { 勺: 30 }, macro: { calories: 400, protein: 80, carbs: 10, fat: 6 } }
] as const;

const slotWords: Record<MealSlot, string[]> = {
  breakfast: ["早餐", "早上", "早饭"],
  lunch: ["午餐", "中午", "午饭"],
  dinner: ["晚餐", "晚上", "晚饭"],
  snack: ["加餐", "训练后", "下午", "夜宵"]
};

export function inferSlot(text: string, fallback: MealSlot = "lunch"): MealSlot {
  const matched = Object.entries(slotWords).find(([, words]) => words.some(word => text.includes(word)));
  return (matched?.[0] as MealSlot | undefined) ?? fallback;
}

export function targets(profile: Profile): Macro & { bmr: number } {
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + (profile.sex === "female" ? -161 : 5);
  const activity = profile.trainingDays >= 5 ? 1.62 : profile.trainingDays >= 3 ? 1.48 : 1.35;
  const maintenance = bmr * activity;
  const calories = Math.round(maintenance + (profile.goal === "bulk" ? 250 : profile.goal === "cut" ? -400 : 0));
  const protein = Math.round(profile.weightKg * 2);
  const fat = Math.round(profile.weightKg * 0.8);
  const carbs = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 0);
  return { bmr: Math.round(bmr), calories, protein, carbs, fat };
}

export function parseMealText(text: string, fallbackSlot: MealSlot = "lunch"): MealEntry[] {
  const slot = inferSlot(text, fallbackSlot);
  const entries = foodAliases.flatMap((spec) => {
    const alias = spec.aliases.find(item => text.includes(item));
    if (!alias) return [];
    const grams = inferGrams(text, alias, spec.grams, spec.units);
    const scale = grams / 100;
    return [{
      id: crypto.randomUUID(),
      slot,
      foodName: spec.name,
      grams,
      calories: Math.round(spec.macro.calories * scale),
      protein: round(spec.macro.protein * scale),
      carbs: round(spec.macro.carbs * scale),
      fat: round(spec.macro.fat * scale),
      source: "food-db" as const,
      macroEdited: false
    }];
  });
  return entries.length ? entries : [{
    id: crypto.randomUUID(),
    slot,
    foodName: text || "自定义一餐",
    grams: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    source: "manual",
    macroEdited: false
  }];
}

export function totalMacros(entries: Macro[]): Macro {
  return entries.reduce((sum, item) => ({
    calories: sum.calories + item.calories,
    protein: round(sum.protein + item.protein),
    carbs: round(sum.carbs + item.carbs),
    fat: round(sum.fat + item.fat)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}

function inferGrams(text: string, alias: string, defaultGrams: number, units: Record<string, number>): number {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const unitKeys = ["克", "g", "斤", "两", ...Object.keys(units)].join("|");
  const scoped = text.split(/[，。；,.;、]|和|与|及|加/).find(chunk => chunk.includes(alias)) ?? text;
  const match = scoped.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitKeys})?[^\\d一二两三四五六七八九十半]*${escaped}`, "i"))
    ?? scoped.match(new RegExp(`([一二两三四五六七八九十半]+)\\s*(${unitKeys})[^\\d一二两三四五六七八九十半]*${escaped}`, "i"))
    ?? scoped.match(new RegExp(`${escaped}[^\\d一二两三四五六七八九十半]*(\\d+(?:\\.\\d+)?)\\s*(${unitKeys})?`, "i"))
    ?? scoped.match(new RegExp(`${escaped}[^\\d一二两三四五六七八九十半]*([一二两三四五六七八九十半]+)\\s*(${unitKeys})`, "i"));
  if (!match) return defaultGrams;
  const amount = chineseNumber(match[1]) ?? 1;
  const unit = match[2] || "克";
  if (unit === "斤") return amount * 500;
  if (unit === "两") return amount * 50;
  if (units[unit]) return amount * units[unit];
  return amount;
}

function chineseNumber(value: string): number | null {
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  if (value === "半") return 0.5;
  const digits: Record<string, number> = { 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  if (value === "十") return 10;
  if (value.includes("十")) {
    const [left, right] = value.split("十");
    return (left ? digits[left] || 0 : 1) * 10 + (right ? digits[right] || 0 : 0);
  }
  return digits[value] ?? null;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
