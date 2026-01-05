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
      statusFilter === "all"
        ? tasks
        : tasks.filter((t) => t.status === statusFilter);

    const byQuery = byStatus.filter((t) => matchTask(t, query));

    // Keep optimistic tasks near the top while still stable
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

    // Optimistic insert at top
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
    if (busyIds[id]) return; // prevent rapid clicks

    setBusyIds((m) => ({ ...m, [id]: true }));

    // Keep snapshot for rollback
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
        // Used for concurrency protection if backend supports it; safe if ignored.
        ifMatch: before.updatedAt ?? undefined,
      });

      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      toast.success("Task updated");
    } catch (err) {
      // Roll back and show guidance
      setTasks((prev) => prev.map((t) => (t.id === id ? before : t)));

      if (err instanceof ApiError && (err.status === 409 || err.status === 412)) {
        setRefreshHint(
          "This task was updated elsewhere. Refresh to sync before trying again."
        );
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

    // Optimistic remove
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

  const headerActions = (
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
        New Task
      </Button>
    </div>
  );

  const filterChips = (
    <ChipGroup<StatusFilter>
      label="Filter"
      value={statusFilter}
      onChange={setStatusFilter}
      options={[
        {
          value: "all",
          label: "All",
          count: tasks.length,
        },
        {
          value: "todo",
          label: "Todo",
          count: statusCounts.todo,
        },
        {
          value: "in_progress",
          label: "In progress",
          count: statusCounts.in_progress,
        },
        {
          value: "done",
          label: "Done",
          count: statusCounts.done,
        },
      ]}
    />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-[var(--tm-muted)]">
            Manage tasks with optimistic updates and clear error recovery.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3">
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

        {headerActions}
      </div>

      {!canUseApi ? (
        <div className="rounded-xl border border-black/10 bg-white p-4">
          <p className="text-sm">
            You’re not logged in.{" "}
            <button
              type="button"
              className="font-semibold text-[var(--tm-primary)] hover:underline focus:outline-none focus-visible:ring-4 focus-visible:ring-[var(--tm-ring)] rounded-md px-1"
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
          className="rounded-xl border border-[rgba(59,130,246,0.35)] bg-[rgba(59,130,246,0.08)] p-3 text-sm"
          role="status"
        >
          <p className="font-semibold text-[var(--tm-primary)]">Refresh recommended</p>
          <p className="mt-1 text-[var(--tm-text)]">{refreshHint}</p>
        </div>
      ) : null}

      {loadError ? (
        <div
          className="rounded-xl border border-[var(--tm-danger)] bg-[rgba(239,68,68,0.08)] p-4 text-sm"
          role="alert"
        >
          <p className="font-semibold text-[var(--tm-danger)]">Could not load tasks</p>
          <p className="mt-1 text-[var(--tm-text)]">{loadError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => void load()}
              disabled={loading}
              loading={loading}
            >
              Retry
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
              disabled={loading}
            >
              Reload page
            </Button>
          </div>
          <p className="mt-2 text-[var(--tm-muted)]">
            Note: If the backend API endpoints are not available yet, you may see 404
            errors until the backend implements /api/auth and /api/tasks.
          </p>
        </div>
      ) : null}

      <section className="space-y-2" aria-label="Tasks list">
        {loading && tasks.length === 0 ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="tm-surface tm-shadow-sm p-4"
                aria-hidden="true"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-[70%]" />
                    <div className="mt-2 space-y-2">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-[85%]" />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
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
                    setEditing(null);
                    setEditorOpen(true);
                  }}
                >
                  New Task
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
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((t) => {
              const busy = !!busyIds[t.id];
              const tone = statusTone(t.status);
              const pTone = priorityTone(t.priority);
              const updated = new Date(t.updatedAt ?? t.createdAt).toLocaleString();

              return (
                <article
                  key={t.id}
                  className={[
                    "tm-surface tm-shadow-sm p-4 transition",
                    "hover:shadow-md hover:-translate-y-[0.5px]",
                    t._optimistic ? "ring-2 ring-[rgba(59,130,246,0.18)]" : "",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
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
                          <h3 className="truncate text-sm font-semibold">
                            {t.title}{" "}
                            {t._optimistic ? (
                              <span className="ml-1 text-xs font-semibold text-[var(--tm-muted)]">
                                syncing…
                              </span>
                            ) : null}
                          </h3>

                          {t.description ? (
                            <p className="mt-1 line-clamp-2 text-sm text-[var(--tm-muted)]">
                              {t.description}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-[var(--tm-muted)]">
                              <span className="italic">No description</span>
                            </p>
                          )}

                          <p className="mt-2 text-xs text-[var(--tm-muted)]">
                            Updated {updated}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone={tone}>{statusLabel(t.status)}</Badge>
                        <Badge tone={pTone}>
                          {t.priority ? `priority: ${t.priority}` : "priority: —"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Button
                        variant="secondary"
                        disabled={busy || !canUseApi}
                        onClick={() => void onUpdate(t.id, { status: nextStatus(t.status) })}
                        loading={busy && t._optimistic}
                        className="whitespace-nowrap"
                        aria-label={`Toggle status for ${t.title}`}
                        title="Toggle status (todo → in progress → done)"
                      >
                        Toggle
                      </Button>

                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => {
                            setEditing(t);
                            setEditorOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          disabled={busy}
                          onClick={() => setDeleteTarget(t)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
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
