import { GraphNode } from "@langchain/langgraph";
import { validateTransition } from "../fsm/transitions";
import { logEvent } from "../utils/logger";

export const pmCreateIssue: GraphNode<any> = async (state) => {
  const nextStatus = "issue_created";
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

  const token = process.env.GITHUB_TOKEN;
  if (typeof token !== "string" || token.length === 0) {
    throw new Error("Missing GITHUB_TOKEN.");
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: state.message,
        body: state.description,
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `GitHub issue creation failed (${response.status}): ${text}`
    );
  }

  const data = (await response.json()) as { number?: unknown };
  const issueNumber =
    typeof data?.number === "number" ? data.number : undefined;

  if (typeof issueNumber !== "number") {
    throw new Error("GitHub issue creation failed: missing issue number.");
  }

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
    issueNumber,
  };
};
