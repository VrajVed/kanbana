const API_BASE = "http://localhost:3001";

export interface SubTask {
  id: string;
  title: string;
  description: string;
  subTasks: SubTask[];
  assignee: string | null;
  boardId: string;
  listId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subTasks: SubTask[];
  assignee: string | null;
  boardId: string;
  listId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface List {
  id: string;
  boardId: string;
  displayName: string;
  order: number;
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Board {
  id: string;
  isLocked: boolean;
  displayName: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface KanbanBoard {
  Boardname: string;
  boards: Board[];
  Lists: List[];
  tasks: Record<string, Task>;
}

export interface AgentAction {
  tool: string;
  input: unknown;
  output: unknown;
}

export interface AgentResult {
  success: boolean;
  actions: AgentAction[];
  reply?: string;
}

export async function fetchBoard(): Promise<KanbanBoard> {
  const res = await fetch(`${API_BASE}/api/board/all`);
  if (!res.ok) throw new Error(`Failed to fetch board: ${res.status}`);
  return res.json();
}

export async function sendAgentCommand(command: string): Promise<AgentResult> {
  const res = await fetch(`${API_BASE}/api/agent/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command }),
  });
  if (!res.ok) throw new Error(`Agent request failed: ${res.status}`);
  return res.json();
}
