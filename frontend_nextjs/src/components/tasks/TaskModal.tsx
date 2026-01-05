"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { normalizeApiErrorMessage } from "@/lib/api/errors";
import { useToast } from "@/components/toast/ToastProvider";

export function TaskModal({
  open,
  mode,
  task,
  onClose,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  mode: "create" | "edit";
  task: Task | null;
  onClose: () => void;
  onCreate: (t: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority?: TaskPriority;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    patch: Partial<Omit<Task, "id">>
  ) => Promise<void>;
}) {
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");
  const [priority, setPriority] = useState<TaskPriority | "">( "" );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSubmitting(false);

    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setStatus(task?.status ?? "todo");
    setPriority((task?.priority as TaskPriority | null) ?? "");
  }, [open, task]);

  const modalTitle = useMemo(
    () => (isEdit ? "Edit task" : "New task"),
    [isEdit]
  );

  const modalDescription = useMemo(
    () =>
      isEdit
        ? "Update fields and save changes. Optimistic updates are enabled."
        : "Create a new task. Title is required.",
    [isEdit]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() ? description.trim() : undefined,
        status,
        priority: priority ? (priority as TaskPriority) : undefined,
      };

      if (isEdit && task) {
        await onUpdate(task.id, payload);
        toast.success("Saved changes");
      } else {
        await onCreate(payload);
      }
      onClose();
    } catch (err) {
      const msg = normalizeApiErrorMessage(err);
      setError(msg);
      toast.error("Save failed", "Please retry. If it persists, refresh.");
    } finally {
      setSubmitting(false);
    }
  }

  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={submitting}>
        Cancel
      </Button>
      <Button
        variant="primary"
        type="submit"
        form="task-form"
        loading={submitting}
      >
        {isEdit ? "Save" : "Create"}
      </Button>
    </>
  );

  return (
    <Modal
      open={open}
      title={modalTitle}
      description={modalDescription}
      onClose={onClose}
      footer={footer}
    >
      <form id="task-form" onSubmit={onSubmit} className="space-y-3">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={submitting}
          placeholder="e.g., Finish project plan"
        />

        <label className="block">
          <span className="text-sm font-medium">Description</span>
          <textarea
            className="mt-1 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-[var(--tm-text)] focus:outline-none focus:ring-4 focus:ring-[var(--tm-ring)]"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            placeholder="Optional details…"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            disabled={submitting}
          >
            <option value="todo">todo</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
          </Select>

          <Select
            label="Priority (optional)"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority | "")}
            disabled={submitting}
          >
            <option value="">(not set)</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
          </Select>
        </div>

        {error ? (
          <div
            className="rounded-xl border border-[var(--tm-danger)] bg-[rgba(239,68,68,0.08)] p-3 text-sm"
            role="alert"
          >
            <p className="font-semibold text-[var(--tm-danger)]">
              Could not save
            </p>
            <p className="mt-1 text-[var(--tm-text)]">{error}</p>
            <p className="mt-1 text-[var(--tm-muted)]">
              Try again. If you recently edited this task in another tab/device,
              refresh first.
            </p>
          </div>
        ) : null}
      </form>
    </Modal>
  );
}
