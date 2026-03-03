import { NextRequest } from "next/server";
import { getLogs } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const workflowIds = new Set<string>();
      const sentLogs = new Set<string>();

      const push = () => {
        const allLogs = Array.from(workflowIds)
          .flatMap((id) => getLogs(id))
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        for (const log of allLogs) {
          const key = `${log.workflowId}-${log.timestamp}`;
          if (!sentLogs.has(key)) {
            sentLogs.add(key);
            const data = `data: ${JSON.stringify({ kind: "log", ...log })}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
        }
      };

      const interval = setInterval(push, 500);

      // Intercept POST /api/run to capture metadata
      const originalFetch = global.fetch;
      global.fetch = async (...args) => {
        const [url, init] = args;
        if (typeof url === "string" && url.endsWith("/api/run") && init?.method === "POST") {
          try {
            const body = JSON.parse(init.body as string);
            if (body.title && body.repo) {
              // We'll get the workflowId from the response and store it
              const res = await originalFetch(...args);
              const json = await res.clone().json();
              if (json.workflowId) {
                workflowIds.add(json.workflowId);
                // Broadcast metadata event
                const metaEvent = {
                  kind: "workflow_start",
                  workflowId: json.workflowId,
                  title: body.title,
                  description: body.description || "",
                  repo: body.repo,
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(metaEvent)}\n\n`));
              }
              return res;
            }
          } catch {
            // ignore parsing errors; fall back
          }
        }
        return originalFetch(...args);
      };

      // Clean up on disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        global.fetch = originalFetch;
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
