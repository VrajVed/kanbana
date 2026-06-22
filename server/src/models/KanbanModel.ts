import { v4 as uuidv4 } from "uuid";
import {
  KanbanBoard,
  TaskBoard,
  List,
  Task,
  PartialTaskBoard,
  PartialList,
  PartialTask,
} from "./types.js";
import { KANBAN_FILE_PATH } from "../config/config.js";
import { readJsonFile, writeJsonFile } from "../utils/fileUtils.js";
import { boardSchema } from "../validators/schemas.js";

class KanbanModel {
  private filePath: string;

  constructor(filePath: string = KANBAN_FILE_PATH) {
    this.filePath = filePath;
  }

  private read(): KanbanBoard {
    return readJsonFile<KanbanBoard>(this.filePath, boardSchema);
  }

  private write(board: KanbanBoard): void {
    writeJsonFile<KanbanBoard>(this.filePath, board);
  }

  private now(): string {
    return new Date().toISOString();
  }

  private active<T extends { deletedAt: string | null }>(items: T[]): T[] {
    return items.filter((item) => item.deletedAt === null);
  }

  private isActive(item: { deletedAt: string | null }): boolean {
    return item.deletedAt === null;
  }

  private findSubTaskLocation(
    task: Task,
    subTaskId: string
  ): { parent: Task; index: number } | null {
    for (let i = 0; i < task.subTasks.length; i++) {
      if (task.subTasks[i].id === subTaskId) {
        return { parent: task, index: i };
      }
      const found = this.findSubTaskLocation(task.subTasks[i], subTaskId);
      if (found) return found;
    }
    return null;
  }

  private touch(item: { updatedAt: string }): void {
    item.updatedAt = this.now();
  }

  // ---------- Board ----------

  getBoard(): KanbanBoard {
    return this.read();
  }

  updateBoard(updates: Partial<KanbanBoard>): KanbanBoard {
    const board = this.read();
    const updated = { ...board, ...updates };
    this.write(updated);
    return updated;
  }

  // ---------- TaskBoards ----------

  getBoards(): TaskBoard[] {
    return this.active(this.read().boards);
  }

  getBoardById(boardId: string): TaskBoard | undefined {
    const board = this.read().boards.find((b) => b.id === boardId);
    return board && this.isActive(board) ? board : undefined;
  }

  createBoard(boardData: PartialTaskBoard): TaskBoard {
    const board = this.read();
    const now = this.now();

    const newBoard: TaskBoard = {
      id: uuidv4(),
      isLocked: boardData.isLocked ?? false,
      displayName: boardData.displayName ?? "New Board",
      order: boardData.order ?? board.boards.length,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    board.boards.push(newBoard);
    this.write(board);
    return newBoard;
  }

  updateBoardById(
    boardId: string,
    updates: PartialTaskBoard
  ): TaskBoard | undefined {
    const board = this.read();
    const index = board.boards.findIndex((b) => b.id === boardId);
    if (index === -1 || !this.isActive(board.boards[index])) return undefined;

    board.boards[index] = { ...board.boards[index], ...updates };
    this.touch(board.boards[index]);
    this.write(board);
    return board.boards[index];
  }

  deleteBoardById(boardId: string): boolean {
    const board = this.read();
    const target = board.boards.find((b) => b.id === boardId);
    if (!target || !this.isActive(target)) return false;

    target.deletedAt = this.now();
    this.touch(target);

    // Soft delete associated lists and tasks
    board.Lists.forEach((list) => {
      if (list.boardId === boardId && this.isActive(list)) {
        this.deleteListInternal(board, list.id);
      }
    });

    this.write(board);
    return true;
  }

  // ---------- Lists ----------

  getLists(): List[] {
    return this.active(this.read().Lists);
  }

  getListsByBoardId(boardId: string): List[] {
    return this.getLists().filter((list) => list.boardId === boardId);
  }

  getListById(listId: string): List | undefined {
    const list = this.read().Lists.find((l) => l.id === listId);
    return list && this.isActive(list) ? list : undefined;
  }

  createList(listData: PartialList): List {
    const board = this.read();
    const parentBoard = board.boards.find((b) => b.id === listData.boardId);
    if (!parentBoard) {
      throw new Error(`Board "${listData.boardId}" not found`);
    }

    const now = this.now();
    const newList: List = {
      id: uuidv4(),
      boardId: listData.boardId!,
      displayName: listData.displayName ?? "New List",
      order: listData.order ?? board.Lists.filter((l) => l.boardId === listData.boardId).length,
      taskIds: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    board.Lists.push(newList);
    this.write(board);
    return newList;
  }

  updateListById(listId: string, updates: PartialList): List | undefined {
    const board = this.read();
    const index = board.Lists.findIndex((l) => l.id === listId);
    if (index === -1 || !this.isActive(board.Lists[index])) return undefined;

    board.Lists[index] = { ...board.Lists[index], ...updates };
    this.touch(board.Lists[index]);
    this.write(board);
    return board.Lists[index];
  }

  deleteListById(listId: string): boolean {
    const board = this.read();
    const deleted = this.deleteListInternal(board, listId);
    if (!deleted) return false;
    this.write(board);
    return true;
  }

  private deleteListInternal(board: KanbanBoard, listId: string): boolean {
    const list = board.Lists.find((l) => l.id === listId);
    if (!list || !this.isActive(list)) return false;

    list.deletedAt = this.now();
    this.touch(list);

    // Soft delete tasks that were only in this list
    list.taskIds.forEach((taskId) => {
      const task = board.tasks[taskId];
      if (task && this.isActive(task) && task.listId === listId) {
        this.deleteTaskInternal(board, taskId);
      }
    });

    return true;
  }

  // ---------- Tasks ----------

  getTasks(): Task[] {
    const board = this.read();
    return this.active(Object.values(board.tasks));
  }

  getTasksByListId(listId: string): Task[] {
    const list = this.getListById(listId);
    if (!list) return [];

    const board = this.read();
    return list.taskIds
      .map((taskId) => board.tasks[taskId])
      .filter((task): task is Task => !!task && this.isActive(task));
  }

  getTaskById(taskId: string): Task | undefined {
    const task = this.read().tasks[taskId];
    return task && this.isActive(task) ? task : undefined;
  }

  createTask(listId: string, taskData: PartialTask): Task {
    const board = this.read();
    const list = board.Lists.find((l) => l.id === listId);
    if (!list) {
      throw new Error(`List "${listId}" not found`);
    }
    if (!this.isActive(list)) {
      throw new Error(`List "${listId}" is deleted`);
    }

    const parentBoard = board.boards.find((b) => b.id === list.boardId);
    if (!parentBoard) {
      throw new Error(`Board for list "${listId}" not found`);
    }

    const now = this.now();
    const newTask: Task = {
      id: uuidv4(),
      title: taskData.title ?? "New Task",
      description: taskData.description ?? "",
      subTasks: taskData.subTasks ?? [],
      assignee: taskData.assignee ?? null,
      boardId: list.boardId,
      listId: listId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    board.tasks[newTask.id] = newTask;
    list.taskIds.push(newTask.id);
    this.touch(list);
    this.write(board);
    return newTask;
  }

  updateTaskById(taskId: string, updates: PartialTask): Task | undefined {
    const board = this.read();
    const task = board.tasks[taskId];
    if (!task || !this.isActive(task)) return undefined;

    board.tasks[taskId] = { ...task, ...updates };
    this.touch(board.tasks[taskId]);
    this.write(board);
    return board.tasks[taskId];
  }

  moveTask(taskId: string, targetListId: string): Task | undefined {
    const board = this.read();
    const task = board.tasks[taskId];
    if (!task || !this.isActive(task)) return undefined;

    const oldList = board.Lists.find((l) => l.id === task.listId);
    const newList = board.Lists.find((l) => l.id === targetListId);

    if (!newList || !this.isActive(newList)) {
      throw new Error(`Target list "${targetListId}" not found or deleted`);
    }

    // Remove from old list
    if (oldList) {
      oldList.taskIds = oldList.taskIds.filter((id) => id !== taskId);
      this.touch(oldList);
    }

    // Add to new list if not already there
    if (!newList.taskIds.includes(taskId)) {
      newList.taskIds.push(taskId);
    }
    this.touch(newList);

    // Update task references
    task.listId = targetListId;
    task.boardId = newList.boardId;
    this.touch(task);

    this.write(board);
    return task;
  }

  deleteTaskById(taskId: string): boolean {
    const board = this.read();
    const deleted = this.deleteTaskInternal(board, taskId);
    if (!deleted) return false;
    this.write(board);
    return true;
  }

  private deleteTaskInternal(board: KanbanBoard, taskId: string): boolean {
    const task = board.tasks[taskId];
    if (!task || !this.isActive(task)) return false;

    task.deletedAt = this.now();
    this.touch(task);

    // Remove from any list that references it
    board.Lists.forEach((list) => {
      if (list.taskIds.includes(taskId)) {
        list.taskIds = list.taskIds.filter((id) => id !== taskId);
        this.touch(list);
      }
    });

    return true;
  }

  // ---------- SubTasks ----------

  getSubTasks(taskId: string): Task[] | undefined {
    const task = this.getTaskById(taskId);
    return task?.subTasks.filter((sub) => this.isActive(sub));
  }

  getSubTaskById(taskId: string, subTaskId: string): Task | undefined {
    const task = this.getTaskById(taskId);
    if (!task) return undefined;

    const location = this.findSubTaskLocation(task, subTaskId);
    if (!location) return undefined;

    const subTask = location.parent.subTasks[location.index];
    return this.isActive(subTask) ? subTask : undefined;
  }

  createSubTask(taskId: string, subTaskData: PartialTask): Task {
    const board = this.read();
    const task = board.tasks[taskId];
    if (!task || !this.isActive(task)) {
      throw new Error(`Task "${taskId}" not found or deleted`);
    }

    const now = this.now();
    const newSubTask: Task = {
      id: uuidv4(),
      title: subTaskData.title ?? "New SubTask",
      description: subTaskData.description ?? "",
      subTasks: subTaskData.subTasks ?? [],
      assignee: subTaskData.assignee ?? null,
      boardId: task.boardId,
      listId: task.listId,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    task.subTasks.push(newSubTask);
    this.touch(task);
    this.write(board);
    return newSubTask;
  }

  updateSubTaskById(
    taskId: string,
    subTaskId: string,
    updates: PartialTask
  ): Task | undefined {
    const board = this.read();
    const task = board.tasks[taskId];
    if (!task || !this.isActive(task)) return undefined;

    const location = this.findSubTaskLocation(task, subTaskId);
    if (!location) return undefined;

    location.parent.subTasks[location.index] = {
      ...location.parent.subTasks[location.index],
      ...updates,
    };
    this.touch(location.parent.subTasks[location.index]);
    this.touch(task);
    this.write(board);
    return location.parent.subTasks[location.index];
  }

  deleteSubTaskById(taskId: string, subTaskId: string): boolean {
    const board = this.read();
    const task = board.tasks[taskId];
    if (!task || !this.isActive(task)) return false;

    const location = this.findSubTaskLocation(task, subTaskId);
    if (!location) return false;

    location.parent.subTasks[location.index].deletedAt = this.now();
    this.touch(location.parent.subTasks[location.index]);
    this.touch(task);
    this.write(board);
    return true;
  }
}

export default new KanbanModel();
