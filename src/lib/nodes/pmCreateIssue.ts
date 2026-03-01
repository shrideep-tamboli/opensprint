import { GraphNode } from "@langchain/langgraph";
import { validateTransition } from "../fsm/transitions";
import { logEvent } from "../utils/logger";

export const pmCreateIssue: GraphNode<any> = async (state) => {
  const nextStatus = "issue_created";
  validateTransition(state.status, nextStatus);

  const step = state.stepCount + 1;

  logEvent({
    workflowId: state.workflowId,
    node: "pmCreateIssue",
    from: state.status,
    to: nextStatus,
    step,
  });

  return {
    status: nextStatus,
    stepCount: step,
  };
};
