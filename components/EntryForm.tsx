"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";

type EntryFormValues = {
  title: string;
  type: string;
  status: string;
  rating: string;
  description: string;
  notes: string;
  coverUrl: string;
  watchedAt: string;
  platform: string;
  playtimeMinutes: string;
  season: string;
  episode: string;
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
  watchedAt: "",
  platform: "",
  playtimeMinutes: "",
  season: "",
  episode: "",
};

export function EntryForm({ mode, entryId, initialValues }: EntryFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const values = useMemo(
    () => ({ ...emptyValues, ...initialValues }),
    [initialValues],
  );

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

    if (payload.rating && (Number(payload.rating) < 1 || Number(payload.rating) > 10)) {
      nextErrors.rating = "Bewertung muss zwischen 1 und 10 liegen.";
    }

    if (payload.playtimeMinutes && Number(payload.playtimeMinutes) < 0) {
      nextErrors.playtimeMinutes = "Die Spielzeit kann nicht negativ sein.";
    }

    if (payload.season && Number(payload.season) < 1) {
      nextErrors.season = "Staffel muss mindestens 1 sein.";
    }

    if (payload.episode && Number(payload.episode) < 1) {
      nextErrors.episode = "Folge muss mindestens 1 sein.";
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
      watchedAt: String(formData.get("watchedAt") ?? ""),
      platform: String(formData.get("platform") ?? ""),
      playtimeMinutes: String(formData.get("playtimeMinutes") ?? ""),
      season: String(formData.get("season") ?? ""),
      episode: String(formData.get("episode") ?? ""),
    };

    const nextErrors = validate(payload);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    const response = await fetch(mode === "edit" && entryId ? `/api/entries/${entryId}` : "/api/entries", {
      method: mode === "edit" ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
        <select id="type" name="type" defaultValue={values.type} aria-invalid={Boolean(errors.type)}>
          <option value="MOVIE">Film</option>
          <option value="SERIES">Serie</option>
          <option value="GAME">Spiel</option>
        </select>
        {errors.type ? <span className={styles.errorText}>{errors.type}</span> : null}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="status">Status</label>
        <select id="status" name="status" defaultValue={values.status} aria-invalid={Boolean(errors.status)}>
          <option value="PLANNED">Geplant</option>
          <option value="WATCHING">Gesehen, nicht abgeschlossen</option>
          <option value="COMPLETED">Abgeschlossen</option>
          <option value="ABANDONED">Abgebrochen</option>
        </select>
        {errors.status ? <span className={styles.errorText}>{errors.status}</span> : null}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="rating">Bewertung (1-10)</label>
        <input
          id="rating"
          name="rating"
          type="number"
          min="1"
          max="10"
          defaultValue={values.rating}
          aria-invalid={Boolean(errors.rating)}
        />
        {errors.rating ? <span className={styles.errorText}>{errors.rating}</span> : null}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="watchedAt">Datum</label>
        <input id="watchedAt" name="watchedAt" type="date" defaultValue={values.watchedAt} />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="platform">Plattform</label>
        <select id="platform" name="platform" defaultValue={values.platform || ""}>
          <option value="">Keine Plattform</option>
          <option value="Netflix">Netflix</option>
          <option value="Prime Video">Prime Video</option>
          <option value="Disney+">Disney+</option>
          <option value="Apple TV+">Apple TV+</option>
          <option value="Sky">Sky</option>
          <option value="Max">Max</option>
          <option value="YouTube">YouTube</option>
          <option value="Steam">Steam</option>
          <option value="PlayStation">PlayStation</option>
          <option value="Xbox">Xbox</option>
          <option value="Nintendo Switch">Nintendo Switch</option>
          <option value="Kino">Kino</option>
          <option value="TV">TV</option>
          <option value="Sonstiges">Sonstiges</option>
        </select>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="playtimeMinutes">Spielzeit (Minuten)</label>
        <input
          id="playtimeMinutes"
          name="playtimeMinutes"
          type="number"
          min="0"
          defaultValue={values.playtimeMinutes}
          aria-invalid={Boolean(errors.playtimeMinutes)}
        />
        {errors.playtimeMinutes ? <span className={styles.errorText}>{errors.playtimeMinutes}</span> : null}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="season">Staffel</label>
        <input
          id="season"
          name="season"
          type="number"
          min="1"
          defaultValue={values.season}
          aria-invalid={Boolean(errors.season)}
        />
        {errors.season ? <span className={styles.errorText}>{errors.season}</span> : null}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="episode">Folge</label>
        <input
          id="episode"
          name="episode"
          type="number"
          min="1"
          defaultValue={values.episode}
          aria-invalid={Boolean(errors.episode)}
        />
        {errors.episode ? <span className={styles.errorText}>{errors.episode}</span> : null}
      </div>

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
