import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useTasks } from "@/hooks/useTasks";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useLabels } from "@/hooks/useLabels";
import { COLUMNS, getDueMeta } from "@/lib/board";
import { logActivity } from "@/lib/activity";
import { Column } from "./Column";
import { TaskCard } from "./TaskCard";
import { CreateTaskDialog } from "./CreateTaskDialog";
import { BoardSkeleton } from "./BoardSkeleton";
import { ManageTeamDialog } from "./ManageTeamDialog";
import { ManageLabelsDialog } from "./ManageLabelsDialog";
import { FilterBar, type Filters } from "./FilterBar";
import { TaskDetailPanel } from "./TaskDetailPanel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Status, Task } from "@/types";
import { AgentPanel } from "./AgentPanel";
import type { AgentAction } from "@/hooks/useAgent";
const STATUS_LABELS: Record<Status, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export function Board() {
  const {
    tasks,
    taskLabels,
    taskAssignees,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskLabel,
    toggleTaskAssignee,
  } = useTasks();
  const { members, addMember, removeMember } = useTeamMembers();
  const { labels, createLabel, deleteLabel } = useLabels();

  async function executeAgentActions(actions: AgentAction[]) {
    for (const a of actions) {
      const i = a.input as Record<string, string>;
      try {
        if (a.name === "create_task") {
          await createTask({
            title: i.title,
            description: i.description,
            priority: i.priority as Task["priority"] | undefined,
            due_date: i.due_date ?? null,
            status: i.status as Status | undefined,
            assignee_id: i.assignee_id ?? null,
          });
        } else if (a.name === "update_task") {
          const updates: Partial<Task> = {};
          if (i.status) updates.status = i.status as Status;
          if (i.priority) updates.priority = i.priority as Task["priority"];
          if (i.due_date) updates.due_date = i.due_date;
          await updateTask(i.task_id, updates);
        } else if (a.name === "assign_task") {
          await updateTask(i.task_id, { assignee_id: i.assignee_id });
        } else if (a.name === "add_label") {
          const has = (taskLabels[i.task_id] ?? []).includes(i.label_id);
          if (!has) await toggleTaskLabel(i.task_id, i.label_id);
        }
      } catch (err) {
        console.error("Failed to apply agent action:", a.name, err);
      }
    }
  }

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<"edit" | "comments" | "activity">("edit");
  const [pendingMove, setPendingMove] = useState<{ task: Task; newStatus: Status } | null>(null);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    priority: "all",
    assignee: "all",
    label: "all",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  // Apply filters
  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (
        filters.search &&
        !t.title.toLowerCase().includes(filters.search.toLowerCase())
      )
        return false;
      if (filters.priority !== "all" && t.priority !== filters.priority)
        return false;
      if (filters.assignee !== "all" && t.assignee_id !== filters.assignee)
        return false;
      if (
        filters.label !== "all" &&
        !(taskLabels[t.id] ?? []).includes(filters.label)
      )
        return false;
      return true;
    });
  }, [tasks, filters, taskLabels]);

  const PRIORITY_ORDER: Record<Task["priority"], number> = {
    high: 0,
    normal: 1,
    low: 2,
  };

  const grouped = useMemo(() => {
    const g: Record<Status, Task[]> = {
      todo: [],
      in_progress: [],
      in_review: [],
      done: [],
    };
    for (const t of filtered) g[t.status].push(t);
    for (const col of Object.values(g)) {
      col.sort((a, b) => {
        const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        if (p !== 0) return p;
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return a.due_date.localeCompare(b.due_date);
      });
    }
    return g;
  }, [filtered]);

  const stats = useMemo(() => {
    const overdue = tasks.filter(
      (t) => t.status !== "done" && getDueMeta(t.due_date)?.tone === "overdue",
    ).length;
    const done = tasks.filter((t) => t.status === "done").length;
    return { total: tasks.length, done, overdue };
  }, [tasks]);

  function handleDragStart(event: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === event.active.id) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    const newStatus = over.id as Status;
    if (task && task.status !== newStatus) {
      setPendingMove({ task, newStatus });
    }
  }

  async function confirmMove() {
    if (!pendingMove) return;
    const { task, newStatus } = pendingMove;
    setPendingMove(null);
    await updateTask(task.id, { status: newStatus });
    logActivity(
      task.id,
      `Moved from ${STATUS_LABELS[task.status]} → ${STATUS_LABELS[newStatus]}`,
    );
  }

  function openTask(task: Task, tab: "edit" | "comments" | "activity" = "edit") {
    setSelectedTask(task);
    setDetailTab(tab);
    setDetailOpen(true);
  }

  // Keep the open detail panel in sync with fresh task data
  const liveSelected = selectedTask
    ? (tasks.find((t) => t.id === selectedTask.id) ?? null)
    : null;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center gap-4 border-b border-border px-6 py-3">
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-foreground leading-tight tracking-tight">Next Play</h1>
          <p className="text-xs text-muted-foreground leading-tight">Task Board</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{stats.total} tasks</span>
          <span>{stats.done} done</span>
          {stats.overdue > 0 && (
            <span className="font-medium text-red-600">
              {stats.overdue} overdue
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <AgentPanel
            tasks={tasks}
            members={members}
            labels={labels}
            onExecute={executeAgentActions}
          />
          <ManageTeamDialog
            members={members}
            addMember={addMember}
            removeMember={removeMember}
          />
          <ManageLabelsDialog
            labels={labels}
            createLabel={createLabel}
            deleteLabel={deleteLabel}
          />
          <CreateTaskDialog
            onCreate={createTask}
            onToggleLabel={toggleTaskLabel}
            members={members}
            labels={labels}
          />
        </div>
      </header>

      <FilterBar
        filters={filters}
        setFilters={setFilters}
        members={members}
        labels={labels}
      />

      {loading ? (
        <BoardSkeleton />
      ) : error ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-sm font-medium text-red-600">
              Couldn't load your board
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-4 flex-1 min-h-0 gap-4 overflow-x-auto p-6">
            {COLUMNS.map((col) => (
              <Column
                key={col.id}
                title={col.title}
                color={col.color}
                status={col.id}
                tasks={grouped[col.id]}
                members={members}
                labels={labels}
                taskLabels={taskLabels}
                taskAssignees={taskAssignees}
                onTaskClick={(task) => openTask(task)}
                onTaskEdit={(task) => openTask(task, "edit")}
                onTaskComments={(task) => openTask(task, "comments")}
                onTaskActivity={(task) => openTask(task, "activity")}
                onTaskDelete={(task) => deleteTask(task.id)}
              />
            ))}
          </div>

          <DragOverlay>
            {activeTask ? (
              <TaskCard
                task={activeTask}
                isOverlay
                assignees={members.filter((m) =>
                  (taskAssignees[activeTask.id] ?? []).includes(m.id),
                )}
                labels={labels.filter((l) =>
                  (taskLabels[activeTask.id] ?? []).includes(l.id),
                )}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <TaskDetailPanel
        task={liveSelected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        defaultTab={detailTab}
        members={members}
        labels={labels}
        taskLabels={taskLabels}
        taskAssignees={taskAssignees}
        updateTask={updateTask}
        toggleTaskLabel={toggleTaskLabel}
        toggleTaskAssignee={toggleTaskAssignee}
      />

      <Dialog open={!!pendingMove} onOpenChange={(o) => !o && setPendingMove(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Move task?</DialogTitle>
          </DialogHeader>
          {pendingMove && (
            <p className="text-sm text-muted-foreground">
              Move "{pendingMove.task.title}" from{" "}
              <span className="font-medium text-foreground">
                {STATUS_LABELS[pendingMove.task.status]}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {STATUS_LABELS[pendingMove.newStatus]}
              </span>
              ?
            </p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPendingMove(null)}>
              Cancel
            </Button>
            <Button onClick={confirmMove}>Move</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
