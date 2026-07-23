import { useState } from "react";
import { Tag, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Label } from "@/types";

const LABEL_COLORS = [
  "#e5484d",
  "#f5a623",
  "#34c759",
  "#0091ff",
  "#8e4ec6",
  "#5b5bd6",
];

export function ManageLabelsDialog({
  labels,
  createLabel,
  deleteLabel,
}: {
  labels: Label[];
  createLabel: (name: string, color: string) => Promise<unknown>;
  deleteLabel: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(LABEL_COLORS[0]);

  async function handleCreate() {
    if (!name.trim()) return;
    await createLabel(name.trim(), color);
    setName("");
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" className="gap-1.5" />}>
        <Tag className="h-4 w-4" />
        Labels
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Labels</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Label name (e.g. Bug)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <div className="flex gap-1">
            {LABEL_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="h-6 w-6 rounded-full"
                style={{
                  backgroundColor: c,
                  boxShadow: color === c ? `0 0 0 2px ${c}` : "none",
                }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
          <Button size="sm" onClick={handleCreate} disabled={!name.trim()}>
            Add
          </Button>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          {labels.map((l) => (
            <span
              key={l.id}
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-white"
              style={{ backgroundColor: l.color }}
            >
              {l.name}
              <button onClick={() => deleteLabel(l.id)}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
