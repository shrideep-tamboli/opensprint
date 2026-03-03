import { GraphNode } from "@langchain/langgraph";
import { validateTransition } from "../fsm/transitions";
import { logEvent } from "../utils/logger";

export const closeIssue: GraphNode<any> = async (state) => {
  const nextStatus = "issue_closed";
  validateTransition(state.status, nextStatus);

  const step = state.stepCount + 1;

  if (typeof state.repo !== "string") {
    throw new Error("Invalid repo. Expected state.repo to be a string.");
  }

  const repoPattern = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  if (!repoPattern.test(state.repo)) {
    throw new Error(
      `Invalid repo format: ${state.repo}. Expected owner/repo.`
    );
  }

  const [owner, repo] = state.repo.split("/");

  if (typeof state.issueNumber !== "number") {
    throw new Error("Missing issueNumber in state.");
  }

  const token = process.env.GITHUB_TOKEN;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Missing GITHUB_TOKEN.");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues/${state.issueNumber}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        state: "closed",
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `GitHub issue close failed (${response.status}): ${text}`
    );
  }

  logEvent({
    workflowId: state.workflowId,
    node: "closeIssue",
    from: state.status,
    to: nextStatus,
    step,
  });

  return {
    status: nextStatus,
    stepCount: step,
  };
};
