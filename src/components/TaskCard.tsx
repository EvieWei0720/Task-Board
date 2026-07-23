import { Calendar, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_META, getDueMeta } from "@/lib/board";
import type { Task, TeamMember, Label } from "@/types";

export function TaskCard({
  task,
  isOverlay = false,
  assignee,
  labels = [],
  onClick,
}: {
  task: Task;
  isOverlay?: boolean;
  assignee?: TeamMember;
  labels?: Label[];
  onClick?: () => void;
}) {
  const priority = PRIORITY_META[task.priority];
  const due = getDueMeta(task.due_date);

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative rounded-lg border border-border bg-card p-3",
        "shadow-sm transition-all duration-150",
        isOverlay
          ? "rotate-2 cursor-grabbing shadow-lg"
          : "cursor-grab hover:border-border/80 hover:shadow-md",
      )}
    >
      <span
        className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
        style={{ backgroundColor: priority.color }}
        aria-hidden
      />

      <div className="pl-2 pr-5">
        {!isOverlay && (
          <button
            onClick={onClick}
            className="absolute top-2 right-2 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            tabIndex={-1}
            aria-label="Edit task"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}

        {labels.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {labels.map((l) => (
              <span
                key={l.id}
                className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: l.color }}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}

        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {task.title}
        </p>

        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        <div className="mt-2.5 flex items-center gap-2">
          {due && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                due.tone === "overdue" && "bg-red-100 text-red-600",
                due.tone === "soon" && "bg-amber-100 text-amber-600",
                due.tone === "normal" && "bg-muted text-muted-foreground",
              )}
            >
              <Calendar className="h-3 w-3" />
              {due.label}
            </span>
          )}

          {assignee && (
            <span
              className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: assignee.avatar_color }}
              title={assignee.name}
            >
              {assignee.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
