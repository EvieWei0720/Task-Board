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
  assignee_id?: string | null;
}

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskLabels, setTaskLabels] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [tasksRes, linksRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .order("position", { ascending: true })
        .order("created_at", { ascending: true }),
      supabase.from("task_labels").select("task_id, label_id"),
    ]);

    if (tasksRes.error) {
      setError(tasksRes.error.message);
    } else {
      setTasks(tasksRes.data ?? []);
    }

    if (!linksRes.error && linksRes.data) {
      const map: Record<string, string[]> = {};
      for (const row of linksRes.data) {
        (map[row.task_id] ??= []).push(row.label_id);
      }
      setTaskLabels(map);
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
        assignee_id: input.assignee_id ?? null,
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
      throw error;
    }
    setTasks((prev) => [...prev, data]);
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

      // Optimistic
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

  return {
    tasks,
    taskLabels,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskLabel,
  };
}
