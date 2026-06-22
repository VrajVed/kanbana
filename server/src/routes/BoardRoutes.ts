import { Router } from "express";
import {
  getBoard,
  updateBoard,
  getBoards,
  getBoardById,
  createBoard,
  updateBoardById,
  deleteBoardById,
} from "../controllers/BoardController.js";
import { validateBody } from "../middleware/validate.js";
import { createBoardSchema, updateBoardSchema } from "../validators/schemas.js";

const router = Router();

// Full board snapshot
router.get("/all", getBoard);
router.put("/all", updateBoard);

// TaskBoard entities
router.get("/", getBoards);
router.post("/", validateBody(createBoardSchema), createBoard);
router.get("/:boardId", getBoardById);
router.put("/:boardId", validateBody(updateBoardSchema), updateBoardById);
router.delete("/:boardId", deleteBoardById);

export default router;
