import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./TaskCard";
import type { Task, TeamMember, Label } from "@/types";

export function DraggableTaskCard({
  task,
  assignee,
  labels,
  onClick,
}: {
  task: Task;
  assignee?: TeamMember;
  labels?: Label[];
  onClick?: () => void;
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
        assignee={assignee}
        labels={labels}
        onClick={onClick}
      />
    </div>
  );
}
