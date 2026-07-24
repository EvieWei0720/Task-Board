import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";
import { logActivity } from "@/lib/activity";
import type { Task, Status, Priority } from "@/types";

export interface NewTask {
  title: string;
  description?: string;
  priority?: Priority;
  due_date?: string | null;
  status?: Status;
  assignee_ids?: string[];
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLabels, setTaskLabels] = useState<Record<string, string[]>>({});
  const [taskAssignees, setTaskAssignees] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [tasksRes, labelsRes, assigneesRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("task_labels").select("task_id, label_id"),
      supabase.from("task_assignees").select("task_id, member_id"),
    ]);

    if (tasksRes.error) {
      setError(tasksRes.error.message);
    } else {
      setTasks(tasksRes.data ?? []);
    }

    if (!labelsRes.error && labelsRes.data) {
      const map: Record<string, string[]> = {};
      for (const row of labelsRes.data) {
        (map[row.task_id] ??= []).push(row.label_id);
      }
      setTaskLabels(map);
    }

    if (!assigneesRes.error && assigneesRes.data) {
      const map: Record<string, string[]> = {};
      for (const row of assigneesRes.data) {
        (map[row.task_id] ??= []).push(row.member_id);
      }
      setTaskAssignees(map);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user, fetchTasks]);

  const createTask = useCallback(async (input: NewTask) => {
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? "normal",
        due_date: input.due_date ?? null,
        status: input.status ?? "todo",
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      throw error;
    }
    setTasks((prev) => [...prev, data]);

    if (input.assignee_ids?.length) {
      const rows = input.assignee_ids.map((member_id) => ({
        task_id: data.id,
        member_id,
      }));
      await supabase.from("task_assignees").insert(rows);
      setTaskAssignees((prev) => ({ ...prev, [data.id]: input.assignee_ids! }));
    }

    logActivity(data.id, "Created task");
    return data;
  }, []);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    let snapshot: Task[] = [];
    setTasks((prev) => {
      snapshot = prev;
      return prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
    });
    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    if (error) {
      setError(error.message);
      setTasks(snapshot);
      throw error;
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    let snapshot: Task[] = [];
    setTasks((prev) => {
      snapshot = prev;
      return prev.filter((t) => t.id !== id);
    });
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setTasks(snapshot);
      throw error;
    }
  }, []);

  const toggleTaskLabel = useCallback(
    async (taskId: string, labelId: string) => {
      const current = taskLabels[taskId] ?? [];
      const hasLabel = current.includes(labelId);

      setTaskLabels((prev) => {
        const next = { ...prev };
        next[taskId] = hasLabel
          ? current.filter((id) => id !== labelId)
          : [...current, labelId];
        return next;
      });

      if (hasLabel) {
        await supabase
          .from("task_labels")
          .delete()
          .eq("task_id", taskId)
          .eq("label_id", labelId);
      } else {
        await supabase
          .from("task_labels")
          .insert({ task_id: taskId, label_id: labelId });
      }
    },
    [taskLabels],
  );

  const toggleTaskAssignee = useCallback(
    async (taskId: string, memberId: string) => {
      const hasAssignee = (taskAssignees[taskId] ?? []).includes(memberId);

      setTaskAssignees((prev) => {
        const cur = prev[taskId] ?? [];
        return {
          ...prev,
          [taskId]: cur.includes(memberId)
            ? cur.filter((id) => id !== memberId)
            : [...cur, memberId],
        };
      });

      if (hasAssignee) {
        await supabase
          .from("task_assignees")
          .delete()
          .eq("task_id", taskId)
          .eq("member_id", memberId);
      } else {
        await supabase
          .from("task_assignees")
          .insert({ task_id: taskId, member_id: memberId });
      }
    },
    [taskAssignees],
  );

  return {
    tasks,
    taskLabels,
    taskAssignees,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskLabel,
    toggleTaskAssignee,
  };
}
