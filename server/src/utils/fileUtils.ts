import fs from "fs";
import path from "path";
import { ZodSchema } from "zod";

export function readJsonFile<T>(filePath: string, schema?: ZodSchema<T>): T {
  const raw = fs.readFileSync(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  if (schema) {
    const result = schema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Invalid data file: ${result.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ")}`
      );
    }
    return result.data;
  }

  return parsed as T;
}

export function writeJsonFile<T>(filePath: string, data: T): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tempPath, filePath);
}
