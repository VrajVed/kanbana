import { Request, Response } from "express";
import KanbanModel from "../models/KanbanModel.js";

// Full board snapshot
export const getBoard = (req: Request, res: Response): void => {
  try {
    const board = KanbanModel.getBoard();
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateBoard = (req: Request, res: Response): void => {
  try {
    const board = KanbanModel.updateBoard(req.body);
    res.json(board);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

// TaskBoard entities
export const getBoards = (req: Request, res: Response): void => {
  try {
    const boards = KanbanModel.getBoards();
    res.json(boards);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getBoardById = (req: Request, res: Response): void => {
  try {
    const board = KanbanModel.getBoardById(req.params.boardId);
    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    res.json(board);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const createBoard = (req: Request, res: Response): void => {
  try {
    const board = KanbanModel.createBoard(req.body);
    res.status(201).json(board);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const updateBoardById = (req: Request, res: Response): void => {
  try {
    const board = KanbanModel.updateBoardById(req.params.boardId, req.body);
    if (!board) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    res.json(board);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
};

export const deleteBoardById = (req: Request, res: Response): void => {
  try {
    const deleted = KanbanModel.deleteBoardById(req.params.boardId);
    if (!deleted) {
      res.status(404).json({ error: "Board not found" });
      return;
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
