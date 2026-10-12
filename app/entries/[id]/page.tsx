import Link from "next/link";
import { notFound } from "next/navigation";

import { DeleteEntryButton } from "@/components/DeleteEntryButton";
import { EntryQuickEdit } from "@/components/EntryQuickEdit";
import { ImdbRating } from "@/components/ImdbRating";
import { RatingStars } from "@/components/RatingStars";
import { PlatformBadge } from "@/components/PlatformBadge";
import { SeriesEpisodeTracker } from "@/components/SeriesEpisodeTracker";
import { formatDateDisplay } from "@/lib/dates";
import { formatPlaytimeHours } from "@/lib/playtime";
import { prisma } from "@/lib/prisma";
import styles from "@/app/page.module.css";

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

export default async function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.mediaEntry.findUnique({
    where: { id },
  });

  if (!entry) {
    notFound();
  }

  return (
    <main className={styles.detailShell}>
      <div className={styles.detailHeader}>
        <div className={styles.detailTitle}>
          <h1>{entry.title}</h1>
          <Link
            href={`/entries/${id}/edit`}
            className={styles.iconButton}
            aria-label="Eintrag bearbeiten"
            title="Eintrag bearbeiten"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
            </svg>
          </Link>
        </div>
        <div className={styles.heroActions}>
          <Link href="/" className={styles.secondaryButton}>
            Zurück zur Liste
          </Link>
        </div>
      </div>

      <div className={styles.detailCard}>
        {entry.coverUrl ? <img src={entry.coverUrl} alt={entry.title} className={styles.coverImageLarge} /> : null}

        <section className={styles.quickEditSection} aria-labelledby="quick-edit-heading">
          <h2 id="quick-edit-heading">
            {entry.type === "GAME"
              ? "Status, Bewertung und Spielzeit"
              : entry.type === "SERIES"
                ? "Serienstatus und Bewertung"
                : "Status und Bewertung"}
          </h2>
          <EntryQuickEdit
            entryId={entry.id}
            type={entry.type}
            status={entry.status}
            rating={entry.rating}
            playtimeMinutes={entry.playtimeMinutes}
          />
        </section>

        {entry.type === "SERIES" ? (
          <SeriesEpisodeTracker entryId={entry.id} title={entry.title} tmdbId={entry.tmdbId} />
        ) : null}

        <ul className={styles.detailList}>
          <li>
            <strong>Typ</strong>
            <span>{typeLabels[entry.type] ?? entry.type}</span>
          </li>
          <li>
            <strong>Status</strong>
            <span>
              {entry.type === "MOVIE" && ["WATCHING", "COMPLETED"].includes(entry.status)
                ? "Gesehen"
                : entry.type === "GAME" && entry.status === "WATCHING"
                  ? statusLabels.PLANNED
                : statusLabels[entry.status] ?? entry.status}
            </span>
          </li>
          <li>
            <strong>Bewertung</strong>
            <RatingStars rating={entry.rating} />
          </li>
          {entry.type === "MOVIE" ? (
            <li>
              <strong>IMDb-Bewertung</strong>
              <ImdbRating entryId={entry.id} />
            </li>
          ) : null}
          <li>
            <strong>Veröffentlichung</strong>
            <span>{formatDateDisplay(entry.releaseDate)}</span>
          </li>
          <li>
            <strong>Abgeschlossen am</strong>
            <span>{formatDateDisplay(entry.completedAt)}</span>
          </li>
          <li>
            <strong>Plattform</strong>
            <PlatformBadge platform={entry.platform} />
          </li>
          {entry.type === "GAME" ? (
            <li>
              <strong>Spielzeit</strong>
              <span>
                {entry.playtimeMinutes !== null
                  ? `${formatPlaytimeHours(entry.playtimeMinutes)} Stunden`
                  : "Keine Angabe"}
              </span>
            </li>
          ) : null}
          <li>
            <strong>Beschreibung</strong>
            <span>{entry.description || "Keine Beschreibung hinterlegt."}</span>
          </li>
          <li>
            <strong>Notiz</strong>
            <span>{entry.notes || "Keine Notiz hinterlegt."}</span>
          </li>
        </ul>
        <div className={styles.deleteEntryAction}>
          <DeleteEntryButton entryId={id} />
        </div>
      </div>
    </main>
  );
}
