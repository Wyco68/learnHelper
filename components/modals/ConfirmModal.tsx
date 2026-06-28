"use client";

import Modal from "./Modal";

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">{message}</p>
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={busy}
          className="rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-black/5 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={busy}
          className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
        >
          {busy ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
