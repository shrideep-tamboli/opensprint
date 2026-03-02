interface LogEntry {
  level: "info";
  workflowId: string;
  node: string;
  from: string;
  to: string;
  step: number;
  timestamp: string;
}

const logs: Map<string, LogEntry[]> = new Map();

export function logEvent(event: {
  workflowId: string;
  node: string;
  from: string;
  to: string;
  step: number;
}) {
  const logEntry: LogEntry = {
    level: "info",
    ...event,
    timestamp: new Date().toISOString(),
  };

  if (!logs.has(event.workflowId)) {
    logs.set(event.workflowId, []);
  }
  
  logs.get(event.workflowId)!.push(logEntry);
  
  console.log(JSON.stringify(logEntry));
}

export function getLogs(workflowId: string): LogEntry[] {
  return logs.get(workflowId) || [];
}

export function clearLogs(workflowId?: string) {
  if (workflowId) {
    logs.delete(workflowId);
  } else {
    logs.clear();
  }
}
