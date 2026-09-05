"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminTool {
  slug: string;
  name: string;
  category: string;
  component: string;
  synced: boolean;
  creditCost: number;
  enabled: boolean;
  featured: boolean;
  sortOrder: number;
  description: string;
  systemPrompt: string;
}

export function AdminToolsTable({ tools }: { tools: AdminTool[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminTool | null>(null);
  const [busy, setBusy] = useState(false);

  const unsynced = tools.filter((t) => !t.synced).length;

  async function save(payload: Record<string, unknown>, slug: string) {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/tools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, ...payload }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not save the tool.");
        return false;
      }

      toast.success("Tool updated");
      router.refresh();
      return true;
    } catch {
      toast.error("Could not save the tool.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;

    const form = new FormData(event.currentTarget);
    const ok = await save(
      {
        credit_cost: Number(form.get("credit_cost")),
        sort_order: Number(form.get("sort_order")),
        description: String(form.get("description") ?? ""),
        system_prompt: String(form.get("system_prompt") ?? ""),
      },
      editing.slug,
    );
    if (ok) setEditing(null);
  }

  return (
    <>
      {unsynced > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {unsynced} {unsynced === 1 ? "tool has" : "tools have"} no database
            row yet, so {unsynced === 1 ? "it is" : "they are"} running on the
            values shipped in <code>config/tools.ts</code> and cannot be edited
            here. Run <code>npm run db:sync-tools</code> to create the rows.
          </p>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead className="text-right">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.map((tool) => (
              <TableRow key={tool.slug}>
                <TableCell>
                  <p className="font-medium">{tool.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {tool.slug}
                  </p>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {tool.category}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {tool.component}
                </TableCell>
                <TableCell className="tabular-nums">{tool.creditCost}</TableCell>
                <TableCell className="tabular-nums text-muted-foreground">
                  {tool.sortOrder}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={tool.featured}
                    disabled={!tool.synced || busy}
                    onCheckedChange={(checked) =>
                      save({ featured: checked }, tool.slug)
                    }
                    aria-label={`Feature ${tool.name}`}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={tool.enabled}
                    disabled={!tool.synced || busy}
                    onCheckedChange={(checked) =>
                      save({ enabled: checked }, tool.slug)
                    }
                    aria-label={`Enable ${tool.name}`}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!tool.synced}
                    onClick={() => setEditing(tool)}
                  >
                    <Pencil />
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
            <DialogDescription>
              The system prompt is server-side only and is never sent to the
              browser on public pages.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="credit_cost">Credit cost</Label>
                  <Input
                    id="credit_cost"
                    name="credit_cost"
                    type="number"
                    min={0}
                    required
                    defaultValue={editing.creditCost}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort order</Label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    required
                    defaultValue={editing.sortOrder}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={2}
                  maxLength={400}
                  className="min-h-[64px]"
                  defaultValue={editing.description}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_prompt">System prompt</Label>
                <Textarea
                  id="system_prompt"
                  name="system_prompt"
                  rows={14}
                  className="min-h-[280px] font-mono text-[12.5px]"
                  defaultValue={editing.systemPrompt}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={busy}>
                  Save changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
