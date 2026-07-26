# Task Board

A full-stack Kanban task board built with React, TypeScript, and Supabase, deployed on Vercel. Designed for internal use to improve team productivity — tasks move across four columns (To Do, In Progress, In Review, Done) via drag-and-drop, with support for team members, labels, due dates, comments, an activity log, board-wide search/stats, and an AI assistant that can create and update tasks through natural language.

## Links

- **Live app:** https://task-board-gu.vercel.app/ (best viewed on a laptop/computer rather than a phone)


## Setup Instructions

```bash
git clone https://github.com/EvieWei0720/Task-Board.git
cd Task-Board
npm install

# Create a .env.local with:
VITE_SUPABASE_URL=<your supabase project url>
VITE_SUPABASE_ANON_KEY=<your supabase anon key>
GPT_API_KEY=<your OpenAI API key> # only needed for the AI assistant feature

# Run the tables/policies above against your Supabase project
# then enable anonymous sign-in.

npm run dev   # starts Vite dev server, default http://localhost:5173
npm run build # builds for production
```

> **Note:** The `/api/agent` serverless function only runs on Vercel (or with `vercel dev` locally) since it's a Vercel Edge Function. Running purely `npm run dev` will serve the board fine, but the AI assistant panel will fail to reach that endpoint unless it's proxied or run via the Vercel CLI.

## Advanced Features

1. **Team members & assignees** — tasks can have multiple assignees, managed through the `task_assignees` join table and surfaced as avatars on each card.
2. **Task comments** — threaded comments per task, stored in `comments` and rendered oldest-first in the detail panel.
3. **Task activity log** — every create/update/assign/label/comment action writes a row to `activity_log`, shown as a timeline on the task.
4. **Labels** — custom colored labels attach to tasks (`task_labels`).
5. **Due-date indicators** — cards visually flag tasks that are overdue or due soon, computed client-side from `due_date` against today's date.
6. **Search & filtering** — the board can be filtered by label or assignee, and free-text search across task titles.
7. **Board summary** — a summary bar (total tasks, done counts, overdue count) beside the company name.
8. **AI board assistant** — a chat panel (`AgentPanel` / `useAgent`) sends the user's message plus a JSON snapshot of the current board (tasks, members, labels) to a Vercel Edge Function at `/api/agent`. That function calls OpenAI's GPT-4o with four function-calling tools (`create_task`, `update_task`, `assign_task`, `add_label`) and a system prompt that resolves names the user mentions (e.g. "assign this to Sam") against the ids in the board snapshot.

   The key design choice is **propose-then-confirm human-in-the-loop**: when the model returns tool calls, the app does not execute them immediately. It surfaces the proposed action(s) in the chat UI and only writes to Supabase after the user explicitly confirms, via the same `createTask`/`updateTask`/`toggleTaskAssignee`/`toggleTaskLabel` functions the manual UI uses. Pure questions ("how many tasks are overdue?", "what's Sam working on?") are answered directly from the board snapshot in text, with no tool call and nothing for the user to confirm.

## Tradeoffs & What I'd Improve With More Time

1. **Anonymous-only auth** — great for a demo, but a guest's board is tied to a browser session/local storage token. With more time I'd add an email sign-in function.
2. **Client-side query inefficiency** — tasks, `task_labels`, and `task_assignees` are fetched as three parallel queries and joined in JS rather than one Postgres view. It's simple and fast enough at this scale, but a board with thousands of tasks would benefit from a server-side view that returns tasks pre-joined with their labels or assignees.
3. **AI assistant scope** — the agent's tools cover create, update, assign, and label. I'd extend the tool set (e.g. deleting comments, seeing activity logs for a specific task), do more context engineering, and use MCP to call a web search API to pull in external information.
4. **Extend the project scope** — currently a pure task board. I'd like to extend it to a project management system, with a left sidebar for additional workflow tools and a chat function so employees can reach out to colleagues directly.
