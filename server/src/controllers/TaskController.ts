import { Request, Response } from "express";
import KanbanModel from "../models/KanbanModel.js";

export const getTasks = (req: Request, res: Response): void => {
  try {
    const listId = req.query.listId as string | undefined;
    const tasks = listId
      ? KanbanModel.getTasksByListId(listId)
      : KanbanModel.getTasks();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getTaskById = (req: Request, res: Response): void => {
  try {
    const task = KanbanModel.getTaskById(req.params.taskId);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createTask = (req: Request, res: Response): void => {
  try {
    const listId = req.params.listId ?? req.body.listId;
    if (!listId) {
      res.status(400).json({ error: "listId is required" });
      return;
    }
    const task = KanbanModel.createTask(listId, req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateTaskById = (req: Request, res: Response): void => {
  try {
    const task = KanbanModel.updateTaskById(req.params.taskId, req.body);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const moveTask = (req: Request, res: Response): void => {
  try {
    const { listId } = req.body;
    if (!listId) {
      res.status(400).json({ error: "listId is required" });
      return;
    }
    const task = KanbanModel.moveTask(req.params.taskId, listId);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteTaskById = (req: Request, res: Response): void => {
  try {
    const deleted = KanbanModel.deleteTaskById(req.params.taskId);
    if (!deleted) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
