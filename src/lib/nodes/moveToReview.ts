import { GraphNode } from "@langchain/langgraph";
import { validateTransition } from "../fsm/transitions";
import { logEvent } from "../utils/logger";

export const moveToReview: GraphNode<any> = async (state) => {
  const nextStatus = "in_review";
  validateTransition(state.status, nextStatus);

  const step = state.stepCount + 1;

  logEvent({
    workflowId: state.workflowId,
    node: "moveToReview",
    from: state.status,
    to: nextStatus,
    step,
  });

  return {
    status: nextStatus,
    stepCount: step,
  };
};
