import { useState } from "react";
import { Calendar, MessageSquare, Activity, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_META, getDueMeta } from "@/lib/board";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Task, TeamMember, Label } from "@/types";

export function TaskCard({
  task,
  isOverlay = false,
  assignees = [],
  labels = [],
  onClick,
  onEdit,
  onComments,
  onActivity,
  onDelete,
}: {
  task: Task;
  isOverlay?: boolean;
  assignees?: TeamMember[];
  labels?: Label[];
  onClick?: () => void;
  onEdit?: () => void;
  onComments?: () => void;
  onActivity?: () => void;
  onDelete?: () => void;
}) {
  const priority = PRIORITY_META[task.priority];
  const due = getDueMeta(task.due_date);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div
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
            <div
              className="absolute top-2 right-2"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Task options"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="end">
                  <DropdownMenuItem onClick={() => onEdit?.()}>
                    <Pencil className="h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onComments?.()}>
                    <MessageSquare className="h-4 w-4" />
                    Comments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onActivity?.()}>
                    <Activity className="h-4 w-4" />
                    Activity
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {labels.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1">
              {labels.map((l) => (
                <span
                  key={l.id}
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                  style={{ backgroundColor: l.color }}
                  title={l.name.length > 10 ? l.name : undefined}
                >
                  {l.name.length > 10 ? l.name.slice(0, 10) + "…" : l.name}
                </span>
              ))}
            </div>
          )}

          <p
            className="text-sm font-medium leading-snug text-foreground"
            title={task.title.length > 20 ? task.title : undefined}
          >
            {task.title.length > 20 ? task.title.slice(0, 20) + "…" : task.title}
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

            {assignees.length > 0 && (
              <div className="ml-auto flex items-center">
                {assignees.slice(0, 3).map((a, i) => (
                  <span
                    key={a.id}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-card"
                    style={{
                      backgroundColor: a.avatar_color,
                      marginLeft: i === 0 ? 0 : "-8px",
                      zIndex: assignees.length - i,
                      position: "relative",
                    }}
                    title={a.name}
                  >
                    {a.name.charAt(0).toUpperCase()}
                  </span>
                ))}
                {assignees.length > 3 && (
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-card"
                    style={{ marginLeft: "-8px", position: "relative" }}
                  >
                    +{assignees.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete task?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            "{task.title}" will be permanently deleted. This cannot be undone.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                onDelete?.();
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
