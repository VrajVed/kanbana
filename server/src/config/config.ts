import path from "path";

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

export const KANBAN_FILE_PATH = process.env.KANBAN_FILE_PATH
  ? path.resolve(process.env.KANBAN_FILE_PATH)
  : path.resolve(__dirname, "../data/kanban.json");
