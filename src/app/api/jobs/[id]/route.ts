import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { MOCK_JOBS, isMockMode } from "@/lib/mock-data";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (isMockMode()) {
    const job = MOCK_JOBS.find((j) => j.id === id) ?? MOCK_JOBS[0];
    return job
      ? NextResponse.json(job)
      : NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("jobs")
    .select("*, applications(count)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (isMockMode()) {
    return NextResponse.json({ id, ...(body as object) });
  }

  const allowed = ["status", "escrow_note"] as const;
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if ((body as Record<string, unknown>)[key] !== undefined) {
      updates[key] = (body as Record<string, unknown>)[key];
    }
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
  return NextResponse.json(data);
}
