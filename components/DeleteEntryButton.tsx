"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/app/page.module.css";

export function DeleteEntryButton({ entryId }: { entryId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Möchtest du diesen Eintrag wirklich löschen?")) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const response = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Eintrag konnte nicht gelöscht werden.");
      }

      router.push("/");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Eintrag konnte nicht gelöscht werden.");
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`${styles.iconButton} ${styles.deleteIconButton}`}
        aria-label="Eintrag löschen"
        title="Eintrag löschen"
        disabled={isDeleting}
        onClick={() => void handleDelete()}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="m19 6-1 14H6L5 6" />
          <path d="M10 11v5M14 11v5" />
        </svg>
      </button>
      {error ? <span className={styles.errorText} role="alert">{error}</span> : null}
    </>
  );
}
