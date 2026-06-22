import { z } from "zod";

// Helper for ISO timestamps
const timestampSchema = z.string().datetime().optional();

// Base schema shared by Task and SubTask
const taskBaseSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  assignee: z.string().nullable().optional(),
  boardId: z.string().uuid(),
  listId: z.string().uuid(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema,
  deletedAt: timestampSchema.nullish(),
});

export const taskSchema: z.ZodType<any> = taskBaseSchema.extend({
  subTasks: z.lazy(() => taskSchema.array()).default([]),
});

export const createTaskSchema = z.object({
  listId: z.string().uuid("listId must be a valid UUID"),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  assignee: z.string().nullable().optional(),
  subTasks: z.lazy(() => taskSchema.array()).default([]),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assignee: z.string().nullable().optional(),
  boardId: z.string().uuid().optional(),
  listId: z.string().uuid().optional(),
  subTasks: z.lazy(() => taskSchema.array()).optional(),
});

export const createSubTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  assignee: z.string().nullable().optional(),
  subTasks: z.lazy(() => taskSchema.array()).default([]),
});

export const updateSubTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  assignee: z.string().nullable().optional(),
  subTasks: z.lazy(() => taskSchema.array()).optional(),
});

export const moveTaskSchema = z.object({
  listId: z.string().uuid("listId must be a valid UUID"),
});

export const createBoardSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  isLocked: z.boolean().default(false),
  order: z.number().int().nonnegative().optional(),
});

export const updateBoardSchema = z.object({
  displayName: z.string().min(1).optional(),
  isLocked: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
});

export const createListSchema = z.object({
  boardId: z.string().uuid("boardId must be a valid UUID"),
  displayName: z.string().min(1, "Display name is required"),
  order: z.number().int().nonnegative().optional(),
  taskIds: z.array(z.string().uuid()).default([]),
});

export const updateListSchema = z.object({
  boardId: z.string().uuid().optional(),
  displayName: z.string().min(1).optional(),
  order: z.number().int().nonnegative().optional(),
  taskIds: z.array(z.string().uuid()).optional(),
});

// Full board schema for validating kanban.json on read/write
export const boardSchema = z.object({
  Boardname: z.string().min(1),
  boards: z.array(
    z.object({
      id: z.string().uuid(),
      isLocked: z.boolean(),
      displayName: z.string().min(1),
      order: z.number().int().nonnegative(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      deletedAt: z.string().datetime().nullable(),
    })
  ),
  Lists: z.array(
    z.object({
      id: z.string().uuid(),
      boardId: z.string().uuid(),
      displayName: z.string().min(1),
      order: z.number().int().nonnegative(),
      taskIds: z.array(z.string().uuid()),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
      deletedAt: z.string().datetime().nullable(),
    })
  ),
  tasks: z.record(z.string().uuid(), taskSchema),
});
