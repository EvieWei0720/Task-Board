import { useState } from "react";
import { Users, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TeamMember } from "@/types";

const COLORS = [
  "#5b5bd6",
  "#e5484d",
  "#f5a623",
  "#34c759",
  "#0091ff",
  "#8e4ec6",
];

function colorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export function ManageTeamDialog({
  members,
  addMember,
  removeMember,
}: {
  members: TeamMember[];
  addMember: (name: string, color: string) => Promise<unknown>;
  removeMember: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");

  async function handleAdd() {
    if (!name.trim()) return;
    await addMember(name.trim(), colorFromName(name.trim()));
    setName("");
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Users className="h-4 w-4" />
        Team
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Team members</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Member name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button size="sm" onClick={handleAdd} disabled={!name.trim()}>
            Add
          </Button>
        </div>

        <div className="mt-2 space-y-1.5">
          {members.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No team members yet
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
              >
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: m.avatar_color }}
                >
                  {m.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-sm">{m.name}</span>
                <button
                  onClick={() => removeMember(m.id)}
                  className="ml-auto text-muted-foreground hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
