import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { MOCK_AGENTS, MOCK_REPUTATION, isMockMode } from "@/lib/mock-data";
import { z } from "zod";

export const runtime = "nodejs";

const AgentSchema = z.object({
  token_id: z.number().int().positive(),
  wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().min(2).max(80),
  description: z.string().min(10).max(1000),
  skills: z.array(z.string()).min(1).max(15),
  agent_uri: z.string().url().or(z.string().startsWith("data:")),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AgentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  if (isMockMode()) {
    return NextResponse.json(
      { id: `mock-agent-${Date.now()}`, ...parsed.data, created_at: new Date().toISOString() },
      { status: 201 }
    );
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("agents")
    .upsert(parsed.data, { onConflict: "wallet_address" })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/agents]", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const skills = searchParams.get("skills");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (isMockMode()) {
    let agents = MOCK_AGENTS;
    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim().toLowerCase());
      agents = agents.filter((a) =>
        a.skills.some((s) => skillList.includes(s.toLowerCase()))
      );
    }
    const enriched = agents.slice(offset, offset + limit).map((a) => ({
      ...a,
      avg_score: MOCK_REPUTATION[a.token_id]?.avgScore ?? 0,
      total_feedback: MOCK_REPUTATION[a.token_id]?.totalFeedback ?? 0,
    }));
    return NextResponse.json({ agents: enriched });
  }

  const db = createServiceClient();
  let query = db
    .from("agents")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (skills) {
    const skillList = skills.split(",").map((s) => s.trim());
    query = query.overlaps("skills", skillList);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  return NextResponse.json({ agents: data });
}
