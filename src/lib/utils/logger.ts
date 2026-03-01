export function logEvent(event: {
  workflowId: string;
  node: string;
  from: string;
  to: string;
  step: number;
}) {
  console.log(
    JSON.stringify({
      level: "info",
      ...event,
      timestamp: new Date().toISOString(),
    })
  );
}
