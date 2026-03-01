import { GraphNode } from "@langchain/langgraph";
import { validateTransition } from "../fsm/transitions";
import { logEvent } from "../utils/logger";

const MAX_REVIEW_RETRIES = 2;

export const reviewPR: GraphNode<any> = async (state) => {
  const step = state.stepCount + 1;

  if (state.reviewCycles >= MAX_REVIEW_RETRIES) {
    logEvent({
      workflowId: state.workflowId,
      node: "reviewPR",
      from: state.status,
      to: "completed",
      step,
    });

    return {
      status: "completed",
      stepCount: step,
      endedAt: new Date().toISOString(),
    };
  }

  const nextStatus = state.reviewCycles >= 1 ? "merged" : "change_requested";

  validateTransition(state.status, nextStatus);

  logEvent({
    workflowId: state.workflowId,
    node: "reviewPR",
    from: state.status,
    to: nextStatus,
    step,
  });

  return {
    status: nextStatus,
    reviewCycles:
      nextStatus === "change_requested"
        ? state.reviewCycles + 1
        : state.reviewCycles,
    stepCount: step,
  };
};
