import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";
import type { Label } from "@/types";

export function useLabels() {
  const { user } = useAuth();
  const [labels, setLabels] = useState<Label[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLabels = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("labels")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) setError(error.message);
    else setLabels(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchLabels();
  }, [user, fetchLabels]);

  const createLabel = useCallback(async (name: string, color: string) => {
    const { data, error } = await supabase
      .from("labels")
      .insert({ name, color })
      .select()
      .single();
    if (error) {
      setError(error.message);
      throw error;
    }
    setLabels((prev) => [...prev, data]);
    return data;
  }, []);

  const deleteLabel = useCallback(async (id: string) => {
    let snapshot: Label[] = [];
    setLabels((prev) => {
      snapshot = prev;
      return prev.filter((l) => l.id !== id);
    });
    const { error } = await supabase.from("labels").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setLabels(snapshot);
      throw error;
    }
  }, []);

  return { labels, loading, error, fetchLabels, createLabel, deleteLabel };
}
