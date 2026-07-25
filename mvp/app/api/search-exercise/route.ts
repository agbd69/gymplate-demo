import { NextResponse } from "next/server";
import { searchExerciseCatalog } from "@/lib/exercise-search.mjs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 8);
  return NextResponse.json({ exercises: searchExerciseCatalog(query, Math.min(Math.max(limit, 1), 20)) });
}
