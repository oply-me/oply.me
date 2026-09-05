"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

interface Announcement {
  id: string;
  title: string;
  message: string;
  link_url: string | null;
  link_label: string | null;
  enabled: boolean;
  starts_at: string;
  ends_at: string | null;
}

export function AnnouncementManager({
  announcements,
}: {
  announcements: Announcement[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(form.get("title") ?? ""),
          message: String(form.get("message") ?? ""),
          link_url: String(form.get("link_url") ?? "") || null,
          link_label: String(form.get("link_label") ?? "") || null,
          ends_at: String(form.get("ends_at") ?? "") || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not create the announcement.");
        return;
      }

      toast.success("Announcement created");
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not create the announcement.");
    } finally {
      setBusy(false);
    }
  }

  async function update(id: string, payload: Record<string, unknown>) {
    try {
      const response = await fetch("/api/admin/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      toast.error("Could not update the announcement.");
    }
  }

  async function remove(id: string) {
    try {
      const response = await fetch(`/api/admin/announcements?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      toast.success("Announcement deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete the announcement.");
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus />
        New announcement
      </Button>

      {announcements.length > 0 && (
        <ul className="mt-5 space-y-3">
          {announcements.map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 rounded-lg border border-border p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13.5px] font-medium">{item.title}</p>
                  <Badge variant={item.enabled ? "success" : "outline"}>
                    {item.enabled ? "Active" : "Off"}
                  </Badge>
                </div>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {item.message}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  From {formatDate(item.starts_at)}
                  {item.ends_at ? ` until ${formatDate(item.ends_at)}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Switch
                  checked={item.enabled}
                  onCheckedChange={(checked) => update(item.id, { enabled: checked })}
                  aria-label={`Toggle ${item.title}`}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(item.id)}
                  aria-label={`Delete ${item.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New announcement</DialogTitle>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="a-title">Title</Label>
              <Input
                id="a-title"
                name="title"
                required
                maxLength={120}
                placeholder="New tool launched"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-message">Message</Label>
              <Textarea
                id="a-message"
                name="message"
                required
                rows={3}
                maxLength={400}
                className="min-h-[80px]"
                placeholder="The AI Email Writer is now live for every account."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="a-link">Link URL</Label>
                <Input id="a-link" name="link_url" placeholder="/tools/ai-writer" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="a-link-label">Link label</Label>
                <Input id="a-link-label" name="link_label" placeholder="Try it" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="a-ends">Ends at (optional)</Label>
              <Input id="a-ends" name="ends_at" type="date" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
