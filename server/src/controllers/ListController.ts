import { Request, Response } from "express";
import KanbanModel from "../models/KanbanModel.js";

export const getLists = (req: Request, res: Response): void => {
  try {
    const boardId = req.query.boardId as string | undefined;
    const lists = boardId
      ? KanbanModel.getListsByBoardId(boardId)
      : KanbanModel.getLists();
    res.json(lists);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getListById = (req: Request, res: Response): void => {
  try {
    const list = KanbanModel.getListById(req.params.listId);
    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createList = (req: Request, res: Response): void => {
  try {
    const list = KanbanModel.createList(req.body);
    res.status(201).json(list);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateListById = (req: Request, res: Response): void => {
  try {
    const list = KanbanModel.updateListById(req.params.listId, req.body);
    if (!list) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    res.json(list);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteListById = (req: Request, res: Response): void => {
  try {
    const deleted = KanbanModel.deleteListById(req.params.listId);
    if (!deleted) {
      res.status(404).json({ error: "List not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
