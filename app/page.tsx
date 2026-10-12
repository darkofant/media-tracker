import Link from "next/link";

import { ImdbRating } from "@/components/ImdbRating";
import { RatingStars } from "@/components/RatingStars";
import { PlatformBadge } from "@/components/PlatformBadge";
import { formatPlaytimeHours } from "@/lib/playtime";
import { prisma } from "@/lib/prisma";
import styles from "./page.module.css";

type SearchParams = {
  q?: string;
  type?: string;
  status?: string;
};

const statusLabels: Record<string, string> = {
  PLANNED: "Geplant",
  WATCHING: "Gesehen, nicht abgeschlossen",
  COMPLETED: "Abgeschlossen",
  ABANDONED: "Abgebrochen",
};

const typeLabels: Record<string, string> = {
  MOVIE: "Film",
  SERIES: "Serie",
  GAME: "Spiel",
};

function getSeriesProgressLabel(watchedEpisodeKeys: string): string {
  try {
    const keys: unknown = JSON.parse(watchedEpisodeKeys);
    if (!Array.isArray(keys) || !keys.every((key) => typeof key === "string")) {
      return "Fortschritt nicht verfügbar";
    }

    const count = keys.length;
    const seasons = keys
      .map((key) => /^S([1-9]\d*)E[1-9]\d*$/.exec(key))
      .filter((match): match is RegExpExecArray => match !== null)
      .map((match) => Number(match[1]));
    const currentSeason = seasons.length > 0 ? Math.max(...seasons) : null;
    const progress = `${count} ${count === 1 ? "Folge" : "Folgen"} gesehen`;

    return currentSeason === null ? progress : `Staffel ${currentSeason} · ${progress}`;
  } catch {
    return "Fortschritt nicht verfügbar";
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const params = searchParams ? await Promise.resolve(searchParams) : {};
  const query = params.q ?? "";
  const selectedType = params.type ?? "ALL";
  const selectedStatus = params.status ?? "ALL";

  const where: Record<string, unknown> = {};

  if (query.trim()) {
    where.title = { contains: query.trim() };
  }

  if (selectedType !== "ALL") {
    where.type = selectedType;
  }

  if (selectedStatus === "COMPLETED") {
    where.OR = [
      { status: "COMPLETED" },
      { type: "MOVIE", status: "WATCHING" },
    ];
  } else if (selectedStatus === "WATCHING") {
    where.status = selectedStatus;
    where.NOT = { type: "MOVIE" };
  } else if (selectedStatus !== "ALL") {
    where.status = selectedStatus;
  }

  const entries = await prisma.mediaEntry.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  const total = entries.length;
  const completed = entries.filter(
    (entry) => entry.status === "COMPLETED" || (entry.type === "MOVIE" && entry.status === "WATCHING"),
  ).length;
  const ratedEntries = entries.filter((entry) => entry.rating !== null);
  const averageRating =
    ratedEntries.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / Math.max(ratedEntries.length, 1);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>Media Tracker</p>
          <h1>Deine persönliche Medienbibliothek</h1>
        </div>

        <div className={styles.heroActions}>
          <Link
            href="/entries/new"
            className={`${styles.iconButton} ${styles.primaryIconButton}`}
            aria-label="Neuer Eintrag"
            title="Neuer Eintrag"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </Link>
          <Link
            href="/import"
            className={styles.iconButton}
            aria-label="Import"
            title="Import"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M12 3v12" />
              <path d="m7 10 5 5 5-5" />
              <path d="M5 17v3h14v-3" />
            </svg>
          </Link>
          <Link
            href="/settings"
            className={styles.iconButton}
            aria-label="Einstellungen"
            title="Einstellungen"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
              <path d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V2a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z" />
            </svg>
          </Link>
        </div>
      </section>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Gesamt</span>
          <strong>{total}</strong>
          <small>Einträge</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Abgeschlossen</span>
          <strong>{completed}</strong>
          <small>fertig</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Bewertung</span>
          <strong>{averageRating.toFixed(1)}</strong>
          <small>Ø Sterne</small>
        </article>
      </section>

      <section id="filter" className={styles.filterPanel}>
        <form method="GET" className={styles.filterForm}>
          <div className={styles.fieldGroup}>
            <label htmlFor="q">Suche</label>
            <input id="q" name="q" defaultValue={query} placeholder="Titel suchen..." />
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="type">Typ</label>
            <select id="type" name="type" defaultValue={selectedType}>
              <option value="ALL">Alle</option>
              <option value="MOVIE">Film</option>
              <option value="SERIES">Serie</option>
              <option value="GAME">Spiel</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={selectedStatus}>
              <option value="ALL">Alle</option>
              <option value="PLANNED">Geplant</option>
              <option value="WATCHING">Gesehen, nicht abgeschlossen</option>
              <option value="COMPLETED">Abgeschlossen</option>
              <option value="ABANDONED">Abgebrochen</option>
            </select>
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton}>Anwenden</button>
            <Link href="/" className={styles.secondaryButton}>Zurücksetzen</Link>
          </div>
        </form>
      </section>

      <section className={styles.listSection}>
        <div className={styles.sectionHeader}>
          <h2>Neueste Einträge</h2>
          <div className={styles.sectionHeaderActions}>
            <span>{entries.length} sichtbare Einträge</span>
            <Link
              href="/stats"
              className={styles.iconButton}
              aria-label="Statistiken anzeigen"
              title="Statistiken anzeigen"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                <path d="M4 19V5" />
                <path d="M4 19h17" />
                <path d="m7 15 4-4 3 2 6-7" />
                <path d="M16 6h4v4" />
              </svg>
            </Link>
          </div>
        </div>

        <div className={styles.entryGrid}>
          {entries.map((entry) => (
            <Link key={entry.id} href={`/entries/${entry.id}`} className={styles.entryCardLink}>
              <article className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <span className={styles.typeBadge}>{typeLabels[entry.type] ?? entry.type}</span>
                  <span className={styles.statusBadge}>
                    {entry.type === "SERIES"
                      ? getSeriesProgressLabel(entry.watchedEpisodeKeys)
                      : entry.type === "MOVIE" && ["WATCHING", "COMPLETED"].includes(entry.status)
                        ? "Gesehen"
                        : entry.type === "GAME" && entry.status === "WATCHING"
                          ? statusLabels.PLANNED
                          : statusLabels[entry.status] ?? entry.status}
                  </span>
                </div>

                {entry.coverUrl ? (
                  <img src={entry.coverUrl} alt={entry.title} className={styles.coverImage} />
                ) : (
                  <div className={styles.coverPlaceholder}>Kein Cover</div>
                )}

                <h3>{entry.title}</h3>

                <p className={styles.meta}>
                  <PlatformBadge platform={entry.platform} />
                  {entry.type === "GAME" && entry.playtimeMinutes !== null
                    ? ` • ${formatPlaytimeHours(entry.playtimeMinutes)}h`
                    : ""}
                </p>

                <p className={`${styles.notes} ${styles.cardDescription}`}>
                  {entry.description || entry.notes || "Keine Beschreibung oder Notiz hinterlegt."}
                </p>

                <div className={styles.entryFooter}>
                  <span className={styles.cardRatingGroup}>
                    <RatingStars rating={entry.rating} />
                    {entry.type === "MOVIE" ? <ImdbRating entryId={entry.id} /> : null}
                  </span>
                  <span>
                    {entry.watchedAt ? new Date(entry.watchedAt).toLocaleDateString("de-DE") : "Datum offen"}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
