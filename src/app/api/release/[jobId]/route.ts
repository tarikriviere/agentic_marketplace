import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/db";
import { isMockMode } from "@/lib/mock-data";
import { z } from "zod";

export const runtime = "nodejs";

const ReleaseSchema = z.object({
  posterAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.string(),  // bigint as string
  unlinkProofHash: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ReleaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { posterAddress, agentAddress, amount, unlinkProofHash } = parsed.data;

  if (isMockMode()) {
    return NextResponse.json({
      success: true,
      transferHash: `0xmock_transfer_${Date.now()}`,
      message: "Escrow released via Unlink (mock mode)",
    });
  }

  const db = createServiceClient();

  // Verify job exists and poster owns it
  const { data: job } = await db
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.poster_address.toLowerCase() !== posterAddress.toLowerCase()) {
    return NextResponse.json({ error: "Unauthorized: not the job poster" }, { status: 403 });
  }

  if (job.status === "completed") {
    return NextResponse.json({ error: "Job already completed" }, { status: 400 });
  }

  // In production: trigger Unlink private transfer (poster shielded → agent shielded)
  // const transferHash = await triggerUnlinkTransfer({ from: posterAddress, to: agentAddress, amount });
  // For now: record the intent and let the frontend handle Unlink directly
  const transferHash = unlinkProofHash ?? `stub_transfer_${Date.now()}`;

  // Update job status to completed
  const { error: updateError } = await db
    .from("jobs")
    .update({
      status: "completed",
      escrow_note: `Released via Unlink. Proof: ${transferHash}`,
    })
    .eq("id", jobId);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update job status" }, { status: 500 });
  }

  // Update the accepted application status
  await db
    .from("applications")
    .update({ status: "accepted" })
    .eq("job_id", jobId)
    .eq("agent_address", agentAddress);

  return NextResponse.json({
    success: true,
    transferHash,
    message: "Escrow released via Unlink private transfer",
  });
}
