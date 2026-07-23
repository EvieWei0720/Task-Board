import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useComments } from "@/hooks/useComments";
import { useActivity } from "@/hooks/useActivity";
import { timeAgo } from "@/lib/board";
import { cn } from "@/lib/utils";
import type { Task, TeamMember, Label } from "@/types";

export function TaskDetailPanel({
  task,
  open,
  onOpenChange,
  members,
  labels,
  taskLabels,
  updateTask,
  toggleTaskLabel,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: TeamMember[];
  labels: Label[];
  taskLabels: Record<string, string[]>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTaskLabel: (taskId: string, labelId: string) => Promise<void>;
}) {
  const { comments, addComment } = useComments(task?.id ?? null);
  const { activity } = useActivity(task?.id ?? null);
  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);

  const [draftAssignee, setDraftAssignee] = useState<string>("none");
  const [draftPriority, setDraftPriority] = useState<Task["priority"]>("normal");
  const [draftDueDate, setDraftDueDate] = useState<string>("");
  const [draftLabels, setDraftLabels] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setDraftAssignee(task.assignee_id ?? "none");
      setDraftPriority(task.priority);
      setDraftDueDate(task.due_date ?? "");
      setDraftLabels(taskLabels[task.id] ?? []);
    }
  }, [task?.id, open]);

  if (!task) return null;

  const activeLabels = taskLabels[task.id] ?? [];

  const isDirty =
    draftAssignee !== (task.assignee_id ?? "none") ||
    draftPriority !== task.priority ||
    draftDueDate !== (task.due_date ?? "") ||
    JSON.stringify([...draftLabels].sort()) !== JSON.stringify([...activeLabels].sort());

  async function handleConfirm() {
    setSaving(true);
    try {
      const updates: Partial<Task> = {};
      if (draftAssignee !== (task.assignee_id ?? "none"))
        updates.assignee_id = draftAssignee === "none" ? null : draftAssignee;
      if (draftPriority !== task.priority) updates.priority = draftPriority;
      if (draftDueDate !== (task.due_date ?? ""))
        updates.due_date = draftDueDate || null;
      if (Object.keys(updates).length > 0) await updateTask(task.id, updates);

      const prev = new Set(activeLabels);
      const next = new Set(draftLabels);
      for (const id of [...prev]) if (!next.has(id)) await toggleTaskLabel(task.id, id);
      for (const id of [...next]) if (!prev.has(id)) await toggleTaskLabel(task.id, id);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraftAssignee(task.assignee_id ?? "none");
    setDraftPriority(task.priority);
    setDraftDueDate(task.due_date ?? "");
    setDraftLabels(activeLabels);
  }

  function toggleDraftLabel(id: string) {
    setDraftLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col px-8 pb-8 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="pr-6 text-left">{task.title}</SheetTitle>
        </SheetHeader>

        {/* Assignee + priority row */}
        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Assignee
            </label>
            <Select
              value={draftAssignee}
              onValueChange={(v) => setDraftAssignee(v ?? "none")}
            >
              <SelectTrigger>
                <span className="flex flex-1 text-left text-sm">
                  {draftAssignee === "none"
                    ? "Unassigned"
                    : (members.find((m) => m.id === draftAssignee)?.name ?? "Unassigned")}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Priority
            </label>
            <Select
              value={draftPriority}
              onValueChange={(v) => setDraftPriority((v ?? "normal") as Task["priority"])}
            >
              <SelectTrigger>
                <span className="flex flex-1 text-left text-sm capitalize">
                  {draftPriority}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Due date */}
        <div className="space-y-1.5 pb-1">
          <label className="text-xs font-medium text-muted-foreground">
            Due date
          </label>
          <Input
            type="date"
            value={draftDueDate}
            onChange={(e) => setDraftDueDate(e.target.value)}
          />
        </div>

        {/* Labels */}
        <div className="space-y-1.5 py-1">
          <label className="text-xs font-medium text-muted-foreground">
            Labels
          </label>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((l) => {
              const active = draftLabels.includes(l.id);
              return (
                <button
                  key={l.id}
                  onClick={() => toggleDraftLabel(l.id)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium transition-all",
                    active ? "text-white" : "text-muted-foreground opacity-50",
                  )}
                  style={{
                    backgroundColor: active ? l.color : "transparent",
                    border: `1px solid ${l.color}`,
                  }}
                >
                  {l.name}
                </button>
              );
            })}
            {labels.length === 0 && (
              <span className="text-xs text-muted-foreground">
                No labels created yet
              </span>
            )}
          </div>
        </div>

        {/* Confirm / Cancel */}
        {isDirty && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleConfirm} disabled={saving}>
              {saving ? "Saving…" : "Confirm the change"}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
          </div>
        )}

        {/* Comments + activity tabs */}
        <Tabs
          defaultValue="comments"
          className="mt-2 flex flex-1 flex-col overflow-hidden"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="comments">
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent
            value="comments"
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 space-y-3 overflow-y-auto py-3">
              {comments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No comments yet
                </p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-sm">{c.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {timeAgo(c.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-border pt-3">
              <Input
                placeholder="Write a comment…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addComment(commentText);
                    setCommentText("");
                  }
                }}
              />
              <Button
                size="sm"
                onClick={() => {
                  addComment(commentText);
                  setCommentText("");
                }}
              >
                Send
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-y-auto py-3">
            {activity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No activity yet
              </p>
            ) : (
              <div className="space-y-3">
                {activity.map((a) => (
                  <div key={a.id} className="flex gap-2.5 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <div>
                      <p className="text-foreground">{a.description}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {timeAgo(a.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
