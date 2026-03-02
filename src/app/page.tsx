"use client";

import { useState } from "react";

type WorkflowResult = {
  workflowId: string;
  result: {
    workflowId: string;
    status: string;
    reviewCycles: number;
    stepCount: number;
    startedAt: string;
    endedAt?: string;
  };
  logs: Array<{
    level: "info";
    workflowId: string;
    node: string;
    from: string;
    to: string;
    step: number;
    timestamp: string;
  }>;
};

export default function Home() {
  const [data, setData] = useState<WorkflowResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [workflowInput, setWorkflowInput] = useState("");

  const runWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);

      const res = await fetch("/api/run", {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to run workflow");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-black dark:text-white px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            OpenScript
          </h1>

          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Deterministic FSM engine for developer workflow automation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls and Results */}
          <div className="space-y-8">
            <div className="space-y-4">
              <input
                type="text"
                value={workflowInput}
                onChange={(e) => setWorkflowInput(e.target.value)}
                placeholder="Enter workflow parameters (optional)"
                className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500"
              />
              
              <button
                onClick={runWorkflow}
                disabled={loading}
                className="w-full px-6 py-3 rounded-lg bg-black text-white dark:bg-white dark:text-black font-medium transition hover:opacity-80 disabled:opacity-50"
              >
                {loading ? "Starting Workflow..." : "Start Workflow"}
              </button>
            </div>

            {error && (
              <div className="p-4 rounded bg-red-100 text-red-700">
                {error}
              </div>
            )}

            {data && (
              <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-4 bg-white dark:bg-zinc-900">
                <h2 className="text-xl font-semibold">Workflow Results</h2>
                
                <div>
                  <span className="font-semibold">Workflow ID:</span>{" "}
                  {data.workflowId}
                </div>

                <div>
                  <span className="font-semibold">Final Status:</span>{" "}
                  {data.result.status}
                </div>

                <div>
                  <span className="font-semibold">Review Cycles:</span>{" "}
                  {data.result.reviewCycles}
                </div>

                <div>
                  <span className="font-semibold">Total Steps:</span>{" "}
                  {data.result.stepCount}
                </div>

                <div>
                  <span className="font-semibold">Started At:</span>{" "}
                  {new Date(data.result.startedAt).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Execution Logs */}
          <div>
            {data && (
              <div className="p-6 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-4 bg-white dark:bg-zinc-900 sticky top-8">
                <h2 className="text-xl font-semibold">Execution Logs</h2>
                
                {data.logs.length > 0 ? (
                  <div 
                    className="space-y-2 max-h-96 overflow-y-auto"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgb(156 163 175) transparent',
                    }}
                  >
                    <style jsx>{`
                      div::-webkit-scrollbar {
                        width: 4px;
                      }
                      div::-webkit-scrollbar-track {
                        background: transparent;
                      }
                      div::-webkit-scrollbar-thumb {
                        background-color: rgb(156 163 175);
                        border-radius: 2px;
                      }
                      div::-webkit-scrollbar-thumb:hover {
                        background-color: rgb(107 114 128);
                      }
                      @media (prefers-color-scheme: dark) {
                        div::-webkit-scrollbar-thumb {
                          background-color: rgb(75 85 99);
                        }
                        div::-webkit-scrollbar-thumb:hover {
                          background-color: rgb(107 114 128);
                        }
                      }
                    `}</style>
                    {data.logs.map((log, index) => (
                      <div
                        key={index}
                        className="p-3 rounded bg-zinc-100 dark:bg-zinc-800 text-sm font-mono"
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            Step {log.step}: {log.node}
                          </span>
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-zinc-600 dark:text-zinc-400">
                          {log.from} → {log.to}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-zinc-500 dark:text-zinc-400">
                    No logs available for this workflow.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}