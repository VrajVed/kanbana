import { Router } from "express";
import { agentCommand } from "../controllers/AgentController.js";

const router = Router();

router.post("/command", agentCommand);

export default router;
