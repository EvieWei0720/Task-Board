export type Status = "todo" | "in_progress" | "in_review" | "done";
export type Priority = "low" | "normal" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: Status;
  priority: Priority;
  due_date: string | null;
  user_id: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar_color: string;
  user_id: string;
  created_at: string;
}

export interface Label {
  id: string;
  name: string;
  color: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  body: string;
  user_id: string;
  created_at: string;
}

export interface Activity {
  id: string;
  task_id: string;
  description: string;
  user_id: string;
  created_at: string;
}
