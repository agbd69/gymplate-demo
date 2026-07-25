import { NextResponse } from "next/server";
import { searchFoodCatalog } from "@/lib/food-search.mjs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 8);
  return NextResponse.json({ foods: searchFoodCatalog(query, Math.min(Math.max(limit, 1), 20)) });
}
