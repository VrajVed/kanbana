import { Router } from "express";
import {
  getTasks,
  getTaskById,
  createTask,
  updateTaskById,
  moveTask,
  deleteTaskById,
} from "../controllers/TaskController.js";
import { validateBody } from "../middleware/validate.js";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
} from "../validators/schemas.js";

const router = Router();

router.get("/", getTasks);
router.post("/", validateBody(createTaskSchema), createTask);
router.get("/:taskId", getTaskById);
router.put("/:taskId", validateBody(updateTaskSchema), updateTaskById);
router.post("/:taskId/move", validateBody(moveTaskSchema), moveTask);
router.delete("/:taskId", deleteTaskById);

export default router;
