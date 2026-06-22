import { Request, Response } from "express";
import KanbanModel from "../models/KanbanModel.js";

export const getSubTasks = (req: Request, res: Response): void => {
  try {
    const subTasks = KanbanModel.getSubTasks(req.params.taskId);
    if (subTasks === undefined) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(subTasks);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getSubTaskById = (req: Request, res: Response): void => {
  try {
    const subTask = KanbanModel.getSubTaskById(
      req.params.taskId,
      req.params.subTaskId
    );
    if (!subTask) {
      res.status(404).json({ error: "SubTask not found" });
      return;
    }
    res.json(subTask);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createSubTask = (req: Request, res: Response): void => {
  try {
    const subTask = KanbanModel.createSubTask(req.params.taskId, req.body);
    res.status(201).json(subTask);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateSubTaskById = (req: Request, res: Response): void => {
  try {
    const subTask = KanbanModel.updateSubTaskById(
      req.params.taskId,
      req.params.subTaskId,
      req.body
    );
    if (!subTask) {
      res.status(404).json({ error: "SubTask not found" });
      return;
    }
    res.json(subTask);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteSubTaskById = (req: Request, res: Response): void => {
  try {
    const deleted = KanbanModel.deleteSubTaskById(
      req.params.taskId,
      req.params.subTaskId
    );
    if (!deleted) {
      res.status(404).json({ error: "SubTask not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
