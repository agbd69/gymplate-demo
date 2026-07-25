import { NextResponse } from "next/server";
import { z } from "zod";
import { parseMealText } from "@/lib/nutrition";
import type { MealEntry, MealSlot } from "@/lib/types";

const requestSchema = z.object({
  text: z.string().min(1),
  slot: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional()
});

export async function POST(request: Request) {
  const body = requestSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid meal text" }, { status: 400 });
  }

  const fallback = parseMealText(body.data.text, body.data.slot ?? "lunch");
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ meals: fallback, source: "rules" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "把中文饮食口述解析为 JSON。只返回数组，每项包含 foodName, grams, calories, protein, carbs, fat, slot。无法确定时用合理估算。"
          },
          { role: "user", content: body.data.text }
        ]
      })
    });
    if (!response.ok) throw new Error(`OpenAI API ${response.status}`);
    const data = await response.json();
    const rawText = data.output_text ?? data.output?.[0]?.content?.[0]?.text;
    const parsed = normalizeMeals(JSON.parse(rawText), body.data.slot ?? "lunch");
    return NextResponse.json({ meals: parsed, source: "openai" });
  } catch {
    return NextResponse.json({ meals: fallback, source: "rules-fallback" });
  }
}

function normalizeMeals(value: unknown, fallbackSlot: MealSlot): MealEntry[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const meal = item as Partial<MealEntry>;
    return {
      id: crypto.randomUUID(),
      slot: isMealSlot(meal.slot) ? meal.slot : fallbackSlot,
      foodName: String(meal.foodName || "自定义一餐"),
      grams: numeric(meal.grams),
      calories: numeric(meal.calories),
      protein: numeric(meal.protein),
      carbs: numeric(meal.carbs),
      fat: numeric(meal.fat),
      source: "ai-estimate",
      macroEdited: false
    };
  });
}

function isMealSlot(value: unknown): value is MealSlot {
  return value === "breakfast" || value === "lunch" || value === "dinner" || value === "snack";
}

function numeric(value: unknown): number {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue * 10) / 10) : 0;
}
