import { useState } from "react";
import { Sparkles, Send, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAgent, type AgentAction } from "@/hooks/useAgent";
import type { Task, TeamMember, Label } from "@/types";

export function AgentPanel({
  tasks,
  members,
  labels,
  taskAssignees,
  onExecute,
}: {
  tasks: Task[];
  members: TeamMember[];
  labels: Label[];
  taskAssignees: Record<string, string[]>;
  onExecute: (actions: AgentAction[]) => Promise<void>;
}) {
  const getContext = () => ({
    today: new Date().toISOString().slice(0, 10),
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      due_date: t.due_date,
      assignee_ids: taskAssignees[t.id] ?? [],
    })),
    members: members.map((m) => ({ id: m.id, name: m.name })),
    labels: labels.map((l) => ({ id: l.id, name: l.name })),
  });

  const { messages, pending, loading, error, send, resolvePending } =
    useAgent(getContext);
  const [input, setInput] = useState("");

  function describeAction(a: AgentAction): string {
    const i = a.input as Record<string, string>;
    const taskTitle =
      tasks.find((t) => t.id === i.task_id)?.title ?? i.title ?? "task";
    const memberName = members.find((m) => m.id === i.assignee_id)?.name;
    const labelName = labels.find((l) => l.id === i.label_id)?.name;
    switch (a.name) {
      case "create_task":
        return `Create "${i.title}"${i.priority ? ` · ${i.priority} priority` : ""}${
          memberName ? ` · assign ${memberName}` : ""
        }`;
      case "update_task":
        return `Update "${taskTitle}"${i.status ? ` → ${i.status}` : ""}${
          i.priority ? ` · ${i.priority} priority` : ""
        }`;
      case "assign_task":
        return `Assign "${taskTitle}" to ${memberName ?? "someone"}`;
      case "add_label":
        return `Add label "${labelName ?? "?"}" to "${taskTitle}"`;
      default:
        return a.name;
    }
  }

  async function handleConfirm() {
    const count = pending.length;
    await onExecute(pending);
    resolvePending(
      `✓ Done — ${count} action${count === 1 ? "" : "s"} applied.`,
    );
  }

  return (
    <Sheet>
      <SheetTrigger render={<Button size="sm" variant="outline" className="gap-1.5" />}>
        <Sparkles className="h-4 w-4" />
        AI Assistant
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col px-3 pb-3 sm:max-w-md">
        <SheetHeader className="pb-1">
          <SheetTitle className="flex items-center gap-1.5 text-left text-sm">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            AI Assistant
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-2 overflow-y-auto py-1">
          {messages.length === 0 && (
            <div className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground">
              Try: "Create a high-priority task to fix the login bug", "Move
              everything in review to done", or "How many tasks are overdue?"
            </div>
          )}

          {messages.map((m, idx) =>
            m.role === "user" ? (
              <div key={idx} className="flex items-end justify-end gap-1.5">
                <div className="max-w-[75%] rounded-lg bg-primary px-2.5 py-1.5 text-xs text-primary-foreground">
                  {m.content}
                </div>
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div key={idx} className="flex items-end gap-1.5">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="max-w-[75%] rounded-lg bg-muted px-2.5 py-1.5 text-xs">
                  {m.content}
                </div>
              </div>
            )
          )}

          {loading && (
            <div className="max-w-[85%] rounded-lg bg-muted px-2.5 py-1.5 text-xs text-muted-foreground">
              Thinking…
            </div>
          )}

          {pending.length > 0 && (
            <div className="rounded-md border border-brand/30 bg-brand/5 p-2">
              <p className="mb-1.5 text-xs font-semibold text-foreground">
                I'd like to make these changes:
              </p>
              <ul className="mb-2 space-y-0.5">
                {pending.map((a) => (
                  <li key={a.id} className="text-xs text-foreground">
                    • {describeAction(a)}
                  </li>
                ))}
              </ul>
              <div className="flex gap-1.5">
                <Button size="sm" onClick={handleConfirm}>Confirm</Button>
                <Button size="sm" variant="ghost" onClick={() => resolvePending("Cancelled.")}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-600">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 border-t border-border pt-2">
          <Input
            placeholder="Ask or tell the assistant…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) {
                send(input);
                setInput("");
              }
            }}
          />
          <Button
            size="icon"
            disabled={loading || !input.trim()}
            onClick={() => {
              send(input);
              setInput("");
            }}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
