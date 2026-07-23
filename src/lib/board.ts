import type { Status, Priority } from "@/types";

export const COLUMNS: { id: Status; title: string; color: string }[] = [
  { id: "todo", title: "To Do", color: "var(--color-todo)" },
  { id: "in_progress", title: "In Progress", color: "var(--color-progress)" },
  { id: "in_review", title: "In Review", color: "var(--color-review)" },
  { id: "done", title: "Done", color: "var(--color-done)" },
];

export const PRIORITY_META: Record<Priority, { label: string; color: string }> =
  {
    low: { label: "Low", color: "var(--color-priority-low)" },
    normal: { label: "Normal", color: "var(--color-priority-normal)" },
    high: { label: "High", color: "var(--color-priority-high)" },
  };

/** Returns urgency info for a due date, or null if none set. */
export function getDueMeta(due: string | null) {
  if (!due) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(due + "T00:00:00");
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86_400_000);

  const label = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  if (diffDays < 0) return { label, tone: "overdue" as const };
  if (diffDays <= 2) return { label, tone: "soon" as const };
  return { label, tone: "normal" as const };
}
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
