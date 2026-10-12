"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StarRatingInput } from "@/components/StarRatingInput";
import { PlatformBadge } from "@/components/PlatformBadge";
import { isValidPlaytimeHours, playtimeHoursToMinutes } from "@/lib/playtime";
import { isPlatformAllowed, platformOptionsByType, type MediaType } from "@/lib/platforms";
import styles from "@/app/page.module.css";

type EntryFormValues = {
  title: string;
  type: string;
  status: string;
  rating: string;
  description: string;
  notes: string;
  coverUrl: string;
  releaseDate: string;
  completedAt: string;
  platform: string;
  playtimeMinutes: string;
};

type EntryFormProps = {
  mode: "create" | "edit";
  entryId?: string;
  initialValues?: Partial<EntryFormValues>;
};

const emptyValues: EntryFormValues = {
  title: "",
  type: "MOVIE",
  status: "PLANNED",
  rating: "",
  description: "",
  notes: "",
  coverUrl: "",
  releaseDate: "",
  completedAt: "",
  platform: "",
  playtimeMinutes: "",
};

export function EntryForm({ mode, entryId, initialValues }: EntryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const values = useMemo(
    () => ({ ...emptyValues, ...initialValues }),
    [initialValues],
  );
  const [selectedType, setSelectedType] = useState(values.type);
  const [rating, setRating] = useState(values.rating);
  const [selectedStatus, setSelectedStatus] = useState(
    values.type === "MOVIE" && values.status === "WATCHING"
      ? "COMPLETED"
      : values.type === "GAME" && values.status === "WATCHING"
        ? "PLANNED"
        : values.status,
  );
  const [selectedPlatform, setSelectedPlatform] = useState(values.platform);

  const validate = (payload: EntryFormValues) => {
    const nextErrors: Record<string, string> = {};

    if (!payload.title.trim()) {
      nextErrors.title = "Titel ist erforderlich.";
    }

    if (!["MOVIE", "SERIES", "GAME"].includes(payload.type)) {
      nextErrors.type = "Bitte einen gültigen Typ wählen.";
    }

    if (!["PLANNED", "WATCHING", "COMPLETED", "ABANDONED"].includes(payload.status)) {
      nextErrors.status = "Bitte einen gültigen Status wählen.";
    }

    if (payload.rating && (Number(payload.rating) < 1 || Number(payload.rating) > 5)) {
      nextErrors.rating = "Bewertung muss zwischen 1 und 5 Sternen liegen.";
    }

    if (!isValidPlaytimeHours(payload.playtimeMinutes)) {
      nextErrors.playtimeMinutes = "Bitte die Spielzeit in Stunden eingeben, zum Beispiel 2,5.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload: EntryFormValues = {
      title: String(formData.get("title") ?? ""),
      type: String(formData.get("type") ?? "MOVIE"),
      status: String(formData.get("status") ?? "PLANNED"),
      rating: String(formData.get("rating") ?? ""),
      description: String(formData.get("description") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      coverUrl: String(formData.get("coverUrl") ?? ""),
      releaseDate: String(formData.get("releaseDate") ?? ""),
      completedAt: String(formData.get("completedAt") ?? ""),
      platform: String(formData.get("platform") ?? ""),
      playtimeMinutes: String(formData.get("playtimeMinutes") ?? ""),
    };

    const nextErrors = validate(payload);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const payloadWithMinutes = {
      ...payload,
      playtimeMinutes: playtimeHoursToMinutes(payload.playtimeMinutes)?.toString() ?? "",
    };

    setIsSubmitting(true);

    const response = await fetch(mode === "edit" && entryId ? `/api/entries/${entryId}` : "/api/entries", {
      method: mode === "edit" ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payloadWithMinutes),
    });

    const result = await response.json().catch(() => ({}));
    setIsSubmitting(false);

    if (!response.ok) {
      setErrors({
        form: result.error ?? "Eintrag konnte nicht gespeichert werden.",
      });
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formGrid}>
      {errors.form ? <div className={styles.errorBanner}>{errors.form}</div> : null}

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label htmlFor="title">Titel</label>
        <input
          id="title"
          name="title"
          defaultValue={values.title}
          placeholder="z. B. The Last of Us"
          aria-invalid={Boolean(errors.title)}
          required
        />
        {errors.title ? <span className={styles.errorText}>{errors.title}</span> : null}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="type">Typ</label>
        <select
          id="type"
          name="type"
          value={selectedType}
          onChange={(event) => {
            const nextType = event.target.value;
            setSelectedType(nextType);
            setSelectedPlatform((currentPlatform) =>
              isPlatformAllowed(nextType, currentPlatform) ? currentPlatform : "",
            );
            setSelectedStatus((currentStatus) => {
              if (nextType === "SERIES" && selectedType !== "SERIES") {
                return "PLANNED";
              }
              if (nextType === "MOVIE" && currentStatus === "WATCHING") {
                return "COMPLETED";
              }
              if (nextType === "GAME" && currentStatus === "WATCHING") {
                return "PLANNED";
              }
              return currentStatus;
            });
          }}
          aria-invalid={Boolean(errors.type)}
        >
          <option value="MOVIE">Film</option>
          <option value="SERIES">Serie</option>
          <option value="GAME">Spiel</option>
        </select>
        {errors.type ? <span className={styles.errorText}>{errors.type}</span> : null}
      </div>

      <div className={styles.fieldGroup}>
        {selectedType === "SERIES" ? (
          <>
            <label>Status</label>
            <span>Wird automatisch aus den abgehakten Folgen berechnet.</span>
            <input type="hidden" name="status" value={selectedStatus} />
          </>
        ) : (
          <>
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
              aria-invalid={Boolean(errors.status)}
            >
              <option value="PLANNED">Geplant</option>
              <option value="COMPLETED">{selectedType === "MOVIE" ? "Gesehen" : "Abgeschlossen"}</option>
              <option value="ABANDONED">Abgebrochen</option>
            </select>
            {errors.status ? <span className={styles.errorText}>{errors.status}</span> : null}
          </>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <StarRatingInput
          idPrefix="entry-rating"
          name="rating"
          legend="Bewertung"
          value={rating}
          onChange={(nextRating) => {
            setRating(nextRating);
            setErrors((current) => ({ ...current, rating: "" }));
          }}
        />
        {errors.rating ? <span className={styles.errorText}>{errors.rating}</span> : null}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="releaseDate">Veröffentlichungsdatum</label>
        <input id="releaseDate" name="releaseDate" type="date" defaultValue={values.releaseDate} />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="completedAt">Abgeschlossen am</label>
        <input
          id="completedAt"
          name="completedAt"
          type="date"
          defaultValue={values.completedAt}
          disabled={selectedStatus !== "COMPLETED"}
        />
        <span>Wird beim Abschließen automatisch auf heute gesetzt; du kannst das Datum ändern.</span>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="platform">Plattform</label>
        <div className={styles.platformSelectWrap}>
          <select
            id="platform"
            name="platform"
            value={selectedPlatform}
            onChange={(event) => setSelectedPlatform(event.target.value)}
          >
            <option value="">Keine Plattform</option>
            {selectedPlatform && !isPlatformAllowed(selectedType, selectedPlatform) ? (
              <option value={selectedPlatform}>Bisherige Angabe: {selectedPlatform}</option>
            ) : null}
            {platformOptionsByType[selectedType as MediaType].map((platform) => (
              <option value={platform} key={platform}>{platform}</option>
            ))}
          </select>
          {selectedPlatform && isPlatformAllowed(selectedType, selectedPlatform) ? (
            <PlatformBadge platform={selectedPlatform} />
          ) : null}
        </div>
      </div>

      {selectedType === "GAME" ? (
        <div className={styles.fieldGroup}>
          <label htmlFor="playtimeMinutes">Spielzeit (Stunden)</label>
          <input
            id="playtimeMinutes"
            name="playtimeMinutes"
            type="text"
            inputMode="decimal"
            pattern="[0-9]+([,.][0-9]{1,2})?"
            defaultValue={values.playtimeMinutes}
            placeholder="z. B. 2,5"
            aria-invalid={Boolean(errors.playtimeMinutes)}
          />
          {errors.playtimeMinutes ? <span className={styles.errorText}>{errors.playtimeMinutes}</span> : null}
        </div>
      ) : null}

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label htmlFor="coverUrl">Cover-URL</label>
        <input
          id="coverUrl"
          name="coverUrl"
          defaultValue={values.coverUrl}
          placeholder="https://.../cover.jpg"
        />
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label htmlFor="description">Beschreibung</label>
        <textarea
          id="description"
          name="description"
          defaultValue={values.description}
          placeholder="Kurzbeschreibung aus TMDB/RAWG oder eigene Zusammenfassung..."
        />
      </div>

      <div className={`${styles.fieldGroup} ${styles.fullWidth}`}>
        <label htmlFor="notes">Notiz</label>
        <textarea id="notes" name="notes" defaultValue={values.notes} placeholder="Was war besonders gut?" />
      </div>

      <div className={`${styles.formActions} ${styles.fullWidth}`}>
        <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
          {isSubmitting ? "Wird gespeichert..." : mode === "edit" ? "Änderungen speichern" : "Speichern"}
        </button>
      </div>
    </form>
  );
}
