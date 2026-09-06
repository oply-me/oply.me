"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { Reveal } from "@/components/reveal";
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
import { Textarea } from "@/components/ui/textarea";
import { formatDate, formatNumber, timeAgo } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  itemCount: number;
  /** Sum of `credits_used` across every generation filed under the project. */
  creditsUsed: number;
  /** Distinct tools represented in the project. */
  toolCount: number;
  /** When something was last filed here. Null for an empty project. */
  lastActivity: string | null;
}

export function ProjectsManager({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [list, setList] = useState(projects);
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          description: String(form.get("description") ?? ""),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error ?? "Could not create the project.");
        return;
      }

      setList((prev) => [
        {
          ...data.project,
          itemCount: 0,
          creditsUsed: 0,
          toolCount: 0,
          lastActivity: null,
        },
        ...prev,
      ]);
      setCreateOpen(false);
      toast.success("Project created");
      router.refresh();
    } catch {
      toast.error("Could not create the project.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/projects/${pendingDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error();
      setList((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      toast.success("Project deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete the project.");
    } finally {
      setBusy(false);
      setPendingDelete(null);
    }
  }

  return (
    <>
      <div className="mb-5 flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus />
          New project
        </Button>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Create your first project."
          description="Projects are a light way to keep work for one client, site or store together."
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((project, i) => (
            <Reveal
              as="li"
              key={project.id}
              delay={Math.min(i, 8) * 0.05}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold">
                    {project.name}
                  </h2>
                  {project.description && (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {project.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPendingDelete(project)}
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-3.5">
                <ProjectStat
                  label={project.itemCount === 1 ? "Item" : "Items"}
                  value={formatNumber(project.itemCount)}
                />
                <ProjectStat
                  label="Credits"
                  value={formatNumber(project.creditsUsed)}
                />
                <ProjectStat
                  label={project.toolCount === 1 ? "Tool" : "Tools"}
                  value={formatNumber(project.toolCount)}
                />
              </dl>
              <p className="mt-3 text-[11px] text-muted-foreground">
                Created {formatDate(project.created_at)}
                {project.lastActivity
                  ? ` · last addition ${timeAgo(project.lastActivity)}`
                  : ""}
              </p>
            </Reveal>
          ))}
        </ul>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New project</DialogTitle>
            <DialogDescription>
              Give it a name you&apos;ll recognise later — a client, a site, a
              store.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Name</Label>
              <Input
                id="project-name"
                name="name"
                required
                maxLength={120}
                placeholder="My Shopify Store"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project-description">Description (optional)</Label>
              <Textarea
                id="project-description"
                name="description"
                rows={3}
                maxLength={500}
                className="min-h-[80px]"
                placeholder="Product copy and SEO for the spring range."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" loading={busy}>
                Create project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {pendingDelete?.name}?</DialogTitle>
            <DialogDescription>
              The project is removed. Generations filed under it stay in your
              history and favorites.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" loading={busy} onClick={confirmDelete}>
              Delete project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ProjectStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
