import "dotenv/config";
import OpenAI from "openai";
import { z } from "zod";
import KanbanModel from "../models/KanbanModel.js";

const apiKey = process.env.OPENROUTER_API_KEY;

if (!apiKey || apiKey === "your_openrouter_api_key_here") {
  console.warn("OPENROUTER_API_KEY is not set. Agent will not work.");
}

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey ?? "",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3001",
    "X-Title": "Kanbana Agent",
  },
});

const FREE_MODELS = [
  "openai/gpt-oss-20b:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen3-coder:free",
];

const MAX_TURNS = 10;
const REQUEST_TIMEOUT_MS = 120_000;

const SYSTEM_PROMPT = [
  "You are a kanban board executor.",
  "",
  "Your job is to modify the kanban board by calling tools. You do not chat. You do not explain. You do not apologize.",
  "",
  "Rules:",
  "- Use the provided tools to fulfill the user's request.",
  "- ALWAYS use get_full_context first if you need to know board IDs, list IDs, or task IDs.",
  "- When moving multiple tasks, use move_tasks_bulk to move them all in one tool call.",
  "- After you have completed all necessary tool calls, respond with exactly: DONE",
  "- Do not respond with anything other than tool calls or the word DONE.",
  "",
  "Examples:",
  "",
  'User: "Make a new list called Review and move all To Do tasks there"',
  "1. get_full_context",
  '2. create_list(boardId=<board id>, displayName="Review")',
  "3. move_tasks_bulk(taskIds=[<ids of tasks currently in To Do>], listId=<Review list id>)",
  "4. DONE",
  "",
  'User: "Add a task called Write tests to In Progress"',
  "1. get_full_context",
  '2. create_task(listId=<In Progress id>, title="Write tests")',
  "3. DONE",
].join("\n");

// ---------- Tool definitions ----------

interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: z.ZodSchema<any>;
  parameters: object;
  execute: (input: any) => any;
}

const tools: ToolDefinition[] = [
  {
    name: "get_full_context",
    description: "Get the complete board context: boards, lists, and all active tasks. Use this first when you need IDs.",
    inputSchema: z.object({}),
    parameters: { type: "object", properties: {} },
    execute: () => {
      const board = KanbanModel.getBoard();
      return {
        boards: board.boards.filter((b) => b.deletedAt === null),
        lists: board.Lists.filter((l) => l.deletedAt === null),
        tasks: Object.values(board.tasks).filter((t) => t.deletedAt === null),
      };
    },
  },
  {
    name: "get_board",
    description: "Get the full kanban board state including deleted items",
    inputSchema: z.object({}),
    parameters: { type: "object", properties: {} },
    execute: () => KanbanModel.getBoard(),
  },
  {
    name: "get_boards",
    description: "Get all active boards",
    inputSchema: z.object({}),
    parameters: { type: "object", properties: {} },
    execute: () => KanbanModel.getBoards(),
  },
  {
    name: "get_lists",
    description: "Get all active lists, optionally filtered by boardId",
    inputSchema: z.object({
      boardId: z.preprocess(
        (val) => (val === "null" || val === "" ? undefined : val),
        z.string().uuid().optional()
      ),
    }),
    parameters: {
      type: "object",
      properties: {
        boardId: { type: "string", format: "uuid", description: "Optional board ID to filter by" },
      },
    },
    execute: ({ boardId }: { boardId?: string }) =>
      boardId ? KanbanModel.getListsByBoardId(boardId) : KanbanModel.getLists(),
  },
  {
    name: "get_tasks",
    description: "Get all active tasks, optionally filtered by listId",
    inputSchema: z.object({
      listId: z.preprocess(
        (val) => (val === "null" || val === "" ? undefined : val),
        z.string().uuid().optional()
      ),
    }),
    parameters: {
      type: "object",
      properties: {
        listId: { type: "string", format: "uuid", description: "Optional list ID to filter by" },
      },
    },
    execute: ({ listId }: { listId?: string }) =>
      listId ? KanbanModel.getTasksByListId(listId) : KanbanModel.getTasks(),
  },
  {
    name: "create_board",
    description: "Create a new kanban board",
    inputSchema: z.object({
      displayName: z.string().min(1),
      isLocked: z.boolean().optional(),
      order: z.number().int().nonnegative().optional(),
    }),
    parameters: {
      type: "object",
      required: ["displayName"],
      properties: {
        displayName: { type: "string", description: "Name of the board" },
        isLocked: { type: "boolean", description: "Whether the board is locked" },
        order: { type: "integer", description: "Display order" },
      },
    },
    execute: ({ displayName, isLocked, order }: any) =>
      KanbanModel.createBoard({
        displayName,
        isLocked: isLocked ?? false,
        order: order ?? 0,
      }),
  },
  {
    name: "create_list",
    description: "Create a new list/column inside a board",
    inputSchema: z.object({
      boardId: z.string().uuid(),
      displayName: z.string().min(1),
      order: z.number().int().nonnegative().optional(),
    }),
    parameters: {
      type: "object",
      required: ["boardId", "displayName"],
      properties: {
        boardId: { type: "string", format: "uuid", description: "ID of the parent board" },
        displayName: { type: "string", description: "Name of the list" },
        order: { type: "integer", description: "Display order" },
      },
    },
    execute: ({ boardId, displayName, order }: any) =>
      KanbanModel.createList({ boardId, displayName, order: order ?? 0 }),
  },
  {
    name: "create_task",
    description: "Create a new task/card inside a list",
    inputSchema: z.object({
      listId: z.string().uuid(),
      title: z.string().min(1),
      description: z.preprocess(
        (val) => (val === null || val === undefined ? "" : val),
        z.string()
      ),
      assignee: z.preprocess(
        (val) => (val === null || val === undefined || val === "" ? null : val),
        z.string().nullable()
      ),
    }),
    parameters: {
      type: "object",
      required: ["listId", "title"],
      properties: {
        listId: { type: "string", format: "uuid", description: "ID of the list to add the task to" },
        title: { type: "string", description: "Task title" },
        description: { type: ["string", "null"], description: "Task description" },
        assignee: { type: ["string", "null"], description: "Person assigned to the task" },
      },
    },
    execute: ({ listId, title, description, assignee }: any) =>
      KanbanModel.createTask(listId, {
        title,
        description,
        assignee,
      }),
  },
  {
    name: "update_task",
    description: "Update an existing task",
    inputSchema: z.object({
      taskId: z.string().uuid(),
      title: z.preprocess(
        (val) => (val === null || val === "" ? undefined : val),
        z.string().min(1).optional()
      ),
      description: z.preprocess(
        (val) => (val === null ? undefined : val),
        z.string().optional()
      ),
      assignee: z.preprocess(
        (val) => (val === null || val === "" ? null : val),
        z.string().nullable().optional()
      ),
    }),
    parameters: {
      type: "object",
      required: ["taskId"],
      properties: {
        taskId: { type: "string", format: "uuid", description: "ID of the task to update" },
        title: { type: ["string", "null"], description: "New task title" },
        description: { type: ["string", "null"], description: "New task description" },
        assignee: { type: ["string", "null"], description: "Person assigned to the task" },
      },
    },
    execute: ({ taskId, ...updates }: any) =>
      KanbanModel.updateTaskById(taskId, updates),
  },
  {
    name: "move_task",
    description: "Move a single task from one list to another",
    inputSchema: z.object({
      taskId: z.string().uuid(),
      listId: z.string().uuid(),
    }),
    parameters: {
      type: "object",
      required: ["taskId", "listId"],
      properties: {
        taskId: { type: "string", format: "uuid", description: "ID of the task to move" },
        listId: { type: "string", format: "uuid", description: "ID of the destination list" },
      },
    },
    execute: ({ taskId, listId }: any) => KanbanModel.moveTask(taskId, listId),
  },
  {
    name: "move_tasks_bulk",
    description: "Move multiple tasks to a destination list in one call",
    inputSchema: z.object({
      taskIds: z.array(z.string().uuid()).min(1),
      listId: z.string().uuid(),
    }),
    parameters: {
      type: "object",
      required: ["taskIds", "listId"],
      properties: {
        taskIds: {
          type: "array",
          items: { type: "string", format: "uuid" },
          description: "Array of task IDs to move",
        },
        listId: { type: "string", format: "uuid", description: "ID of the destination list" },
      },
    },
    execute: ({ taskIds, listId }: any) => {
      const results = [];
      for (const taskId of taskIds) {
        try {
          const result = KanbanModel.moveTask(taskId, listId);
          results.push({ taskId, success: true, result });
        } catch (err) {
          results.push({ taskId, success: false, error: (err as Error).message });
        }
      }
      return { moved: results.length, results };
    },
  },
  {
    name: "delete_task",
    description: "Soft delete a task",
    inputSchema: z.object({
      taskId: z.string().uuid(),
    }),
    parameters: {
      type: "object",
      required: ["taskId"],
      properties: {
        taskId: { type: "string", format: "uuid", description: "ID of the task to delete" },
      },
    },
    execute: ({ taskId }: any) => ({ success: KanbanModel.deleteTaskById(taskId) }),
  },
  {
    name: "create_subtask",
    description: "Create a subtask inside a task",
    inputSchema: z.object({
      taskId: z.string().uuid(),
      title: z.string().min(1),
      description: z.preprocess(
        (val) => (val === null || val === undefined ? "" : val),
        z.string()
      ),
    }),
    parameters: {
      type: "object",
      required: ["taskId", "title"],
      properties: {
        taskId: { type: "string", format: "uuid", description: "ID of the parent task" },
        title: { type: "string", description: "Subtask title" },
        description: { type: ["string", "null"], description: "Subtask description" },
      },
    },
    execute: ({ taskId, title, description }: any) =>
      KanbanModel.createSubTask(taskId, { title, description }),
  },
  {
    name: "update_subtask",
    description: "Update an existing subtask",
    inputSchema: z.object({
      taskId: z.string().uuid(),
      subTaskId: z.string().uuid(),
      title: z.preprocess(
        (val) => (val === null || val === "" ? undefined : val),
        z.string().min(1).optional()
      ),
      description: z.preprocess(
        (val) => (val === null ? undefined : val),
        z.string().optional()
      ),
    }),
    parameters: {
      type: "object",
      required: ["taskId", "subTaskId"],
      properties: {
        taskId: { type: "string", format: "uuid", description: "ID of the parent task" },
        subTaskId: { type: "string", format: "uuid", description: "ID of the subtask to update" },
        title: { type: ["string", "null"], description: "New subtask title" },
        description: { type: ["string", "null"], description: "New subtask description" },
      },
    },
    execute: ({ taskId, subTaskId, ...updates }: any) =>
      KanbanModel.updateSubTaskById(taskId, subTaskId, updates),
  },
  {
    name: "delete_subtask",
    description: "Soft delete a subtask",
    inputSchema: z.object({
      taskId: z.string().uuid(),
      subTaskId: z.string().uuid(),
    }),
    parameters: {
      type: "object",
      required: ["taskId", "subTaskId"],
      properties: {
        taskId: { type: "string", format: "uuid", description: "ID of the parent task" },
        subTaskId: { type: "string", format: "uuid", description: "ID of the subtask to delete" },
      },
    },
    execute: ({ taskId, subTaskId }: any) => ({
      success: KanbanModel.deleteSubTaskById(taskId, subTaskId),
    }),
  },
];

const toolMap = new Map(tools.map((t) => [t.name, t]));

function buildChatTools(): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters as any,
    },
  }));
}

export interface AgentAction {
  tool: string;
  input: any;
  output: any;
}

export interface AgentResult {
  success: boolean;
  actions: AgentAction[];
  reply?: string;
}

export async function runCommand(command: string): Promise<AgentResult> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: command },
  ];

  const actions: AgentAction[] = [];
  let lastError: unknown;

  for (const model of FREE_MODELS) {
    try {
      for (let turn = 0; turn < MAX_TURNS; turn++) {
        const response = (await Promise.race([
          client.chat.completions.create({
            model,
            messages,
            tools: buildChatTools(),
            tool_choice: "auto",
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Request timed out")),
              REQUEST_TIMEOUT_MS
            )
          ),
        ])) as OpenAI.Chat.Completions.ChatCompletion;

        const message = response.choices[0]?.message;

        if (!message) {
          return { success: false, actions };
        }

        // If the model returned text and no tool calls, we're done
        if (message.content && !message.tool_calls?.length) {
          return {
            success: true,
            actions,
            reply: message.content,
          };
        }

        // If no tool calls and no content, we're done
        if (!message.tool_calls?.length) {
          return { success: true, actions };
        }

        // Execute tool calls
        messages.push(message);

        for (const toolCall of message.tool_calls) {
          if (toolCall.type !== "function") continue;

          const calledName = toolCall.function.name
            .replace(/<\|.*?\|>/g, "")
            .trim();

          // Free models sometimes append garbage suffixes like "json" or "commentary".
          // Find the known tool name that is a prefix of what the model called.
          const toolName =
            tools
              .map((t) => t.name)
              .filter((name) => calledName === name || calledName.startsWith(name))
              .sort((a, b) => b.length - a.length)[0] ?? calledName;

          const tool = toolMap.get(toolName);

          if (!tool) {
            actions.push({
              tool: toolName,
              input: toolCall.function.arguments,
              output: { error: "Unknown tool" },
            });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: "Unknown tool" }),
            });
            continue;
          }

          let input: any;
          try {
            input = JSON.parse(toolCall.function.arguments);
          } catch {
            actions.push({
              tool: toolName,
              input: toolCall.function.arguments,
              output: { error: "Invalid JSON arguments" },
            });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: "Invalid JSON arguments" }),
            });
            continue;
          }

          // Validate with Zod
          const parseResult = tool.inputSchema.safeParse(input);
          if (!parseResult.success) {
            actions.push({
              tool: toolName,
              input,
              output: { error: parseResult.error.issues },
            });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error: parseResult.error.issues }),
            });
            continue;
          }

          try {
            const output = await tool.execute(input);
            actions.push({ tool: toolName, input, output });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(output ?? {}),
            });
          } catch (err) {
            const error = (err as Error).message;
            actions.push({ tool: toolName, input, output: { error } });
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({ error }),
            });
          }
        }
      }

      return { success: true, actions };
    } catch (err) {
      lastError = err;
      const error = err as { status?: number; message?: string };
      if (error.status !== 429) {
        throw err;
      }
      console.warn(`[Agent] ${model} rate limited, trying fallback...`);
    }
  }

  throw new Error(
    `All free models are currently unavailable. Last error: ${(lastError as Error).message}`
  );
}
