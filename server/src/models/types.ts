export interface Timestamps {
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface TaskBoard extends Timestamps {
  id: string;
  isLocked: boolean;
  displayName: string;
  order: number;
}

export interface List extends Timestamps {
  id: string;
  boardId: string;
  displayName: string;
  order: number;
  taskIds: string[];
}

export interface Task extends Timestamps {
  id: string;
  title: string;
  description: string;
  subTasks: Task[];
  assignee?: string | null;
  boardId: string;
  listId: string;
}

export interface KanbanBoard {
  Boardname: string;
  boards: TaskBoard[];
  Lists: List[];
  tasks: Record<string, Task>;
}

export type PartialTaskBoard = Partial<Omit<TaskBoard, "createdAt" | "updatedAt" | "deletedAt">>;

export type PartialList = Partial<Omit<List, "createdAt" | "updatedAt" | "deletedAt">>;

export type PartialTask = Partial<Omit<Task, "createdAt" | "updatedAt" | "deletedAt">>;
