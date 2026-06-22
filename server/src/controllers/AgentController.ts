import { Request, Response } from "express";
import { runCommand } from "../services/AgentService.js";

export const agentCommand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { command } = req.body as { command?: string };

    if (!command || typeof command !== "string") {
      res.status(400).json({ error: "command is required and must be a string" });
      return;
    }

    const result = await runCommand(command);
    res.json(result);
  } catch (error) {
    console.error("[AgentController] Error:", error);
    res.status(500).json({
      error: "Agent failed",
      message: (error as Error).message,
    });
  }
};
