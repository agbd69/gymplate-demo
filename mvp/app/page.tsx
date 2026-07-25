"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyRecord, ExercisePlan, Macro, MealEntry, MealSlot, MealTemplate, Profile, WorkoutSet } from "@/lib/types";
import { parseMealText, targets, totalMacros } from "@/lib/nutrition";

const slots: Array<{ id: MealSlot; label: string }> = [
  { id: "breakfast", label: "早餐" },
  { id: "lunch", label: "午餐" },
  { id: "dinner", label: "晚餐" },
  { id: "snack", label: "加餐" }
];

const initialProfile: Profile = {
  sex: "male",
  age: 30,
  heightCm: 178,
  weightKg: 76,
  goal: "cut",
  trainingDays: 4
};

const initialTemplates: MealTemplate[] = [
  { id: "tpl-breakfast", slot: "breakfast", name: "鸡蛋牛奶早餐", isDefault: false, entries: parseMealText("早餐两个鸡蛋一杯牛奶", "breakfast") },
  { id: "tpl-lunch", slot: "lunch", name: "米饭鸡胸午餐", isDefault: false, entries: parseMealText("午餐250克米饭150克鸡胸肉", "lunch") },
  { id: "tpl-snack", slot: "snack", name: "训练后加餐", isDefault: false, entries: parseMealText("训练后30克蛋白粉一根香蕉", "snack") }
];

const initialExercises: ExercisePlan[] = [
  makeExercise("bench", "杠铃卧推", "胸", 3, 45, 8),
  makeExercise("row", "坐姿划船", "背", 3, 50, 10),
  makeExercise("press", "哑铃肩推", "肩", 3, 18, 10),
  makeExercise("triceps", "绳索下压", "臂", 2, 25, 12)
];

const storageKey = "gymplate-mvp-state-v1";

type StoredState = {
  record?: DailyRecord;
  templates?: MealTemplate[];
};

export default function HomePage() {
  const [page, setPage] = useState<"training" | "food" | "data">("food");
  const [profile] = useState(initialProfile);
  const [templates, setTemplates] = useState(initialTemplates);
  const [record, setRecord] = useState<DailyRecord>({
    date: new Date().toISOString().slice(0, 10),
    meals: [],
    exercises: initialExercises,
    weightKg: 76,
    steps: 8000,
    sleepHours: 7,
    mood: "正常"
  });
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [mealText, setMealText] = useState("");
  const [pending, setPending] = useState<MealEntry[]>([]);
  const [selectedTemplateSlot, setSelectedTemplateSlot] = useState<MealSlot>("lunch");
  const [hydrated, setHydrated] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");

  const target = useMemo(() => targets(profile), [profile]);
  const mealTotal = useMemo(() => totalMacros(record.meals), [record.meals]);
  const pendingTotal = useMemo(() => totalMacros(pending), [pending]);
  const remaining = target.calories - mealTotal.calories;
  const completedSets = record.exercises.flatMap(item => item.sets).filter(set => set.completed);
  const volume = completedSets.reduce((sum, set) => sum + set.weightKg * set.reps, 0);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredState;
      if (stored.record) setRecord(stored.record);
      if (stored.templates) setTemplates(stored.templates);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(storageKey, JSON.stringify({ record, templates }));
  }, [hydrated, record, templates]);

  async function parseMeal() {
    if (!mealText.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      const response = await fetch("/api/parse-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: mealText.trim(), slot })
      });
      if (!response.ok) throw new Error("parse failed");
      const data = await response.json();
      setPending(normalizeApiMeals(data.meals, slot, mealText.trim()));
    } catch {
      setPending(parseMealText(mealText.trim(), slot));
      setParseError("网络解析不可用，已用本地规则生成。");
    } finally {
      setParsing(false);
    }
  }

  function confirmMeal() {
    if (!pending.length) return;
    setRecord(current => ({ ...current, meals: [...current.meals, ...pending] }));
    setPending([]);
    setMealText("");
  }

  function addTemplate(template: MealTemplate) {
    const entries = template.entries.map(entry => ({ ...entry, id: crypto.randomUUID(), source: "user-template" as const }));
    setRecord(current => ({ ...current, meals: [...current.meals, ...entries] }));
  }

  function saveCurrentSlotAsTemplate(activeSlot: MealSlot) {
    const entries = record.meals.filter(meal => meal.slot === activeSlot);
    if (!entries.length) return;
    setTemplates(current => [
      ...current,
      {
        id: crypto.randomUUID(),
        slot: activeSlot,
        name: `我的${slots.find(item => item.id === activeSlot)?.label ?? "餐"}组合`,
        isDefault: false,
        entries: entries.map(entry => ({ ...entry, id: crypto.randomUUID(), source: "user-template" }))
      }
    ]);
  }

  function updatePending(id: string, patch: Partial<MealEntry>) {
    setPending(current => current.map(entry => recalcMeal(entry, patch, id)));
  }

  function updateMeal(id: string, patch: Partial<MealEntry>) {
    setRecord(current => ({
      ...current,
      meals: current.meals.map(entry => recalcMeal(entry, patch, id))
    }));
  }

  function deleteMeal(id: string) {
    setRecord(current => ({ ...current, meals: current.meals.filter(entry => entry.id !== id) }));
  }

  function addSet(exerciseId: string) {
    setRecord(current => ({
      ...current,
      exercises: current.exercises.map(exercise => {
        if (exercise.id !== exerciseId) return exercise;
        const last = exercise.sets.at(-1);
        return {
          ...exercise,
          sets: [
            ...exercise.sets,
            {
              id: crypto.randomUUID(),
              exerciseId: exercise.id,
              exerciseName: exercise.exerciseName,
              muscleGroup: exercise.muscleGroup,
              setIndex: exercise.sets.length + 1,
              weightKg: last?.weightKg ?? 0,
              reps: last?.reps ?? 10,
              completed: false
            }
          ]
        };
      })
    }));
  }

  function deleteSet(exerciseId: string, setId: string) {
    setRecord(current => ({
      ...current,
      exercises: current.exercises.map(exercise => exercise.id === exerciseId
        ? { ...exercise, sets: resequenceSets(exercise.sets.filter(set => set.id !== setId)) }
        : exercise)
    }));
  }

  function updateSet(exerciseId: string, setId: string, patch: Partial<WorkoutSet>) {
    setRecord(current => ({
      ...current,
      exercises: current.exercises.map(exercise => exercise.id === exerciseId
        ? { ...exercise, sets: exercise.sets.map(set => set.id === setId ? { ...set, ...patch } : set) }
        : exercise)
    }));
  }

  return (
    <main className="phone-shell">
      <header className="topbar">
        <h1>GymPlate</h1>
        <p>训练、饮食、身体数据，三件事每天快速闭环。</p>
      </header>

      {page === "training" && (
        <section className="page">
          <article className="hero-card">
            <div>
              <span className="label">今日训练</span>
              <h2>胸背肩 · 固定周计划</h2>
              <p>{completedSets.length}/{record.exercises.flatMap(item => item.sets).length} 组完成 · 训练容量 {Math.round(volume / 100) / 10} t</p>
            </div>
          </article>

          {record.exercises.map(exercise => (
            <article className="card stack" key={exercise.id}>
              <div className="section-head compact">
                <div>
                  <span className="label">{exercise.muscleGroup} · 休息 {exercise.restSeconds}s</span>
                  <h2>{exercise.exerciseName}</h2>
                </div>
                <button className="icon-btn" onClick={() => addSet(exercise.id)} aria-label="添加一组">+</button>
              </div>
              <div className="set-head">
                <span>组</span>
                <span>重量 kg</span>
                <span>次数</span>
                <span>完成</span>
              </div>
              {exercise.sets.map(set => (
                <div className={`set-row ${set.completed ? "done" : ""}`} key={set.id}>
                  <strong>{set.setIndex}</strong>
                  <input inputMode="decimal" value={set.weightKg} onChange={event => updateSet(exercise.id, set.id, { weightKg: Number(event.target.value) || 0 })} />
                  <input inputMode="numeric" value={set.reps} onChange={event => updateSet(exercise.id, set.id, { reps: Number(event.target.value) || 0 })} />
                  <button className="check-btn" onClick={() => updateSet(exercise.id, set.id, { completed: !set.completed })}>{set.completed ? "✓" : ""}</button>
                  <button className="delete-link" onClick={() => deleteSet(exercise.id, set.id)}>删除</button>
                </div>
              ))}
            </article>
          ))}
        </section>
      )}

      {page === "food" && (
        <section className="page">
          <article className="hero-card">
            <div>
              <span className="label">今日饮食</span>
              <h2>{remaining >= 0 ? `还差 ${remaining} kcal` : `超出 ${Math.abs(remaining)} kcal`}</h2>
              <p>目标 {target.calories} kcal · 已记录 {mealTotal.calories} kcal</p>
            </div>
            <div className="bar"><i style={{ width: progress(mealTotal.calories, target.calories) }} /></div>
          </article>

          <article className="card stack">
            <div className="section-head compact">
              <div>
                <span className="label">快速记录</span>
                <h2>一句话生成，确认才入账</h2>
              </div>
            </div>
            <select className="select" value={slot} onChange={event => setSlot(event.target.value as MealSlot)}>
              {slots.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <textarea className="textarea" value={mealText} onChange={event => setMealText(event.target.value)} placeholder="例如：午餐250克米饭150克鸡胸肉，或者 两个鸡蛋一杯牛奶" />
            <button className="btn primary" onClick={parseMeal} disabled={parsing}>{parsing ? "正在解析" : "生成待确认"}</button>
            {parseError && <p className="hint">{parseError}</p>}
            {pending.length > 0 && (
              <div className="stack">
                <div className="inline-total">
                  <span>待确认</span>
                  <strong>{pendingTotal.calories} kcal · P {pendingTotal.protein} / C {pendingTotal.carbs} / F {pendingTotal.fat}</strong>
                </div>
                {pending.map(entry => (
                  <EditableMealRow
                    key={entry.id}
                    entry={entry}
                    onChange={patch => updatePending(entry.id, patch)}
                    onDelete={() => setPending(items => items.filter(item => item.id !== entry.id))}
                  />
                ))}
                <button className="btn dark" onClick={confirmMeal}>确认加入今天</button>
              </div>
            )}
          </article>

          <article className="card stack">
            <div className="section-head compact">
              <div>
                <span className="label">常用餐</span>
                <h2>每天重复的饭，点一次加入</h2>
              </div>
            </div>
            <div className="slot-tabs">
              {slots.map(item => (
                <button key={item.id} className={selectedTemplateSlot === item.id ? "active" : ""} onClick={() => setSelectedTemplateSlot(item.id)}>{item.label}</button>
              ))}
            </div>
            <div className="template-grid">
              {templates.filter(template => template.slot === selectedTemplateSlot).map(template => {
                const total = totalMacros(template.entries);
                return (
                  <button className="template-card" key={template.id} onClick={() => addTemplate(template)}>
                    <strong>{template.name}</strong>
                    <p>{total.calories} kcal · P {total.protein} / C {total.carbs} / F {total.fat}</p>
                  </button>
                );
              })}
            </div>
          </article>

          <article className="card stack">
            <div className="section-head compact">
              <div>
                <span className="label">今日餐盘</span>
                <h2>可删除，也可修正营养</h2>
              </div>
            </div>
            {slots.map(item => {
              const meals = record.meals.filter(meal => meal.slot === item.id);
              const slotTotal = totalMacros(meals);
              return (
                <div className="meal-group" key={item.id}>
                  <div className="inline-total">
                    <span>{item.label}</span>
                    <strong>{meals.length ? `${slotTotal.calories} kcal` : "未记录"}</strong>
                  </div>
                  {meals.map(entry => (
                    <EditableMealRow key={entry.id} entry={entry} onChange={patch => updateMeal(entry.id, patch)} onDelete={() => deleteMeal(entry.id)} />
                  ))}
                  {meals.length > 0 && <button className="btn soft" onClick={() => saveCurrentSlotAsTemplate(item.id)}>保存这一餐为常用餐</button>}
                </div>
              );
            })}
          </article>
        </section>
      )}

      {page === "data" && (
        <section className="page">
          <article className="hero-card">
            <div>
              <span className="label">今日结算</span>
              <h2>{record.date}</h2>
              <p>记录完整度：饮食 {record.meals.length ? "已填" : "未填"} · 训练 {completedSets.length ? "已练" : "未练"}</p>
            </div>
          </article>

          <article className="card stack">
            <div className="section-head compact">
              <div>
                <span className="label">身体日志</span>
                <h2>每天一眼看差距</h2>
              </div>
            </div>
            <div className="field-grid">
              <label>体重 kg<input inputMode="decimal" value={record.weightKg} onChange={event => setRecord(current => ({ ...current, weightKg: Number(event.target.value) || 0 }))} /></label>
              <label>步数<input inputMode="numeric" value={record.steps} onChange={event => setRecord(current => ({ ...current, steps: Number(event.target.value) || 0 }))} /></label>
              <label>睡眠 h<input inputMode="decimal" value={record.sleepHours} onChange={event => setRecord(current => ({ ...current, sleepHours: Number(event.target.value) || 0 }))} /></label>
              <label>心情<input value={record.mood} onChange={event => setRecord(current => ({ ...current, mood: event.target.value }))} /></label>
            </div>
          </article>

          <article className="card stack">
            <div className="grid-2">
              <Summary label="热量" value={`${mealTotal.calories} kcal`} sub={remaining >= 0 ? `还差 ${remaining}` : `超 ${Math.abs(remaining)}`} />
              <Summary label="蛋白质" value={`${mealTotal.protein} g`} sub={`目标 ${target.protein}g`} />
              <Summary label="训练容量" value={`${Math.round(volume / 100) / 10} t`} sub={`${completedSets.length} 组完成`} />
              <Summary label="身体" value={`${record.weightKg} kg`} sub={`${record.steps} 步 · ${record.sleepHours}h`} />
            </div>
            <MacroLine label="热量进度" value={mealTotal.calories} target={target.calories} unit="kcal" />
            <MacroLine label="蛋白质进度" value={mealTotal.protein} target={target.protein} unit="g" />
            <MacroLine label="碳水进度" value={mealTotal.carbs} target={target.carbs} unit="g" />
            <MacroLine label="脂肪进度" value={mealTotal.fat} target={target.fat} unit="g" />
          </article>
        </section>
      )}

      <nav className="bottom-tabs" aria-label="主导航">
        <button className={page === "training" ? "active" : ""} onClick={() => setPage("training")}>训练</button>
        <button className={page === "food" ? "active" : ""} onClick={() => setPage("food")}>饮食</button>
        <button className={page === "data" ? "active" : ""} onClick={() => setPage("data")}>数据</button>
      </nav>
    </main>
  );
}

function EditableMealRow({ entry, onChange, onDelete }: { entry: MealEntry; onChange: (patch: Partial<MealEntry>) => void; onDelete: () => void }) {
  return (
    <div className="meal-card">
      <div className="meal-title">
        <strong>{entry.foodName}</strong>
        <button className="delete-link" onClick={onDelete}>删除</button>
      </div>
      <p>{entry.source === "user-template" ? "来自常用餐" : entry.source === "ai-estimate" ? "估算值，可改" : "按基础食物库估算"}</p>
      <div className="macro-edit-grid">
        <label>克<input inputMode="decimal" value={entry.grams} onChange={event => onChange({ grams: Number(event.target.value) || 0 })} /></label>
        <label>热量<input inputMode="decimal" value={entry.calories} onChange={event => onChange({ calories: Number(event.target.value) || 0, macroEdited: true })} /></label>
        <label>蛋白<input inputMode="decimal" value={entry.protein} onChange={event => onChange({ protein: Number(event.target.value) || 0, macroEdited: true })} /></label>
        <label>碳水<input inputMode="decimal" value={entry.carbs} onChange={event => onChange({ carbs: Number(event.target.value) || 0, macroEdited: true })} /></label>
        <label>脂肪<input inputMode="decimal" value={entry.fat} onChange={event => onChange({ fat: Number(event.target.value) || 0, macroEdited: true })} /></label>
      </div>
    </div>
  );
}

function MacroLine({ label, value, target, unit }: { label: string; value: number; target: number; unit: string }) {
  return (
    <div className="macro-row">
      <div className="macro-meta"><span>{label}</span><span>{value}/{target}{unit}</span></div>
      <div className="bar"><i style={{ width: progress(value, target) }} /></div>
    </div>
  );
}

function Summary({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="summary-tile">
      <span className="label">{label}</span>
      <strong>{value}</strong>
      <p>{sub}</p>
    </div>
  );
}

function makeExercise(id: string, exerciseName: string, muscleGroup: string, setCount: number, weightKg: number, reps: number): ExercisePlan {
  return {
    id,
    exerciseName,
    muscleGroup,
    restSeconds: 90,
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

function resequenceSets(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.map((set, index) => ({ ...set, setIndex: index + 1 }));
}

function recalcMeal(entry: MealEntry, patch: Partial<MealEntry>, id: string): MealEntry {
  if (entry.id !== id) return entry;
  return { ...entry, ...patch };
}

function progress(value: number, target: number): string {
  if (!target) return "0%";
  return `${Math.min(100, Math.max(0, Math.round(value / target * 100)))}%`;
}

function normalizeApiMeals(meals: unknown, fallbackSlot: MealSlot, rawText: string): MealEntry[] {
  if (!Array.isArray(meals)) return parseMealText(rawText, fallbackSlot);
  const normalized = meals.map((meal) => {
    const item = meal as Partial<MealEntry>;
    return {
      id: item.id ?? crypto.randomUUID(),
      slot: isMealSlot(item.slot) ? item.slot : fallbackSlot,
      foodName: String(item.foodName || "自定义一餐"),
      grams: numeric(item.grams),
      calories: numeric(item.calories),
      protein: numeric(item.protein),
      carbs: numeric(item.carbs),
      fat: numeric(item.fat),
      source: item.source ?? "ai-estimate",
      macroEdited: Boolean(item.macroEdited)
    } satisfies MealEntry;
  });
  return normalized.length ? normalized : parseMealText(rawText, fallbackSlot);
}

function isMealSlot(value: unknown): value is MealSlot {
  return value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack";
}

function numeric(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue * 10) / 10) : 0;
}
