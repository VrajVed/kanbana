import { Router } from "express";
import {
  getLists,
  getListById,
  createList,
  updateListById,
  deleteListById,
} from "../controllers/ListController.js";
import { validateBody } from "../middleware/validate.js";
import { createListSchema, updateListSchema } from "../validators/schemas.js";

const router = Router();

router.get("/", getLists);
router.post("/", validateBody(createListSchema), createList);
router.get("/:listId", getListById);
router.put("/:listId", validateBody(updateListSchema), updateListById);
router.delete("/:listId", deleteListById);

export default router;
