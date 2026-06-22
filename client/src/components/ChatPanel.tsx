import { useState } from "react";
import { sendAgentCommand } from "../api";
import type { AgentResult } from "../api";

interface ChatPanelProps {
  onAgentDone: (result: AgentResult) => void;
}

export default function ChatPanel({ onAgentDone }: ChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "agent"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const command = input.trim();
    setInput("");
    setHistory((h) => [...h, { role: "user", text: command }]);
    setLoading(true);

    try {
      const result = await sendAgentCommand(command);
      const actionSummary = result.actions
        .filter((a) => !(a.output as { error?: unknown })?.error)
        .map((a) => a.tool)
        .join(", ");

      setHistory((h) => [
        ...h,
        {
          role: "agent",
          text: result.success
            ? `Done. Actions: ${actionSummary || "none"}`
            : `Failed.`,
        },
      ]);
      onAgentDone(result);
    } catch (err) {
      setHistory((h) => [
        ...h,
        { role: "agent", text: `Error: ${(err as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col items-end">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700"
      >
        {isOpen ? "Close Agent" : "Open Agent"}
      </button>

      {isOpen && (
        <div className="mt-2 w-80 rounded-lg border border-gray-300 bg-white shadow-xl">
          <div className="border-b border-gray-200 px-4 py-2">
            <h3 className="font-semibold text-gray-800">Kanban Agent</h3>
          </div>

          <div className="h-64 overflow-y-auto px-4 py-3">
            {history.length === 0 && (
              <p className="text-sm text-gray-500">
                Tell the agent what to do, e.g. "Add a task called Review API to In Progress"
              </p>
            )}
            {history.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-2 text-sm ${
                  msg.role === "user" ? "text-right" : "text-left"
                }`}
              >
                <span
                  className={`inline-block rounded-lg px-3 py-1.5 ${
                    msg.role === "user"
                      ? "bg-indigo-100 text-indigo-900"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {loading && (
              <p className="text-sm text-gray-500">Agent is thinking...</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a command..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
