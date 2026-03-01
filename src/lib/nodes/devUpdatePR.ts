import { GraphNode } from "@langchain/langgraph";
import { validateTransition } from "../fsm/transitions";
import { logEvent } from "../utils/logger";

export const devUpdatePR: GraphNode<any> = async (state) => {
  const nextStatus = "pr_updated";
  validateTransition(state.status, nextStatus);

  const step = state.stepCount + 1;

  logEvent({
    workflowId: state.workflowId,
    node: "devUpdatePR",
    from: state.status,
    to: nextStatus,
    step,
  });

  return {
    status: nextStatus,
    stepCount: step,
  };
};
