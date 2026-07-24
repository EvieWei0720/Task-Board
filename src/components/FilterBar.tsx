import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { TeamMember, Label } from "@/types";

export interface Filters {
  search: string;
  priority: string;
  assignee: string;
  label: string;
}

export function FilterBar({
  filters,
  setFilters,
  members,
  labels,
}: {
  filters: Filters;
  setFilters: (f: Filters) => void;
  members: TeamMember[];
  labels: Label[];
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-6 py-2.5">
      <div className="relative w-64">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tasks…"
          className="pl-8"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
      </div>

      <Select
        value={filters.priority}
        onValueChange={(v) =>
          setFilters({ ...filters, priority: v ?? "all" })
        }
      >
        <SelectTrigger className="w-32">
          <span className="flex flex-1 text-left text-sm">
            {{
              all: "All Priority",
              high: "High",
              normal: "Normal",
              low: "Low",
            }[filters.priority] ?? "All Priority"}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="high">High</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="low">Low</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.assignee}
        onValueChange={(v) =>
          setFilters({ ...filters, assignee: v ?? "all" })
        }
      >
        <SelectTrigger className="w-36">
          <span className="flex flex-1 text-left text-sm">
            {filters.assignee === "all"
              ? "All Assignee"
              : (members.find((m) => m.id === filters.assignee)?.name ??
                "All Assignee")}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.label}
        onValueChange={(v) => setFilters({ ...filters, label: v ?? "all" })}
      >
        <SelectTrigger className="w-32">
          <span className="flex flex-1 text-left text-sm">
            {filters.label === "all"
              ? "All Label"
              : (labels.find((l) => l.id === filters.label)?.name ??
                "All Label")}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All</SelectItem>
          {labels.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
