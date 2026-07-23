import { supabase } from "./supabase";

export async function logActivity(taskId: string, description: string) {
  // Fire-and-forget: activity logging should never block the main action.
  const { error } = await supabase
    .from("activity_log")
    .insert({ task_id: taskId, description });
  if (error) console.error("Failed to log activity:", error.message);
}
