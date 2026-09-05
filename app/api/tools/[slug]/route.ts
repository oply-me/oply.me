import { NextResponse } from "next/server";
import { findPublicTool } from "@/lib/tools/registry";

export const runtime = "nodejs";
export const revalidate = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const tool = await findPublicTool(slug);

  if (!tool) {
    return NextResponse.json({ error: "Tool not found." }, { status: 404 });
  }

  return NextResponse.json({ tool });
}
