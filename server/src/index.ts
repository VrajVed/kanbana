import express from "express";
import cors from "cors";
import { PORT } from "./config/config.js";
import boardRoutes from "./routes/BoardRoutes.js";
import listRoutes from "./routes/ListRoutes.js";
import taskRoutes from "./routes/TaskRoutes.js";
import subTaskRoutes from "./routes/SubTaskRoutes.js";
import agentRoutes from "./routes/AgentRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Routes
app.use("/api/board", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/tasks/:taskId/subtasks", subTaskRoutes);
app.use("/api/agent", agentRoutes);

app.listen(PORT, () => {
  console.log(`Kanbana server running on http://localhost:${PORT}`);
});
