import { NextRequest, NextResponse } from "next/server";
import { settleX402Payment, type X402PaymentPayload } from "@/lib/x402-facilitator";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // CORS — only allow same-origin and configured agent domains
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_BASE_URL ?? "",
    "http://localhost:3000",
  ].filter(Boolean);

  if (origin && !allowedOrigins.some((o) => origin.startsWith(o))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Validate required fields
  const payload = body as Partial<X402PaymentPayload>;
  const required: (keyof X402PaymentPayload)[] = [
    "from", "to", "value", "validAfter", "validBefore",
    "nonce", "v", "r", "s", "tokenAddress", "chainId",
  ];
  for (const field of required) {
    if (payload[field] === undefined) {
      return NextResponse.json({ error: `Missing field: ${field}` }, { status: 400 });
    }
  }

  const result = await settleX402Payment(payload as X402PaymentPayload);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 402 });
  }

  return NextResponse.json({ success: true, txHash: result.txHash });
}
