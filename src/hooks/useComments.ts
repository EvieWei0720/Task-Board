import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Comment } from "@/types";

export function useComments(taskId: string | null) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("task_id", taskId)
      .order("created_at", { ascending: true });
    setComments(data ?? []);
    setLoading(false);
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const addComment = useCallback(
    async (body: string) => {
      if (!taskId || !body.trim()) return;
      const { data, error } = await supabase
        .from("comments")
        .insert({ task_id: taskId, body: body.trim() })
        .select()
        .single();
      if (!error && data) setComments((prev) => [...prev, data]);
    },
    [taskId],
  );

  return { comments, loading, addComment };
}
