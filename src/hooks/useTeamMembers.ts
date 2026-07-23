import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthProvider";
import type { TeamMember } from "@/types";

export function useTeamMembers() {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) setError(error.message);
    else setMembers(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchMembers();
  }, [user, fetchMembers]);

  const addMember = useCallback(async (name: string, avatarColor: string) => {
    const { data, error } = await supabase
      .from("team_members")
      .insert({ name, avatar_color: avatarColor })
      .select()
      .single();
    if (error) {
      setError(error.message);
      throw error;
    }
    setMembers((prev) => [...prev, data]);
    return data;
  }, []);

  const removeMember = useCallback(async (id: string) => {
    let snapshot: TeamMember[] = [];
    setMembers((prev) => {
      snapshot = prev;
      return prev.filter((m) => m.id !== id);
    });
    const { error } = await supabase.from("team_members").delete().eq("id", id);
    if (error) {
      setError(error.message);
      setMembers(snapshot);
      throw error;
    }
  }, []);

  return { members, loading, error, fetchMembers, addMember, removeMember };
}
