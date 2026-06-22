import { useEffect, useState } from "react";
import "./App.css";
import { fetchBoard } from "./api";
import type { KanbanBoard, Task, List, AgentResult } from "./api";
import ChatPanel from "./components/ChatPanel";

function App() {
  const [board, setBoard] = useState<KanbanBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadBoard() {
    try {
      setLoading(true);
      const data = await fetchBoard();
      setBoard(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBoard();
  }, []);

  function handleAgentDone(result: AgentResult) {
    if (result.success) {
      loadBoard();
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading board...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!board) return null;

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <ChatPanel onAgentDone={handleAgentDone} />

      <header className="mb-8 pr-32">
        <h1 className="text-3xl font-bold text-gray-800">{board.Boardname}</h1>
        <p className="text-gray-600">Vite + React + Tailwind + OpenRouter Agent</p>
      </header>

      <main className="flex gap-6 overflow-x-auto">
        {board.Lists.map((list) => (
          <Column key={list.id} list={list} tasks={board.tasks} />
        ))}
      </main>
    </div>
  );
}

function Column({ list, tasks }: { list: List; tasks: Record<string, Task> }) {
  const listTasks = list.taskIds
    .map((id) => tasks[id])
    .filter((t): t is Task => !!t && t.deletedAt === null);

  return (
    <div className="min-w-[280px] flex-1 rounded-lg bg-gray-200 p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-700">
        {list.displayName}
      </h2>
      <div className="space-y-3">
        {listTasks.map((task) => (
          <Card key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function Card({ task }: { task: Task }) {
  return (
    <div className="rounded-md bg-white p-4 shadow-sm">
      <h3 className="font-medium text-gray-800">{task.title}</h3>
      {task.description && (
        <p className="mt-1 text-sm text-gray-600">{task.description}</p>
      )}
      {task.subTasks.length > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {task.subTasks.length} subtask{task.subTasks.length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

export default App;
