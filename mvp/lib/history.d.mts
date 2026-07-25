import type { DailyRecord } from "./types";

export type HistorySummary = {
  date: string;
  weightKg: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  volume: number;
  completedSets: number;
  steps: number;
  sleepHours: number;
  mood: string;
};

export type TrendPoint = {
  date: string;
  value: number;
};

export function summarizeRecord(record: DailyRecord): HistorySummary;
export function addHistoryRecord(history: HistorySummary[], record: DailyRecord): HistorySummary[];
export function createNextDayRecord(record: DailyRecord): DailyRecord;
export function restoreHistoryRecord(summary: HistorySummary, currentRecord: DailyRecord): DailyRecord;
export function trendFromHistory(history: HistorySummary[]): {
  weight: TrendPoint[];
  calories: TrendPoint[];
  protein: TrendPoint[];
  volume: TrendPoint[];
};
