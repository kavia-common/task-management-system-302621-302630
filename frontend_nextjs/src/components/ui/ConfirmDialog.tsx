"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText,
  confirmVariant = "primary",
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  confirmVariant?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => Promise<void> | void;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={() => {
        if (!submitting) onCancel();
      }}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={async () => {
              if (submitting) return;
              setSubmitting(true);
              try {
                await onConfirm();
              } finally {
                setSubmitting(false);
              }
            }}
            loading={submitting}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p className="text-sm text-[var(--tm-muted)]">
        This action can’t be undone.
      </p>
    </Modal>
  );
}
