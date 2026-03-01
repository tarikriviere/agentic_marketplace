import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { JobSchema } from "@/types/job";
import { MOCK_JOBS, isMockMode } from "@/lib/mock-data";

export const runtime = "nodejs";

// POST /api/jobs — create a job
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = JobSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  if (isMockMode()) {
    const mockJob = {
      id: `mock-${Date.now()}`,
      ...parsed.data,
      status: "open",
      created_at: new Date().toISOString(),
    };
    return NextResponse.json(mockJob, { status: 201 });
  }

  const db = createServiceClient();
  const { data, error } = await db
    .from("jobs")
    .insert({ ...parsed.data, status: "open" })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/jobs]", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET /api/jobs — list jobs with optional filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "open";
  const skills = searchParams.get("skills");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 100);
  const offset = parseInt(searchParams.get("offset") ?? "0");

  if (isMockMode()) {
    let jobs = MOCK_JOBS.filter((j) => j.status === status);
    if (skills) {
      const skillList = skills.split(",").map((s) => s.trim().toLowerCase());
      jobs = jobs.filter((j) =>
        j.skills.some((s) => skillList.includes(s.toLowerCase()))
      );
    }
    return NextResponse.json({ jobs: jobs.slice(offset, offset + limit), count: jobs.length });
  }

  const db = createServiceClient();
  let query = db
    .from("jobs")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (skills) {
    const skillList = skills.split(",").map((s) => s.trim());
    query = query.overlaps("skills", skillList);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("[GET /api/jobs]", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
  return NextResponse.json({ jobs: data, count });
}
