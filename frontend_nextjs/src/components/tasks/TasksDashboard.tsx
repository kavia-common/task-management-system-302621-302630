"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TaskModal } from "@/components/tasks/TaskModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";
import { tasksApi } from "@/lib/api/tasks";
import { ApiError, normalizeApiErrorMessage } from "@/lib/api/errors";
import { useToast } from "@/components/toast/ToastProvider";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { ChipGroup } from "@/components/ui/ChipGroup";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";

function tempId() {
  return `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

type StatusFilter = "all" | TaskStatus;

function statusLabel(s: TaskStatus) {
  if (s === "in_progress") return "in progress";
  return s;
}

function statusTone(s: TaskStatus) {
  if (s === "done") return "success";
  if (s === "in_progress") return "primary";
  return "muted";
}

function priorityTone(p: TaskPriority | null) {
  if (p === "high") return "danger";
  if (p === "medium") return "primary";
  if (p === "low") return "muted";
  return "neutral";
}

function nextStatus(current: TaskStatus): TaskStatus {
  if (current === "todo") return "in_progress";
  if (current === "in_progress") return "done";
  return "todo";
}

function matchTask(t: Task, q: string) {
  if (!q.trim()) return true;
  const s = q.trim().toLowerCase();
  return (
    t.title.toLowerCase().includes(s) ||
    (t.description ?? "").toLowerCase().includes(s) ||
    t.status.toLowerCase().includes(s) ||
    (t.priority ?? "").toLowerCase().includes(s)
  );
}

export function TasksDashboard({ onRequireAuth }: { onRequireAuth: () => void }) {
  const toast = useToast();
  const { session } = useAuth();

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [refreshHint, setRefreshHint] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  // UI state
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const canUseApi = !!session?.accessToken;

  const statusCounts = useMemo(() => {
    const counts: Record<TaskStatus, number> = {
      todo: 0,
      in_progress: 0,
      done: 0,
    };
    for (const t of tasks) counts[t.status] = (counts[t.status] ?? 0) + 1;
    return counts;
  }, [tasks]);

  const filtered = useMemo(() => {
    const byStatus =
      statusFilter === "all" ? tasks : tasks.filter((t) => t.status === statusFilter);

    const byQuery = byStatus.filter((t) => matchTask(t, query));

    // Keep optimistic tasks near the top while still stable.
    return [...byQuery].sort((a, b) => {
      const ao = a._optimistic ? 1 : 0;
      const bo = b._optimistic ? 1 : 0;
      if (ao !== bo) return bo - ao;
      const at = new Date(a.updatedAt ?? a.createdAt).getTime();
      const bt = new Date(b.updatedAt ?? b.createdAt).getTime();
      return bt - at;
    });
  }, [query, statusFilter, tasks]);

  async function load() {
    if (!canUseApi) return;
    setLoading(true);
    setLoadError(null);
    setRefreshHint(null);
    try {
      const list = await tasksApi.list({ accessToken: session!.accessToken });
      setTasks(list);
    } catch (err) {
      setLoadError(normalizeApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!canUseApi) {
      setTasks([]);
      setLoadError(null);
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canUseApi, session?.accessToken]);

  async function onCreate(initial: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority?: TaskPriority;
  }) {
    if (!session?.accessToken) {
      onRequireAuth();
      return;
    }

    const optimistic: Task = {
      id: tempId(),
      title: initial.title,
      description: initial.description ?? null,
      status: initial.status,
      priority: initial.priority ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _optimistic: true,
    };

    setTasks((prev) => [optimistic, ...prev]);

    try {
      const created = await tasksApi.create({
        accessToken: session.accessToken,
        task: initial,
      });
      setTasks((prev) => prev.map((t) => (t.id === optimistic.id ? created : t)));
      toast.success("Task created");
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t.id !== optimistic.id));
      toast.error("Create failed", "Please retry. If it persists, refresh.");
      throw err;
    }
  }

  async function onUpdate(id: string, patch: Partial<Omit<Task, "id">>) {
    if (!session?.accessToken) {
      onRequireAuth();
      return;
    }
    if (busyIds[id]) return;

    setBusyIds((m) => ({ ...m, [id]: true }));

    const before = tasks.find((t) => t.id === id);
    if (!before) {
      setBusyIds((m) => ({ ...m, [id]: false }));
      return;
    }

    const optimisticNext: Task = {
      ...before,
      ...patch,
      updatedAt: new Date().toISOString(),
      _optimistic: true,
    };

    setTasks((prev) => prev.map((t) => (t.id === id ? optimisticNext : t)));

    try {
      const updated = await tasksApi.update({
        accessToken: session.accessToken,
        id,
        task: patch,
        ifMatch: before.updatedAt ?? undefined,
      });

      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success("Task updated");
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === id ? before : t)));

      if (err instanceof ApiError && (err.status === 409 || err.status === 412)) {
        setRefreshHint("This task was updated elsewhere. Refresh to sync before trying again.");
        toast.error("Concurrent update detected", "Please refresh and retry.");
      } else {
        toast.error("Update failed", "Please retry. If it persists, refresh.");
      }
      throw err;
    } finally {
      setBusyIds((m) => ({ ...m, [id]: false }));
    }
  }

  async function onDelete(id: string) {
    if (!session?.accessToken) {
      onRequireAuth();
      return;
    }
    if (busyIds[id]) return;

    setBusyIds((m) => ({ ...m, [id]: true }));

    const before = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await tasksApi.remove({ accessToken: session.accessToken, id });
      toast.info("Task deleted");
    } catch (err) {
      setTasks(before);
      toast.error("Delete failed", "Please retry. If it persists, refresh.");
      throw err;
    } finally {
      setBusyIds((m) => ({ ...m, [id]: false }));
    }
  }

  const filterChips = (
    <ChipGroup<StatusFilter>
      label="Status"
      value={statusFilter}
      onChange={setStatusFilter}
      options={[
        { value: "all", label: "All", count: tasks.length },
        { value: "todo", label: "Todo", count: statusCounts.todo },
        { value: "in_progress", label: "In progress", count: statusCounts.in_progress },
        { value: "done", label: "Done", count: statusCounts.done },
      ]}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {filterChips}
            <div className="w-full sm:w-[320px]">
              <Input
                label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, description, status, priority…"
                disabled={!canUseApi}
                hint={canUseApi ? `${filtered.length} shown` : "Login to search"}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => void load()}
            disabled={!canUseApi || loading}
            loading={loading}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            onClick={() => {
              if (!canUseApi) {
                onRequireAuth();
                return;
              }
              setEditing(null);
              setEditorOpen(true);
            }}
            disabled={loading}
          >
            Add Task
          </Button>
        </div>
      </div>

      {!canUseApi ? (
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm">
            You’re not logged in.{" "}
            <button
              type="button"
              className="rounded-md px-1 font-semibold text-[var(--tm-primary)] hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)]"
              onClick={onRequireAuth}
            >
              Login
            </button>{" "}
            to view and manage your tasks.
          </p>
          <p className="mt-2 text-sm text-[var(--tm-muted)]">
            Session is stored client-side and resumes after reload/redeploy.
          </p>
        </div>
      ) : null}

      {refreshHint ? (
        <div
          className="rounded-xl border border-[rgba(59,130,246,0.25)] bg-[rgba(59,130,246,0.06)] p-3 text-sm"
          role="status"
        >
          <p className="font-semibold text-[var(--tm-primary)]">Refresh recommended</p>
          <p className="mt-1 text-[var(--tm-text)]">{refreshHint}</p>
        </div>
      ) : null}

      {loadError ? (
        <div
          className="rounded-xl border border-[var(--tm-danger)] bg-[rgba(239,68,68,0.06)] p-4 text-sm"
          role="alert"
        >
          <p className="font-semibold text-[var(--tm-danger)]">Could not load tasks</p>
          <p className="mt-1 text-[var(--tm-text)]">{loadError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="primary" onClick={() => void load()} disabled={loading} loading={loading}>
              Retry
            </Button>
            <Button variant="secondary" onClick={() => window.location.reload()} disabled={loading}>
              Reload page
            </Button>
          </div>
        </div>
      ) : null}

      <section className="space-y-2" aria-label="Tasks list">
        {loading && tasks.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="rounded-xl border border-black/10 bg-white p-3" aria-hidden="true">
                <Skeleton className="h-4 w-[60%]" />
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-[80%]" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {filtered.length === 0 && !loading && !loadError ? (
          <div className="rounded-xl border border-black/10 bg-white p-5 text-sm">
            <p className="font-semibold">No tasks found</p>
            <p className="mt-1 text-[var(--tm-muted)]">
              {tasks.length === 0
                ? "Create your first task to get started."
                : "Try clearing filters or adjusting your search."}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tasks.length === 0 ? (
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!canUseApi) {
                      onRequireAuth();
                      return;
                    }
                    setEditing(null);
                    setEditorOpen(true);
                  }}
                >
                  Add Task
                </Button>
              ) : (
                <>
                  <Button variant="secondary" onClick={() => setStatusFilter("all")}>
                    Clear filter
                  </Button>
                  <Button variant="secondary" onClick={() => setQuery("")}>
                    Clear search
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}

        {filtered.length > 0 ? (
          <>
            {/* Desktop/table view */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-black/10 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-black/[0.02] text-xs font-semibold uppercase tracking-wide text-[var(--tm-muted)]">
                  <tr>
                    <th className="px-4 py-3">Task</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => {
                    const busy = !!busyIds[t.id];
                    const updated = new Date(t.updatedAt ?? t.createdAt).toLocaleString();
                    return (
                      <tr key={t.id} className="border-t border-black/10 align-top">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <span
                              className={[
                                "mt-1 inline-block h-2.5 w-2.5 rounded-full",
                                t.status === "done"
                                  ? "bg-[var(--tm-accent)]"
                                  : t.status === "in_progress"
                                  ? "bg-[var(--tm-primary)]"
                                  : "bg-black/30",
                              ].join(" ")}
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--tm-text)]">
                                {t.title}
                                {t._optimistic ? (
                                  <span className="ml-2 text-xs font-semibold text-[var(--tm-muted)]">
                                    syncing…
                                  </span>
                                ) : null}
                              </p>
                              <p className="mt-1 line-clamp-1 text-xs text-[var(--tm-muted)]">
                                {t.description ? t.description : "—"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={statusTone(t.status)}>{statusLabel(t.status)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={priorityTone(t.priority)}>
                            {t.priority ? t.priority : "—"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--tm-muted)]">{updated}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              variant="secondary"
                              disabled={busy || !canUseApi}
                              onClick={() => void onUpdate(t.id, { status: nextStatus(t.status) })}
                              className="px-2 py-1 text-xs"
                              aria-label={`Toggle status for ${t.title}`}
                              title="Toggle status (todo → in progress → done)"
                            >
                              Toggle
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={busy}
                              onClick={() => {
                                setEditing(t);
                                setEditorOpen(true);
                              }}
                              className="px-2 py-1 text-xs"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              disabled={busy}
                              onClick={() => setDeleteTarget(t)}
                              className="px-2 py-1 text-xs"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile/card view */}
            <div className="space-y-2 md:hidden">
              {filtered.map((t) => {
                const busy = !!busyIds[t.id];
                const updated = new Date(t.updatedAt ?? t.createdAt).toLocaleString();
                return (
                  <article key={t.id} className="rounded-xl border border-black/10 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {t.title}
                          {t._optimistic ? (
                            <span className="ml-2 text-xs font-semibold text-[var(--tm-muted)]">
                              syncing…
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-1 text-sm text-[var(--tm-muted)]">
                          {t.description ? t.description : <span className="italic">No description</span>}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Badge tone={statusTone(t.status)}>{statusLabel(t.status)}</Badge>
                          <Badge tone={priorityTone(t.priority)}>
                            {t.priority ? `priority: ${t.priority}` : "priority: —"}
                          </Badge>
                        </div>

                        <p className="mt-2 text-xs text-[var(--tm-muted)]">Updated {updated}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        disabled={busy || !canUseApi}
                        onClick={() => void onUpdate(t.id, { status: nextStatus(t.status) })}
                        className="flex-1"
                      >
                        Toggle
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={busy}
                        onClick={() => {
                          setEditing(t);
                          setEditorOpen(true);
                        }}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() => setDeleteTarget(t)}
                        className="flex-1"
                      >
                        Delete
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : null}
      </section>

      <TaskModal
        open={editorOpen}
        mode={editing ? "edit" : "create"}
        task={editing}
        onClose={() => {
          setEditorOpen(false);
          setEditing(null);
        }}
        onCreate={onCreate}
        onUpdate={async (id, patch) => {
          await onUpdate(id, patch);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete task?"
        description="This action cannot be undone. The task will be removed immediately."
        confirmText="Delete"
        confirmVariant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          const t = deleteTarget;
          if (!t) return;
          setDeleteTarget(null);
          try {
            await onDelete(t.id);
          } catch {
            // Errors are already surfaced via toast.
          }
        }}
      />
    </div>
  );
}
