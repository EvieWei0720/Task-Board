import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Activity } from "@/types";

export function useActivity(taskId: string | null) {
  const [activity, setActivity] = useState<Activity[]>([]);

  const fetchActivity = useCallback(async () => {
    if (!taskId) return;
    const { data } = await supabase
      .from("activity_log")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    setActivity(data ?? []);
  }, [taskId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { activity, refetch: fetchActivity };
}
