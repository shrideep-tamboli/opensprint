import { GraphNode } from "@langchain/langgraph";
import { validateTransition } from "../fsm/transitions";
import { logEvent } from "../utils/logger";

export const complete: GraphNode<any> = async (state) => {
  const nextStatus = "completed";
  validateTransition(state.status, nextStatus);

  const step = state.stepCount + 1;

  logEvent({
    workflowId: state.workflowId,
    node: "complete",
    from: state.status,
    to: nextStatus,
    step,
  });

  return {
    status: nextStatus,
    stepCount: step,
    endedAt: new Date().toISOString(),
  };
};
