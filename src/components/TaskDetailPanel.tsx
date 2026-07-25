import { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import type { Task, TeamMember, Label, Status, Activity } from "@/types";

const STATUS_LABELS: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export function TaskDetailPanel({
  task,
  open,
  onOpenChange,
  defaultTab = "edit",
  members,
  labels,
  taskLabels,
  taskAssignees,
  updateTask,
  toggleTaskLabel,
  toggleTaskAssignee,
  latestMoveActivity = null,
}: {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "edit" | "comments" | "activity";
  members: TeamMember[];
  labels: Label[];
  taskLabels: Record<string, string[]>;
  taskAssignees: Record<string, string[]>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  toggleTaskLabel: (taskId: string, labelId: string) => Promise<void>;
  toggleTaskAssignee: (taskId: string, memberId: string) => Promise<void>;
  latestMoveActivity?: Activity | null;
}) {
  const { comments, addComment } = useComments(task?.id ?? null);
  const { activity, refetch: refetchActivity } = useActivity(task?.id ?? null);

  // Merge optimistic move entry so the activity panel shows it instantly,
  // before the async fetchActivity round-trip completes.
  const displayActivity = useMemo(() => {
    if (!latestMoveActivity) return activity;
    const alreadyFetched = activity.some((a) => a.description === latestMoveActivity.description);
    return alreadyFetched ? activity : [latestMoveActivity, ...activity];
  }, [activity, latestMoveActivity]);

  const [commentText, setCommentText] = useState("");
  const [saving, setSaving] = useState(false);

  const [draftDescription, setDraftDescription] = useState<string>("");
  const [draftStatus, setDraftStatus] = useState<Status>("todo");
  const [draftPriority, setDraftPriority] = useState<Task["priority"]>("normal");
  const [draftDueDate, setDraftDueDate] = useState<string>("");
  const [draftAssignees, setDraftAssignees] = useState<string[]>([]);
  const [draftLabels, setDraftLabels] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setDraftDescription(task.description ?? "");
      setDraftStatus(task.status);
      setDraftPriority(task.priority);
      setDraftDueDate(task.due_date ?? "");
      setDraftAssignees(taskAssignees[task.id] ?? []);
      setDraftLabels(taskLabels[task.id] ?? []);
    }
  }, [task?.id, open]);

  // Refetch activity every time the panel opens so the latest entries are always visible
  useEffect(() => {
    if (open && task?.id) refetchActivity();
  }, [open, task?.id, refetchActivity]);

  if (!task) return null;
  const t = task;

  const activeLabels = taskLabels[t.id] ?? [];
  const activeAssignees = taskAssignees[t.id] ?? [];

  async function handleConfirm() {
    setSaving(true);
    try {
      const updates: Partial<Task> = {};
      if (draftDescription !== (t.description ?? ""))
        updates.description = draftDescription || null;
      if (draftStatus !== t.status) updates.status = draftStatus;
      if (draftPriority !== t.priority) updates.priority = draftPriority;
      if (draftDueDate !== (t.due_date ?? ""))
        updates.due_date = draftDueDate || null;
      if (Object.keys(updates).length > 0) await updateTask(t.id, updates);

      const prevA = new Set(activeAssignees);
      const nextA = new Set(draftAssignees);
      for (const id of [...prevA]) if (!nextA.has(id)) await toggleTaskAssignee(t.id, id);
      for (const id of [...nextA]) if (!prevA.has(id)) await toggleTaskAssignee(t.id, id);

      const prev = new Set(activeLabels);
      const next = new Set(draftLabels);
      for (const id of [...prev]) if (!next.has(id)) await toggleTaskLabel(t.id, id);
      for (const id of [...next]) if (!prev.has(id)) await toggleTaskLabel(t.id, id);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  function toggleDraftLabel(id: string) {
    setDraftLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  if (defaultTab === "comments") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col px-4 pb-4 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="pr-6 text-left">{t.title}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col overflow-hidden pt-2">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No comments yet</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="rounded-lg bg-muted/50 p-2.5">
                    <p className="text-sm">{c.body}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{timeAgo(c.created_at)}</p>
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
                  if (e.key === "Enter") { addComment(commentText); setCommentText(""); }
                }}
              />
              <Button size="sm" onClick={() => { addComment(commentText); setCommentText(""); }}>
                Send
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (defaultTab === "activity") {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col px-4 pb-4 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="pr-6 text-left">{t.title}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto pt-2">
            {displayActivity.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {displayActivity.map((a) => (
                  <div key={a.id} className="flex gap-2.5 text-sm">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                    <div>
                      <p className="text-foreground">{a.description}</p>
                      <p className="text-[11px] text-muted-foreground">{timeAgo(a.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            <Textarea
              placeholder="Add more detail (optional)"
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={draftStatus}
                onValueChange={(v) => setDraftStatus((v ?? "todo") as Status)}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left text-sm">
                    {STATUS_LABELS[draftStatus]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([val, label]) => (
                    <SelectItem key={val} value={val}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
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
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Due date</label>
            <Input
              type="date"
              value={draftDueDate}
              onChange={(e) => setDraftDueDate(e.target.value)}
            />
          </div>

          {/* Assignees */}
          {members.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const active = draftAssignees.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() =>
                        setDraftAssignees((prev) =>
                          prev.includes(m.id)
                            ? prev.filter((id) => id !== m.id)
                            : [...prev, m.id],
                        )
                      }
                      className="flex items-center gap-1.5 rounded-full py-0.5 pl-1 pr-2.5 text-xs font-medium transition-all"
                      style={{
                        backgroundColor: active ? m.avatar_color : "transparent",
                        border: `1px solid ${m.avatar_color}`,
                        color: active ? "white" : "var(--muted-foreground)",
                        opacity: active ? 1 : 0.6,
                      }}
                    >
                      <span
                        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: m.avatar_color }}
                      >
                        {m.name.charAt(0).toUpperCase()}
                      </span>
                      <span title={m.name.length > 10 ? m.name : undefined}>
                        {m.name.length > 10 ? m.name.slice(0, 10) + "…" : m.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Labels */}
          {labels.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-medium text-muted-foreground">Labels</label>
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
                      <span title={l.name.length > 10 ? l.name : undefined}>
                        {l.name.length > 10 ? l.name.slice(0, 10) + "…" : l.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? "Saving…" : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
