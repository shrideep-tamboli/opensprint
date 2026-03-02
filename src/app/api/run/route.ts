import { NextResponse } from "next/server";
import { buildWorkflow } from "@/lib/fsm/engine";
import { getLogs } from "@/lib/utils/logger";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST() {
  const app = buildWorkflow();

  const workflowId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  const result = await app.invoke(
    {
      workflowId,
      status: "msg_received",
      reviewCycles: 0,
      stepCount: 0,
      startedAt,
    },
    { recursionLimit: 25 } // 🔒 Recursion Guard
  );

  return NextResponse.json({
    workflowId,
    result,
    logs: getLogs(workflowId),
  });
}