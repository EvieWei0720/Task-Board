import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";

const tools = [
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description: "Create a new task on the board.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "normal", "high"] },
          due_date: { type: "string", description: "YYYY-MM-DD" },
          status: {
            type: "string",
            enum: ["todo", "in_progress", "in_review", "done"],
          },
          assignee_id: {
            type: "string",
            description: "Team member id from the board state, if assigning.",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_task",
      description: "Change a task's status, priority, or due date.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          status: {
            type: "string",
            enum: ["todo", "in_progress", "in_review", "done"],
          },
          priority: { type: "string", enum: ["low", "normal", "high"] },
          due_date: { type: "string" },
        },
        required: ["task_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "assign_task",
      description: "Assign a task to a team member.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          assignee_id: { type: "string" },
        },
        required: ["task_id", "assignee_id"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_label",
      description: "Add a label to a task.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          label_id: { type: "string" },
        },
        required: ["task_id", "label_id"],
      },
    },
  },
];

function devAgentPlugin(env: Record<string, string>): Plugin {
  return {
    name: "dev-agent",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(
        "/api/agent",
        (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end("Method not allowed");
            return;
          }
          const chunks: Buffer[] = [];
          req.on("data", (c: Buffer) => chunks.push(c));
          req.on("end", async () => {
            try {
              const { messages, context } = JSON.parse(
                Buffer.concat(chunks).toString(),
              );
              const system = `You are a helpful assistant embedded in a Kanban task board.

You can create, update, assign, and label tasks using the provided tools, and answer questions about the board in plain text.

Here is the current board state as JSON. Use it to resolve names the user mentions (e.g. a person's name, a label name, a task title) to the correct id when calling tools:

${JSON.stringify(context)}

Rules:
- When the user asks to make a change, call the appropriate tool(s). Do not ask for confirmation yourself — the app handles that.
- When the user asks a question ("how many tasks are overdue?", "what's Sarah working on?"), answer directly in text using the board state. Do not call a tool.
- If you can't find a matching task/member/label in the state, say so instead of guessing.
- Keep text responses short.`;

              const openaiRes = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "content-type": "application/json",
                    Authorization: `Bearer ${env.GPT_API_KEY}`,
                  },
                  body: JSON.stringify({
                    model: "gpt-4o",
                    max_tokens: 1024,
                    messages: [
                      { role: "system", content: system },
                      ...messages,
                    ],
                    tools,
                  }),
                  signal: AbortSignal.timeout(25000),
                },
              );
              const data = await openaiRes.json();
              res.setHeader("content-type", "application/json");
              res.end(JSON.stringify(data));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader("content-type", "application/json");
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : "Agent error",
                }),
              );
            }
          });
        },
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), devAgentPlugin(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
