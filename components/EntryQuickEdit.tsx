"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPlaytimeHours, isValidPlaytimeHours, playtimeHoursToMinutes } from "@/lib/playtime";
import { StarRatingInput } from "@/components/StarRatingInput";
import styles from "@/app/page.module.css";

type EntryQuickEditProps = {
  entryId: string;
  type: string;
  status: string;
  rating: number | null;
  playtimeMinutes: number | null;
};

type QuickEditValues = {
  status: string;
  rating: string;
  playtimeMinutes: string;
};

type QuickEditField = keyof QuickEditValues;

const statusLabels: Record<string, string> = {
  PLANNED: "Geplant",
  WATCHING: "Gesehen, nicht abgeschlossen",
  COMPLETED: "Abgeschlossen",
  ABANDONED: "Abgebrochen",
};

export function EntryQuickEdit({ entryId, type, status, rating, playtimeMinutes }: EntryQuickEditProps) {
  const router = useRouter();
  const [values, setValues] = useState<QuickEditValues>({
    status:
      type === "MOVIE" && status === "WATCHING"
        ? "COMPLETED"
        : type === "GAME" && status === "WATCHING"
          ? "PLANNED"
          : status,
    rating: rating === null ? "" : String(rating),
    playtimeMinutes: playtimeMinutes === null ? "" : formatPlaytimeHours(playtimeMinutes),
  });
  const [savedValues, setSavedValues] = useState(values);
  const [savingField, setSavingField] = useState<QuickEditField | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const playtimeSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (playtimeSaveTimeout.current) {
        clearTimeout(playtimeSaveTimeout.current);
      }
    },
    [],
  );

  const saveField = async (field: QuickEditField, value: string) => {
    if (field === "playtimeMinutes" && !isValidPlaytimeHours(value)) {
      setError("Bitte die Spielzeit in Stunden eingeben, zum Beispiel 2,5.");
      setMessage("");
      return;
    }

    const previousValue = savedValues[field];
    setValues((current) => ({ ...current, [field]: value }));
    setSavingField(field);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [field]:
            field === "status"
              ? value
              : field === "playtimeMinutes"
                ? playtimeHoursToMinutes(value)
                : value === ""
                  ? null
                  : Number(value),
        }),
      });

      if (!response.ok) {
        const result: unknown = await response.json();
        const serverError =
          typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
            ? result.error
            : "Änderungen konnten nicht gespeichert werden.";
        throw new Error(serverError);
      }

      setSavedValues((current) => ({ ...current, [field]: value }));
      setMessage("Gespeichert.");
      router.refresh();
    } catch (saveError) {
      setValues((current) => ({ ...current, [field]: previousValue }));
      setError(saveError instanceof Error ? saveError.message : "Änderungen konnten nicht gespeichert werden.");
    } finally {
      setSavingField(null);
    }
  };

  const handlePlaytimeChange = (value: string) => {
    setValues((current) => ({ ...current, playtimeMinutes: value }));
    setError("");
    if (playtimeSaveTimeout.current) {
      clearTimeout(playtimeSaveTimeout.current);
    }
    if (!isValidPlaytimeHours(value)) {
      return;
    }
    playtimeSaveTimeout.current = setTimeout(() => {
      playtimeSaveTimeout.current = null;
      void saveField("playtimeMinutes", value);
    }, 500);
  };

  const savePlaytimeImmediately = () => {
    if (playtimeSaveTimeout.current) {
      clearTimeout(playtimeSaveTimeout.current);
      playtimeSaveTimeout.current = null;
    }
    if (values.playtimeMinutes !== savedValues.playtimeMinutes) {
      void saveField("playtimeMinutes", values.playtimeMinutes);
    }
  };

  return (
    <div className={styles.quickEditForm}>
      <div className={styles.quickEditFields}>
        <div className={styles.fieldGroup}>
          {type === "SERIES" ? (
            <>
              <label>Status</label>
              <output className={styles.quickEditStatus}>
                {statusLabels[status] ?? status} – wird aus dem Folgenfortschritt berechnet
              </output>
            </>
          ) : (
            <>
              <label htmlFor="quick-status">Status</label>
              <select
                id="quick-status"
                value={values.status}
                disabled={savingField !== null}
                onChange={(event) => void saveField("status", event.target.value)}
              >
                <option value="PLANNED">Geplant</option>
                {type === "SERIES" ? <option value="WATCHING">Gesehen, nicht abgeschlossen</option> : null}
                <option value="COMPLETED">{type === "MOVIE" ? "Gesehen" : "Abgeschlossen"}</option>
                <option value="ABANDONED">Abgebrochen</option>
              </select>
            </>
          )}
        </div>

        <StarRatingInput
          idPrefix="quick-rating"
          name="quick-rating"
          legend="Bewertung"
          value={values.rating}
          disabled={savingField !== null}
          onChange={(rating) => void saveField("rating", rating)}
        />

        {type === "GAME" ? (
          <div className={styles.fieldGroup}>
            <label htmlFor="quick-playtime">Spielzeit (Stunden)</label>
            <input
              id="quick-playtime"
              type="text"
              inputMode="decimal"
              pattern="[0-9]+([,.][0-9]{1,2})?"
              value={values.playtimeMinutes}
              disabled={savingField !== null}
              onChange={(event) => handlePlaytimeChange(event.target.value)}
              onBlur={savePlaytimeImmediately}
              placeholder="z. B. 2,5"
            />
          </div>
        ) : null}
      </div>

      <div className={styles.quickEditActions}>
        {savingField ? <span role="status">Wird gespeichert...</span> : null}
        {message ? <span role="status">{message}</span> : null}
        {error ? <span className={styles.errorText} role="alert">{error}</span> : null}
      </div>
    </div>
  );
}
