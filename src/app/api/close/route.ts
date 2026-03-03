import "dotenv/config";
import { NextResponse } from "next/server";
import { buildWorkflow } from "@/lib/fsm/engine";
import crypto from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const app = buildWorkflow();

  const body = (await request.json()) as {
    repo?: string;
    issueNumber?: number;
  };

  if (typeof body?.repo !== "string" || typeof body?.issueNumber !== "number") {
    return NextResponse.json(
      { error: "Invalid body. Expected { repo: string, issueNumber: number }." },
      { status: 400 }
    );
  }

  const workflowId = crypto.randomUUID();
  const startedAt = new Date().toISOString();

  // Initialize FSM at the state that leads to closeIssue
  const result = await app.invoke(
    {
      workflowId,
      status: "close_requested", // set to the state that routes to closeIssue
      reviewCycles: 0,
      stepCount: 0,
      message: "",
      description: "",
      repo: body.repo,
      issueNumber: body.issueNumber,
      startedAt,
    },
    { recursionLimit: 25 }
  );

  return NextResponse.json({
    workflowId,
    result,
  });
}
