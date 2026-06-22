import { Router } from "express";
import {
  getSubTasks,
  getSubTaskById,
  createSubTask,
  updateSubTaskById,
  deleteSubTaskById,
} from "../controllers/SubTaskController.js";
import { validateBody } from "../middleware/validate.js";
import {
  createSubTaskSchema,
  updateSubTaskSchema,
} from "../validators/schemas.js";

const router = Router({ mergeParams: true });

router.get("/", getSubTasks);
router.post("/", validateBody(createSubTaskSchema), createSubTask);
router.get("/:subTaskId", getSubTaskById);
router.put("/:subTaskId", validateBody(updateSubTaskSchema), updateSubTaskById);
router.delete("/:subTaskId", deleteSubTaskById);

export default router;
