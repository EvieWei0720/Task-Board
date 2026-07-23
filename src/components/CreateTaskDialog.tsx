import { useState } from "react";
import { Plus } from "lucide-react";
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
  SelectValue,
} from "@/components/ui/select";
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
  const [assigneeId, setAssigneeId] = useState<string>("none");
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
    setAssigneeId("none");
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
        assignee_id: assigneeId === "none" ? null : assigneeId,
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
                  {(Object.entries(STATUS_LABELS) as [Status, string][]).map(([val, label]) => (
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
              <Select value={assigneeId} onValueChange={(v) => setAssigneeId(v ?? "none")}>
                <SelectTrigger>
                  <span className="flex flex-1 text-left text-sm">
                    {assigneeId === "none"
                      ? "Unassigned"
                      : (members.find((m) => m.id === assigneeId)?.name ?? "Unassigned")}
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
                    >
                      {l.name}
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
            {submitting ? "Creating…" : "Create task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
