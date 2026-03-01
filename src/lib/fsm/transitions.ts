export const StatusValues = [
  "msg_received",
  "issue_created",
  "pr_created",
  "in_review",
  "change_requested",
  "pr_updated",
  "merged",
  "deployed",
  "issue_closed",
  "completed",
] as const;

export type Status = typeof StatusValues[number];

export const AllowedTransitions: Record<Status, Status[]> = {
  msg_received: ["issue_created"],
  issue_created: ["pr_created"],
  pr_created: ["in_review"],
  in_review: ["change_requested", "merged"],
  change_requested: ["pr_updated"],
  pr_updated: ["in_review"],
  merged: ["deployed"],
  deployed: ["issue_closed"],
  issue_closed: ["completed"],
  completed: [],
};

export function validateTransition(from: Status, to: Status) {
  if (!AllowedTransitions[from].includes(to)) {
    throw new Error(`Invalid transition from ${from} → ${to}`);
  }
}
