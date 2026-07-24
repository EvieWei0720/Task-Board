import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { DraggableTaskCard } from "./DraggableTaskCard";
import type { Task, Status, TeamMember, Label } from "@/types";

interface ColumnProps {
  title: string;
  color: string;
  status: Status;
  tasks: Task[];
  members: TeamMember[];
  labels: Label[];
  taskLabels: Record<string, string[]>;
  taskAssignees: Record<string, string[]>;
  onTaskEdit: (task: Task) => void;
  onTaskComments: (task: Task) => void;
  onTaskActivity: (task: Task) => void;
  onTaskDelete: (task: Task) => void;
}

export function Column({
  title,
  color,
  status,
  tasks,
  members,
  labels,
  taskLabels,
  taskAssignees,
  onTaskEdit,
  onTaskComments,
  onTaskActivity,
  onTaskDelete,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col rounded-xl bg-muted/40 min-h-0 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="ml-auto rounded-full bg-background px-2 py-0.5 text-xs font-semibold tabular-nums text-foreground shadow-sm">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex flex-1 flex-col gap-2 overflow-y-auto rounded-lg px-2 pb-2 transition-colors",
          isOver && "bg-brand/5 ring-2 ring-inset ring-brand/30",
        )}
      >
        {tasks.length === 0 ? (
          <div
            className={cn(
              "flex flex-1 items-center justify-center rounded-lg border border-dashed py-8 transition-colors",
              isOver ? "border-brand/40" : "border-border",
            )}
          >
            <p className="text-xs text-muted-foreground">
              {isOver ? "Drop here" : "No tasks yet"}
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              assignees={members.filter((m) =>
                (taskAssignees[task.id] ?? []).includes(m.id),
              )}
              labels={labels.filter((l) =>
                (taskLabels[task.id] ?? []).includes(l.id),
              )}
              onEdit={() => onTaskEdit(task)}
              onComments={() => onTaskComments(task)}
              onActivity={() => onTaskActivity(task)}
              onDelete={() => onTaskDelete(task)}
            />
          ))
        )}
      </div>
    </div>
  );
}
