import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";
import type { Task, TeamMember, Label } from "@/types";

export function DraggableTaskCard({
  task,
  assignees,
  labels,
  onEdit,
  onComments,
  onActivity,
  onDelete,
}: {
  task: Task;
  assignees?: TeamMember[];
  labels?: Label[];
  onEdit?: () => void;
  onComments?: () => void;
  onActivity?: () => void;
  onDelete?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={isDragging ? { visibility: "hidden" } : { transform: CSS.Translate.toString(transform) }}
    >
      <TaskCard
        task={task}
        assignees={assignees}
        labels={labels}
        onEdit={onEdit}
        onComments={onComments}
        onActivity={onActivity}
        onDelete={onDelete}
      />
    </div>
  );
}
