import { NextResponse } from "next/server";
import { listPublicTools } from "@/lib/tools/registry";
import { searchTools } from "@/config/tools";

export const runtime = "nodejs";
export const revalidate = 300;

/** Public catalogue. System prompts are stripped by `listPublicTools`. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const category = searchParams.get("category");

  let tools = await listPublicTools();

  if (query) {
    const matches = new Set(searchTools(query).map((t) => t.slug));
    tools = tools.filter((t) => matches.has(t.slug));
  }
  if (category) {
    tools = tools.filter((t) => t.category === category);
  }

  return NextResponse.json({ tools });
}
