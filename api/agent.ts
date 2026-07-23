export const config = { runtime: "edge" };

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

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { messages, context } = (await req.json()) as {
      messages: unknown[];
      context: unknown;
    };

    const system = `You are a helpful assistant embedded in a Kanban task board.

You can create, update, assign, and label tasks using the provided tools, and answer questions about the board in plain text.

Here is the current board state as JSON. Use it to resolve names the user mentions (e.g. a person's name, a label name, a task title) to the correct id when calling tools:

${JSON.stringify(context)}

Rules:
- When the user asks to make a change, call the appropriate tool(s). Do not ask for confirmation yourself — the app handles that.
- When the user asks a question ("how many tasks are overdue?", "what's Sarah working on?"), answer directly in text using the board state. Do not call a tool.
- If you can't find a matching task/member/label in the state, say so instead of guessing.
- Keep text responses short.`;

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Authorization": `Bearer ${process.env.GPT_API_KEY!}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1024,
        messages: [{ role: "system", content: system }, ...(messages as unknown[])],
        tools,
      }),
      signal: AbortSignal.timeout(25000),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Agent error",
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
