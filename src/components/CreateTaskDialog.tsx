import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { cn } from "@/lib/utils";
import type { NewTask } from "@/hooks/useTasks";
import type { Priority, Status, TeamMember, Label, Task } from "@/types";

const STATUS_LABELS: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export function CreateTaskDialog({
  onCreate,
  onToggleLabel,
  members = [],
  labels = [],
}: {
  onCreate: (task: NewTask) => Promise<Task>;
  onToggleLabel: (taskId: string, labelId: string) => Promise<void>;
  members?: TeamMember[];
  labels?: Label[];
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("normal");
  const [status, setStatus] = useState<Status>("todo");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggleLabel(id: string) {
    setSelectedLabels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("normal");
    setDueDate("");
    setSelectedAssignees([]);
    setStatus("todo");
    setSelectedLabels([]);
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const newTask = await onCreate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        due_date: dueDate || null,
        assignee_ids: selectedAssignees,
      });
      for (const labelId of selectedLabels) {
        await onToggleLabel(newTask.id, labelId);
      }
      reset();
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5" />}>
        <Plus className="h-4 w-4" />
        New task
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <Input
              autoFocus
              placeholder="What needs to be done?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add more detail (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={status}
                onValueChange={(v) => setStatus((v ?? "todo") as Status)}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left text-sm">
                    {STATUS_LABELS[status]}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [Status, string][])
                    .filter(([val]) => val !== "done")
                    .map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Priority</label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Priority)}
              >
                <SelectTrigger>
                  <span className="flex flex-1 text-left text-sm capitalize">{priority}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Due date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {members.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assignee</label>
              <div className="flex flex-wrap gap-2">
                {members.map((m) => {
                  const active = selectedAssignees.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() =>
                        setSelectedAssignees((prev) =>
                          prev.includes(m.id)
                            ? prev.filter((id) => id !== m.id)
                            : [...prev, m.id],
                        )
                      }
                      className={cn(
                        "flex items-center gap-1.5 rounded-full py-0.5 pl-1 pr-2.5 text-xs font-medium transition-all",
                        active ? "text-white" : "text-muted-foreground opacity-60",
                      )}
                      style={{
                        backgroundColor: active ? m.avatar_color : "transparent",
                        border: `1px solid ${m.avatar_color}`,
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

          {labels.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Labels</label>
              <div className="flex flex-wrap gap-1.5">
                {labels.map((l) => {
                  const selected = selectedLabels.includes(l.id);
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => toggleLabel(l.id)}
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white transition-opacity"
                      style={{
                        backgroundColor: l.color,
                        opacity: selected ? 1 : 0.35,
                        outline: selected ? `2px solid ${l.color}` : "none",
                        outlineOffset: "2px",
                      }}
                      title={l.name.length > 10 ? l.name : undefined}
                    >
                      {l.name.length > 10 ? l.name.slice(0, 10) + "…" : l.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || submitting}>
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Creating…" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
