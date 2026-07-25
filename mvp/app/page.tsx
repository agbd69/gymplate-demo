"use client";

import { useEffect, useMemo, useState } from "react";
import type { DailyRecord, Goal, MealEntry, MealSlot, MealTemplate, PlanSettings, Profile, WorkoutSet } from "@/lib/types";
import { parseMealText, totalMacros } from "@/lib/nutrition";
import { defaultPlanSettings, defaultProfile, defaultRecord, defaultTemplates } from "@/lib/default-state";
import { loadStoredState, saveStoredState, type StorageStatus } from "@/lib/app-storage";
import { getAuthState, initialAuthState, listenForAuthChanges, sendMagicLink, signOut, type AuthState } from "@/lib/auth";
import { makeProfileMetrics, makeWeeklyPlan } from "@/lib/planner.mjs";
import { addHistoryRecord, createNextDayRecord, restoreHistoryRecord, trendFromHistory, type HistorySummary } from "@/lib/history.mjs";
import type { CatalogFood } from "@/lib/food-search.mjs";
import type { CatalogExercise } from "@/lib/exercise-search.mjs";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

const slots: Array<{ id: MealSlot; label: string }> = [
  { id: "breakfast", label: "早餐" },
  { id: "lunch", label: "午餐" },
  { id: "dinner", label: "晚餐" },
  { id: "snack", label: "加餐" }
];

const slotsOfWeek = [
  { id: 1, label: "一" },
  { id: 2, label: "二" },
  { id: 3, label: "三" },
  { id: 4, label: "四" },
  { id: 5, label: "五" },
  { id: 6, label: "六" },
  { id: 7, label: "日" }
];

export default function HomePage() {
  const [page, setPage] = useState<"training" | "food" | "data">("food");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [planSettings, setPlanSettings] = useState<PlanSettings>(defaultPlanSettings);
  const [templates, setTemplates] = useState<MealTemplate[]>(() => defaultTemplates());
  const [record, setRecord] = useState<DailyRecord>(() => defaultRecord());
  const [history, setHistory] = useState<HistorySummary[]>([]);
  const [slot, setSlot] = useState<MealSlot>("lunch");
  const [mealText, setMealText] = useState("");
  const [pending, setPending] = useState<MealEntry[]>([]);
  const [foodQuery, setFoodQuery] = useState("");
  const [foodGrams, setFoodGrams] = useState(100);
  const [foodResults, setFoodResults] = useState<CatalogFood[]>([]);
  const [foodSearching, setFoodSearching] = useState(false);
  const [exerciseQuery, setExerciseQuery] = useState("");
  const [exerciseResults, setExerciseResults] = useState<CatalogExercise[]>([]);
  const [exerciseSearching, setExerciseSearching] = useState(false);
  const [selectedTemplateSlot, setSelectedTemplateSlot] = useState<MealSlot>("lunch");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [voiceMessage, setVoiceMessage] = useState("");
  const [listening, setListening] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus>({ mode: "local", message: "准备保存" });
  const [authState, setAuthState] = useState<AuthState>(() => initialAuthState());
  const [email, setEmail] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const target = useMemo(() => makeProfileMetrics(profile), [profile]);
  const weeklyPlan = useMemo(() => makeWeeklyPlan(profile, planSettings), [profile, planSettings]);
  const todayTrainingDay = useMemo(() => weeklyPlan.find(day => day.weekday === weekdayFromDate(record.date)), [weeklyPlan, record.date]);
  const trend = useMemo(() => trendFromHistory(history), [history]);
  const mealTotal = useMemo(() => totalMacros(record.meals), [record.meals]);
  const pendingTotal = useMemo(() => totalMacros(pending), [pending]);
  const remaining = target.calories - mealTotal.calories;
  const completedSets = record.exercises.flatMap(item => item.sets).filter(set => set.completed);
  const volume = completedSets.reduce((sum, set) => sum + set.weightKg * set.reps, 0);

  useEffect(() => {
    let active = true;
    Promise.all([
      getAuthState(),
      loadStoredState({ profile, record, templates, planSettings, history })
    ]).then(([auth, stored]) => {
      if (!active) return;
      setAuthState(auth);
      setProfile(stored.state.profile);
      setRecord(stored.state.record);
      setTemplates(stored.state.templates);
      setPlanSettings(stored.state.planSettings);
      setHistory(stored.state.history);
      setStorageStatus(stored.status);
      setHydrated(true);
    });
    const stop = listenForAuthChanges((auth) => {
      setAuthState(auth);
      loadStoredState({ profile, record, templates, planSettings, history }).then(({ state, status }) => {
        setProfile(state.profile);
        setRecord(state.record);
        setTemplates(state.templates);
        setPlanSettings(state.planSettings);
        setHistory(state.history);
        setStorageStatus(status);
      });
    });
    return () => {
      active = false;
      stop();
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timeout = window.setTimeout(() => {
      saveStoredState({ profile, record, templates, planSettings, history }).then(setStorageStatus);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [hydrated, profile, record, templates, planSettings, history]);

  async function parseMeal() {
    if (!mealText.trim()) return;
    setParsing(true);
    setParseError("");
    try {
      const response = await fetch("/api/parse-meal", {
        method: "POST",
        signal: createTimeoutSignal(6000),
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

  async function searchCatalog() {
    if (!foodQuery.trim()) return;
    setFoodSearching(true);
    try {
      const response = await fetch(`/api/search-food?q=${encodeURIComponent(foodQuery.trim())}&limit=8`);
      if (!response.ok) throw new Error("search failed");
      const data = await response.json();
      setFoodResults(Array.isArray(data.foods) ? data.foods : []);
    } finally {
      setFoodSearching(false);
    }
  }

  function addCatalogFood(food: CatalogFood) {
    const scale = foodGrams / 100;
    setPending(current => [...current, {
      id: crypto.randomUUID(),
      slot,
      foodName: food.name,
      grams: foodGrams,
      calories: Math.round(food.calories * scale),
      protein: roundMacro(food.protein * scale),
      carbs: roundMacro(food.carbs * scale),
      fat: roundMacro(food.fat * scale),
      source: "food-db",
      macroEdited: false
    }]);
  }

  async function searchExercises() {
    if (!exerciseQuery.trim()) return;
    setExerciseSearching(true);
    try {
      const response = await fetch(`/api/search-exercise?q=${encodeURIComponent(exerciseQuery.trim())}&limit=8`);
      if (!response.ok) throw new Error("search failed");
      const data = await response.json();
      setExerciseResults(Array.isArray(data.exercises) ? data.exercises : []);
    } finally {
      setExerciseSearching(false);
    }
  }

  function addCatalogExercise(exercise: CatalogExercise) {
    setRecord(current => ({
      ...current,
      exercises: [...current.exercises, makeExerciseFromCatalog(exercise, planSettings.setsPerExercise)]
    }));
  }

  async function requestLogin() {
    if (!email.trim()) return;
    setAuthBusy(true);
    setAuthMessage("");
    try {
      await sendMagicLink(email.trim());
      setAuthMessage("登录链接已发送，请查看邮箱。");
    } catch {
      setAuthMessage("发送失败，请检查 Supabase 配置。");
    } finally {
      setAuthBusy(false);
    }
  }

  async function requestSignOut() {
    setAuthBusy(true);
    setAuthMessage("");
    try {
      await signOut();
      setAuthMessage("已退出，继续本地保存。");
    } catch {
      setAuthMessage("退出失败，请稍后再试。");
    } finally {
      setAuthBusy(false);
    }
  }

  function confirmMeal() {
    if (!pending.length) return;
    setRecord(current => ({ ...current, meals: [...current.meals, ...pending] }));
    setPending([]);
    setMealText("");
  }

  function addTemplate(template: MealTemplate) {
    const entries = cloneTemplateEntries(template);
    setRecord(current => ({ ...current, meals: [...current.meals, ...entries] }));
  }

  function applyDailyMealDefaults() {
    const defaults = slots.flatMap(({ id }) => {
      const template = templates.find(item => item.slot === id);
      return template ? cloneTemplateEntries(template) : [];
    });
    if (!defaults.length) return;
    setRecord(current => ({
      ...current,
      meals: [
        ...current.meals.filter(meal => meal.source !== "user-template" || !meal.id.includes("templateApplied")),
        ...defaults
      ]
    }));
  }

  function applySlotDefault(activeSlot: MealSlot) {
    const template = templates.find(item => item.slot === activeSlot);
    if (!template) return;
    const entries = cloneTemplateEntries(template);
    setRecord(current => ({
      ...current,
      meals: [
        ...current.meals.filter(meal => !(meal.slot === activeSlot && meal.source === "user-template" && meal.id.includes("templateApplied"))),
        ...entries
      ]
    }));
  }

  function startVoiceMealInput() {
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceMessage("当前浏览器不支持语音输入，可以用系统键盘的听写按钮。");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) setMealText(current => current ? `${current} ${transcript}` : transcript);
    };
    recognition.onerror = () => setVoiceMessage("语音识别失败，再试一次或直接输入。");
    recognition.onend = () => setListening(false);
    setVoiceMessage("");
    setListening(true);
    recognition.start();
  }

  function deleteTemplate(templateId: string) {
    setTemplates(current => current.filter(template => template.id !== templateId));
    setEditingTemplateId(current => current === templateId ? null : current);
  }

  function updateTemplate(templateId: string, patch: Partial<MealTemplate>) {
    setTemplates(current => current.map(template => template.id === templateId ? { ...template, ...patch } : template));
  }

  function updateTemplateEntry(templateId: string, entryId: string, patch: Partial<MealEntry>) {
    setTemplates(current => current.map(template => template.id === templateId
      ? { ...template, entries: template.entries.map(entry => recalcMeal(entry, patch, entryId)) }
      : template));
  }

  function deleteTemplateEntry(templateId: string, entryId: string) {
    setTemplates(current => current.map(template => template.id === templateId
      ? { ...template, entries: template.entries.filter(entry => entry.id !== entryId) }
      : template));
  }

  function addManualTemplateEntry(templateId: string) {
    setTemplates(current => current.map(template => template.id === templateId
      ? {
          ...template,
          entries: [
            ...template.entries,
            {
              id: crypto.randomUUID(),
              slot: template.slot,
              foodName: "自定义食物",
              grams: 100,
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
              source: "user-template",
              macroEdited: true
            }
          ]
        }
      : template));
  }

  function addManualPendingMeal() {
    setPending(current => [
      ...current,
      {
        id: crypto.randomUUID(),
        slot,
        foodName: "自定义食物",
        grams: 100,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        source: "manual",
        macroEdited: true
      }
    ]);
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

  function updateProfile(patch: Partial<Profile>) {
    setProfile(current => ({ ...current, ...patch }));
  }

  function updateTrainingDays(value: number) {
    updateProfile({ trainingDays: value });
    setPlanSettings(current => ({
      ...current,
      trainingWeekdays: current.trainingWeekdays.slice(0, value)
    }));
  }

  function updatePlanSettings(patch: Partial<PlanSettings>) {
    setPlanSettings(current => ({ ...current, ...patch }));
  }

  function toggleTrainingWeekday(weekday: number) {
    setPlanSettings(current => {
      const selected = current.trainingWeekdays.includes(weekday)
        ? current.trainingWeekdays.filter(day => day !== weekday)
        : [...current.trainingWeekdays, weekday].sort((a, b) => a - b);
      return {
        ...current,
        trainingWeekdays: selected.slice(0, profile.trainingDays)
      };
    });
  }

  function applyGeneratedPlan() {
    setRecord(current => ({ ...current, exercises: todayTrainingDay?.type === "training" ? todayTrainingDay.exercises : [] }));
    setPage("training");
  }

  function settleToday() {
    setHistory(current => addHistoryRecord(current, record));
  }

  function settleAndStartNextDay() {
    setHistory(current => addHistoryRecord(current, record));
    setRecord(current => createNextDayRecord(current));
  }

  function restoreHistory(summary: HistorySummary) {
    setRecord(current => restoreHistoryRecord(summary, current));
  }

  return (
    <main className="phone-shell">
      <header className="topbar">
        <div>
          <h1>GymPlate</h1>
          <p>训练、饮食、身体数据，三件事每天快速闭环。</p>
        </div>
        <span className={`sync-pill ${storageStatus.mode}`}>{storageStatus.message}</span>
      </header>

      <section className="auth-strip">
        {authState.configured ? (
          authState.signedIn ? (
            <>
              <span>已登录 {authState.email}</span>
              <button className="delete-link" onClick={requestSignOut} disabled={authBusy}>退出</button>
            </>
          ) : (
            <>
              <input value={email} onChange={event => setEmail(event.target.value)} inputMode="email" placeholder="邮箱登录后云同步" />
              <button className="btn soft" onClick={requestLogin} disabled={authBusy}>{authBusy ? "发送中" : "发送登录链接"}</button>
            </>
          )
        ) : (
          <span>未配置 Supabase，当前为本地单机模式。</span>
        )}
        {authMessage && <p>{authMessage}</p>}
      </section>

      {page === "training" && (
        <section className="page">
          <article className="hero-card">
            <div>
              <span className="label">今日训练</span>
              <h2>{todayTrainingDay?.type === "training" ? "今日训练日" : "今日休息日"} · 固定周计划</h2>
              <p>{completedSets.length}/{record.exercises.flatMap(item => item.sets).length} 组完成 · 训练容量 {Math.round(volume / 100) / 10} t</p>
            </div>
          </article>

          <article className="card stack">
            <div className="section-head compact">
              <div>
                <span className="label">计划生成器</span>
                <h2>按你的目标生成固定周计划</h2>
              </div>
              <button className="btn dark" onClick={applyGeneratedPlan}>生成</button>
            </div>
            <div className="field-grid">
              <label>每周训练<input inputMode="numeric" value={profile.trainingDays} onChange={event => updateTrainingDays(numberFromInput(event.target.value, 1, 7))} /></label>
              <label>每天动作<input inputMode="numeric" value={planSettings.exerciseCount} onChange={event => updatePlanSettings({ exerciseCount: numberFromInput(event.target.value, 2, 8) })} /></label>
              <label>每动作组数<input inputMode="numeric" value={planSettings.setsPerExercise} onChange={event => updatePlanSettings({ setsPerExercise: numberFromInput(event.target.value, 1, 6) })} /></label>
              <label>目标
                <select value={profile.goal} onChange={event => updateProfile({ goal: event.target.value as Goal })}>
                  <option value="cut">减脂</option>
                  <option value="maintain">维持</option>
                  <option value="bulk">增肌</option>
                </select>
              </label>
            </div>
            <div className="weekday-picker" aria-label="固定训练日">
              {slotsOfWeek.map(day => (
                <button
                  key={day.id}
                  className={planSettings.trainingWeekdays.includes(day.id) ? "active" : ""}
                  onClick={() => toggleTrainingWeekday(day.id)}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="week-strip">
              {weeklyPlan.map(day => (
                <span className={day.type === "training" ? "active" : ""} key={day.weekday}>
                  周{["一", "二", "三", "四", "五", "六", "日"][day.weekday - 1]}
                </span>
              ))}
            </div>
          </article>

          <article className="card stack">
            <div className="section-head compact">
              <div>
                <span className="label">动作库</span>
                <h2>搜索并加入今日训练</h2>
              </div>
            </div>
            <div className="catalog-search">
              <div className="action-row compact">
                <input value={exerciseQuery} onChange={event => setExerciseQuery(event.target.value)} placeholder="搜部位或动作，如 背 / row" />
                <button className="btn soft" onClick={searchExercises} disabled={exerciseSearching}>{exerciseSearching ? "搜索中" : "搜索动作"}</button>
              </div>
              {exerciseResults.length > 0 && (
                <div className="exercise-results">
                  {exerciseResults.map(exercise => (
                    <button key={exercise.id} onClick={() => addCatalogExercise(exercise)}>
                      <img src={exercise.media.gif} alt={`${exercise.name} 动作演示`} loading="lazy" />
                      <span><strong>{exercise.name}</strong><em>{exercise.part} · {exercise.equipment || "通用"}</em></span>
                    </button>
                  ))}
                </div>
              )}
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
              {exercise.media?.gif && (
                <div className="exercise-guide">
                  <img src={exercise.media.gif} alt={`${exercise.exerciseName} 动作演示`} loading="lazy" />
                  <ol>
                    {exercise.steps.slice(0, 3).map(step => <li key={step}>{step}</li>)}
                  </ol>
                </div>
              )}
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
                <span className="label">今日餐盘</span>
                <h2>默认先填，没吃就删</h2>
              </div>
              <button className="btn dark" onClick={applyDailyMealDefaults}>生成今日默认餐盘</button>
            </div>
            {slots.map(item => {
              const meals = record.meals.filter(meal => meal.slot === item.id);
              const slotTotal = totalMacros(meals);
              const template = templates.find(candidate => candidate.slot === item.id);
              return (
                <div className="meal-group" key={item.id}>
                  <div className="inline-total">
                    <span>{item.label}</span>
                    <strong>{meals.length ? `${slotTotal.calories} kcal` : "未记录"}</strong>
                  </div>
                  {meals.map(entry => (
                    <EditableMealRow key={entry.id} entry={entry} onChange={patch => updateMeal(entry.id, patch)} onDelete={() => deleteMeal(entry.id)} />
                  ))}
                  {meals.length === 0 && template && (
                    <button className="btn soft" onClick={() => applySlotDefault(item.id)}>填入默认{item.label}</button>
                  )}
                  {meals.length > 0 && <button className="btn soft" onClick={() => saveCurrentSlotAsTemplate(item.id)}>保存这一餐为常用餐</button>}
                </div>
              );
            })}
          </article>

          <article className="card stack">
            <div className="section-head compact">
              <div>
                <span className="label">快速记录</span>
                <h2>说一句或打一行，确认才入账</h2>
              </div>
            </div>
            <select className="select" value={slot} onChange={event => setSlot(event.target.value as MealSlot)}>
              {slots.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <textarea className="textarea" value={mealText} onChange={event => setMealText(event.target.value)} placeholder="例如：午餐250克米饭150克鸡胸肉，或者 两个鸡蛋一杯牛奶" />
            <div className="action-row">
              <button className="btn primary" onClick={parseMeal} disabled={parsing}>{parsing ? "正在解析" : "生成待确认"}</button>
              <button className="btn soft" onClick={startVoiceMealInput} disabled={listening}>{listening ? "正在听" : "语音输入"}</button>
            </div>
            {voiceMessage && <p className="hint">{voiceMessage}</p>}
            {parseError && <p className="hint">{parseError}</p>}
            <button className="btn soft" onClick={addManualPendingMeal}>手动补一条</button>
            <details className="catalog-search">
              <summary>精确查食物库</summary>
              <div className="action-row compact">
                <input value={foodQuery} onChange={event => setFoodQuery(event.target.value)} placeholder="查食物库，如 米饭 / 鸡胸" />
                <input inputMode="decimal" value={foodGrams} onChange={event => setFoodGrams(numberFromInput(event.target.value, 1, 5000))} aria-label="食物克数" />
              </div>
              <button className="btn soft" onClick={searchCatalog} disabled={foodSearching}>{foodSearching ? "搜索中" : `按 ${foodGrams}g 搜索食物库`}</button>
              {foodResults.length > 0 && (
                <div className="food-results">
                  {foodResults.map(food => (
                    <button key={food.id} onClick={() => addCatalogFood(food)}>
                      <strong>{food.name}</strong>
                      <span>{food.calories} kcal / 100g · P {food.protein} C {food.carbs} F {food.fat}</span>
                    </button>
                  ))}
                </div>
              )}
            </details>
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
                const isEditingTemplate = editingTemplateId === template.id;
                return (
                  <div className="template-card" key={template.id}>
                    {isEditingTemplate ? (
                      <input
                        className="template-name-input"
                        aria-label="常用餐名称"
                        value={template.name}
                        onChange={event => updateTemplate(template.id, { name: event.target.value })}
                      />
                    ) : (
                      <strong>{template.name}</strong>
                    )}
                    <p>{total.calories} kcal · P {total.protein} / C {total.carbs} / F {total.fat}</p>
                    {isEditingTemplate && (
                      <div className="template-editor">
                        {template.entries.map(entry => (
                          <EditableMealRow
                            key={entry.id}
                            entry={entry}
                            onChange={patch => updateTemplateEntry(template.id, entry.id, patch)}
                            onDelete={() => deleteTemplateEntry(template.id, entry.id)}
                          />
                        ))}
                        {!template.entries.length && <p className="hint">这个常用餐还没有食物，先添加一条再填。</p>}
                        <button className="btn soft" onClick={() => addManualTemplateEntry(template.id)}>添加食物</button>
                      </div>
                    )}
                    <div className="action-row compact">
                      <button className="btn primary" onClick={() => addTemplate(template)}>加入今天</button>
                      <button className="btn soft" onClick={() => setEditingTemplateId(isEditingTemplate ? null : template.id)}>
                        {isEditingTemplate ? "保存常用餐修改" : "编辑"}
                      </button>
                      <button className="btn soft danger" onClick={() => deleteTemplate(template.id)}>删除</button>
                    </div>
                  </div>
                );
              })}
            </div>
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
            <input className="date-input" type="date" value={record.date} onChange={event => setRecord(current => ({ ...current, date: event.target.value }))} />
            <div className="action-row">
              <button className="btn dark" onClick={settleToday}>保存今日到历史</button>
              <button className="btn soft" onClick={settleAndStartNextDay}>保存并开启下一天</button>
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
            <div className="section-head compact">
              <div>
                <span className="label">基础设置</span>
                <h2>BMI、基础代谢与目标摄入</h2>
              </div>
            </div>
            <div className="field-grid">
              <label>身高 cm<input inputMode="decimal" value={profile.heightCm} onChange={event => updateProfile({ heightCm: numberFromInput(event.target.value, 80, 230) })} /></label>
              <label>体重 kg<input inputMode="decimal" value={profile.weightKg} onChange={event => updateProfile({ weightKg: numberFromInput(event.target.value, 25, 250) })} /></label>
              <label>年龄<input inputMode="numeric" value={profile.age} onChange={event => updateProfile({ age: numberFromInput(event.target.value, 10, 100) })} /></label>
              <label>性别
                <select value={profile.sex} onChange={event => updateProfile({ sex: event.target.value as Profile["sex"] })}>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </label>
            </div>
            <div className="grid-2">
              <Summary label="BMI" value={`${target.bmi}`} sub="按身高体重计算" />
              <Summary label="基础代谢" value={`${target.bmr} kcal`} sub="Mifflin 公式估算" />
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

          <article className="card stack">
            <div className="section-head compact">
              <div>
                <span className="label">趋势</span>
                <h2>最近 {history.slice(-7).length || 0} 天</h2>
              </div>
            </div>
            <Trend label="体重" points={trend.weight} unit="kg" />
            <Trend label="热量" points={trend.calories} unit="kcal" />
            <Trend label="训练容量" points={trend.volume} unit="kg" />
            <div className="history-list">
              {history.slice(-5).reverse().map(item => (
                <button className="history-row" key={item.date} onClick={() => restoreHistory(item)}>
                  <strong>{item.date}</strong>
                  <span>{item.weightKg}kg · {item.calories}kcal · {Math.round(item.volume / 100) / 10}t</span>
                </button>
              ))}
              {!history.length && <p className="hint">保存今日后，这里会显示体重、热量和训练容量趋势。</p>}
            </div>
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
        <input aria-label="食物名称" value={entry.foodName} onChange={event => onChange({ foodName: event.target.value })} />
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

function Trend({ label, points, unit }: { label: string; points: Array<{ date: string; value: number }>; unit: string }) {
  const max = Math.max(...points.map(point => point.value), 1);
  const latest = points.at(-1);
  return (
    <div className="trend-card">
      <div className="inline-total">
        <span>{label}</span>
        <strong>{latest ? `${latest.value}${unit}` : "暂无"}</strong>
      </div>
      <div className="spark-bars">
        {(points.length ? points : [{ date: "empty", value: 0 }]).map(point => (
          <i key={point.date} style={{ height: `${Math.max(8, Math.round(point.value / max * 100))}%` }} />
        ))}
      </div>
    </div>
  );
}

function resequenceSets(sets: WorkoutSet[]): WorkoutSet[] {
  return sets.map((set, index) => ({ ...set, setIndex: index + 1 }));
}

function recalcMeal(entry: MealEntry, patch: Partial<MealEntry>, id: string): MealEntry {
  if (entry.id !== id) return entry;
  return { ...entry, ...patch };
}

function cloneTemplateEntries(template: MealTemplate): MealEntry[] {
  return template.entries.map((entry, index) => ({
    ...entry,
    id: `templateApplied-${template.id}-${crypto.randomUUID()}-${index}`,
    source: "user-template" as const
  }));
}

function weekdayFromDate(value: string): number {
  const date = new Date(`${value}T12:00:00`);
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

function progress(value: number, target: number): string {
  if (!target) return "0%";
  return `${Math.min(100, Math.max(0, Math.round(value / target * 100)))}%`;
}

function createTimeoutSignal(ms: number): AbortSignal {
  if (typeof AbortSignal !== "undefined" && "timeout" in AbortSignal) {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  window.setTimeout(() => controller.abort(), ms);
  return controller.signal;
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

function numberFromInput(value: string, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return min;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

function makeExerciseFromCatalog(exercise: CatalogExercise, setCount: number) {
  const defaultSet = exercise.sets?.[0] ?? [0, 10];
  const weightKg = Number(defaultSet[0] || 0);
  const reps = Number(defaultSet[1] || 10);
  return {
    id: `${exercise.id}-${crypto.randomUUID()}`,
    exerciseName: exercise.name,
    muscleGroup: exercise.part,
    restSeconds: weightKg ? 90 : 60,
    steps: exercise.steps.slice(0, 5),
    media: { gif: exercise.media.gif, thumbnail: exercise.media.thumbnail || "" },
    sets: Array.from({ length: setCount }, (_, index) => ({
      id: `${exercise.id}-${crypto.randomUUID()}-${index + 1}`,
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
