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

function tempId() {
  return `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
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
      setTasks((prev) =>
        prev.map((t) => (t.id === optimistic.id ? created : t))
      );
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--tm-muted)]">
            Manage tasks with optimistic updates and clear error recovery.
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            <span className="rounded-xl bg-black/5 px-3 py-1">
              Todo: <span className="font-semibold">{statusCounts.todo}</span>
            </span>
            <span className="rounded-xl bg-black/5 px-3 py-1">
              In progress:{" "}
              <span className="font-semibold">{statusCounts.in_progress}</span>
            </span>
            <span className="rounded-xl bg-black/5 px-3 py-1">
              Done: <span className="font-semibold">{statusCounts.done}</span>
            </span>
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
              className="font-semibold text-[var(--tm-primary)] hover:underline"
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
          <p className="font-semibold text-[var(--tm-primary)]">
            Refresh recommended
          </p>
          <p className="mt-1 text-[var(--tm-text)]">{refreshHint}</p>
        </div>
      ) : null}

      {loadError ? (
        <div
          className="rounded-xl border border-[var(--tm-danger)] bg-[rgba(239,68,68,0.08)] p-4 text-sm"
          role="alert"
        >
          <p className="font-semibold text-[var(--tm-danger)]">
            Could not load tasks
          </p>
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
            Note: If the backend API endpoints are not available yet, you may see
            404 errors until the backend implements /api/auth and /api/tasks.
          </p>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-black/10">
        <div className="grid grid-cols-12 gap-0 bg-black/[0.03] px-3 py-2 text-xs font-semibold text-[var(--tm-muted)]">
          <div className="col-span-5">Title</div>
          <div className="col-span-3 hidden sm:block">Status</div>
          <div className="col-span-2 hidden md:block">Priority</div>
          <div className="col-span-7 sm:col-span-4 md:col-span-2 text-right">
            Actions
          </div>
        </div>

        {loading && tasks.length === 0 ? (
          <div className="p-4 text-sm text-[var(--tm-muted)]">Loading tasks…</div>
        ) : null}

        {tasks.length === 0 && !loading && !loadError ? (
          <div className="p-4 text-sm">
            No tasks yet. Click{" "}
            <span className="font-semibold text-[var(--tm-primary)]">
              New Task
            </span>{" "}
            to create one.
          </div>
        ) : null}

        <ul className="divide-y divide-black/10">
          {tasks.map((t) => (
            <li key={t.id} className="px-3 py-3">
              <div className="grid grid-cols-12 items-start gap-3">
                <div className="col-span-12 sm:col-span-5">
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
                      <p className="truncate text-sm font-semibold">
                        {t.title}{" "}
                        {t._optimistic ? (
                          <span className="ml-1 text-xs font-medium text-[var(--tm-muted)]">
                            syncing…
                          </span>
                        ) : null}
                      </p>
                      {t.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-[var(--tm-muted)]">
                          {t.description}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs text-[var(--tm-muted)]">
                        Updated {new Date(t.updatedAt ?? t.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-span-6 sm:col-span-3">
                  <p className="text-sm sm:hidden">
                    <span className="text-[var(--tm-muted)]">Status:</span>{" "}
                    <span className="font-medium">{t.status}</span>
                  </p>
                  <div className="hidden sm:block">
                    <span className="rounded-xl bg-black/5 px-3 py-1 text-sm">
                      {t.status}
                    </span>
                  </div>
                </div>

                <div className="col-span-6 hidden md:block">
                  <span className="rounded-xl bg-black/5 px-3 py-1 text-sm">
                    {t.priority ?? "—"}
                  </span>
                </div>

                <div className="col-span-12 sm:col-span-4 md:col-span-2">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      variant="ghost"
                      disabled={!!busyIds[t.id]}
                      onClick={() => {
                        setEditing(t);
                        setEditorOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      disabled={!!busyIds[t.id]}
                      onClick={() => setDeleteTarget(t)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

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
