import {
  StateGraph,
  StateSchema,
  START,
  END,
} from "@langchain/langgraph";
import { z } from "zod";
import { StatusValues } from "./transitions";
import { pmCreateIssue } from "../nodes/pmCreateIssue";
import { devCreatePR } from "../nodes/devCreatePR";
import { moveToReview } from "../nodes/moveToReview";
import { reviewPR } from "../nodes/reviewPR";
import { devUpdatePR } from "../nodes/devUpdatePR";
import { deploy } from "../nodes/deploy";
import { closeIssue } from "../nodes/closeIssue";
import { complete } from "../nodes/complete";

export const StatusEnum = z.enum(StatusValues);
export type StatusType = z.infer<typeof StatusEnum>;

const WorkflowState = new StateSchema({
  workflowId: z.string(),
  status: StatusEnum,
  reviewCycles: z.number().default(0),
  stepCount: z.number().default(0),
  message: z.string(),
  description: z.string(),
  repo: z.string(),
  issueNumber: z.number().optional(),
  startedAt: z.string(),
  endedAt: z.string().optional(),
});

export type WorkflowStateType = typeof WorkflowState.State;

function router(state: WorkflowStateType) {
  switch (state.status) {
    case "msg_received":
      return "pmCreateIssue";
    case "issue_created":
      return "devCreatePR";
    case "pr_created":
      return "moveToReview";
    case "in_review":
      return "reviewPR";
    case "change_requested":
      return "devUpdatePR";
    case "pr_updated":
      return "moveToReview";
    case "merged":
      return "deploy";
    case "deployed":
      return "closeIssue";
    case "issue_closed":
      return "complete";
    case "close_requested":
      return "closeIssue";
    case "completed":
      return END;
  }
}

export function buildWorkflow() {
  const builder = new StateGraph(WorkflowState);

  builder
    .addNode("pmCreateIssue", pmCreateIssue)
    .addNode("devCreatePR", devCreatePR)
    .addNode("moveToReview", moveToReview)
    .addNode("reviewPR", reviewPR)
    .addNode("devUpdatePR", devUpdatePR)
    .addNode("deploy", deploy)
    .addNode("closeIssue", closeIssue)
    .addNode("complete", complete);

  builder.addConditionalEdges(START, router);

  builder.addConditionalEdges("pmCreateIssue" as any, router);
  builder.addConditionalEdges("devCreatePR" as any, router);
  builder.addConditionalEdges("moveToReview" as any, router);
  builder.addConditionalEdges("reviewPR" as any, router);
  builder.addConditionalEdges("devUpdatePR" as any, router);
  builder.addConditionalEdges("deploy" as any, router);
  builder.addConditionalEdges("closeIssue" as any, router);
  builder.addConditionalEdges("complete" as any, router);

  return builder.compile();
}