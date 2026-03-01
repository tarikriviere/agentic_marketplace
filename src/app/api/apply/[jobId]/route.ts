import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { buildPaymentRequired } from "@/lib/x402-facilitator";
import { isMockMode } from "@/lib/mock-data";
import { z } from "zod";

export const runtime = "nodejs";

const ApplySchema = z.object({
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentId: z.number().int().positive(),
  message: z.string().min(10).max(2000),
  x402TxHash: z.string().optional(),
  paymentPayload: z.object({
    from: z.string(),
    to: z.string(),
    value: z.string(),
    validAfter: z.string(),
    validBefore: z.string(),
    nonce: z.string(),
    v: z.number(),
    r: z.string(),
    s: z.string(),
    tokenAddress: z.string(),
    chainId: z.number(),
  }).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? `https://${req.headers.get("host")}`;

  // ── Step 1: Parse body ──────────────────────────────────────────────────
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ApplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { agentAddress, agentId, message, x402TxHash, paymentPayload } = parsed.data;

  // ── Mock mode: skip DB and return success ───────────────────────────────
  if (isMockMode()) {
    return NextResponse.json({
      success: true,
      application: {
        id: `mock-app-${Date.now()}`,
        job_id: jobId,
        agent_id: agentId,
        agent_address: agentAddress,
        x402_tx_hash: x402TxHash ?? "0xmock_payment",
        message,
        status: "pending",
        created_at: new Date().toISOString(),
      },
    }, { status: 201 });
  }

  // ── Step 2: Verify x402 payment ─────────────────────────────────────────
  // In production with proper x402 setup:
  // The payment header is validated server-side. Here we accept:
  // (a) a confirmed x402TxHash from the facilitator, OR
  // (b) a paymentPayload that we forward to our facilitator
  if (!x402TxHash && !paymentPayload) {
    const paymentRequired = buildPaymentRequired(baseUrl);
    return NextResponse.json(
      {
        error: "Payment required",
        paymentRequired,
      },
      {
        status: 402,
        headers: {
          "X-Payment-Required": JSON.stringify(paymentRequired),
        },
      }
    );
  }

  let confirmedTxHash = x402TxHash;

  if (paymentPayload && !x402TxHash) {
    // Forward to our facilitator for settlement
    const facilitatorRes = await fetch(`${baseUrl}/api/facilitator`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentPayload),
    });

    if (!facilitatorRes.ok) {
      const err = await facilitatorRes.json();
      return NextResponse.json({ error: `Payment failed: ${err.error}` }, { status: 402 });
    }

    const result = await facilitatorRes.json();
    confirmedTxHash = result.txHash;
  }

  // ── Step 3: Check job exists and is open ────────────────────────────────
  const db = createServiceClient();
  const { data: job } = await db
    .from("jobs")
    .select("id, status, poster_address")
    .eq("id", jobId)
    .single();

  if (!job || job.status !== "open") {
    return NextResponse.json({ error: "Job not found or not open" }, { status: 404 });
  }

  // Prevent poster from applying to their own job
  if (job.poster_address.toLowerCase() === agentAddress.toLowerCase()) {
    return NextResponse.json({ error: "Cannot apply to your own job" }, { status: 400 });
  }

  // Check for duplicate application
  const { data: existing } = await db
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("agent_address", agentAddress)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already applied to this job" }, { status: 409 });
  }

  // ── Step 4: Store application ───────────────────────────────────────────
  const { data: application, error } = await db
    .from("applications")
    .insert({
      job_id: jobId,
      agent_id: agentId,
      agent_address: agentAddress,
      x402_tx_hash: confirmedTxHash ?? "",
      message,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/apply]", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ success: true, application }, { status: 201 });
}

// GET — list applications for a job (poster only, off-chain auth via address param)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const posterAddress = req.headers.get("x-poster-address");

  const db = createServiceClient();

  // Verify requester is the job poster
  if (posterAddress) {
    const { data: job } = await db
      .from("jobs")
      .select("poster_address")
      .eq("id", jobId)
      .single();

    if (!job || job.poster_address.toLowerCase() !== posterAddress.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  const { data, error } = await db
    .from("applications")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ applications: data });
}
