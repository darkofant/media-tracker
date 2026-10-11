import Link from "next/link";

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

  if (selectedStatus !== "ALL") {
    where.status = selectedStatus;
  }

  const entries = await prisma.mediaEntry.findMany({
    where,
    orderBy: { updatedAt: "desc" },
  });

  const total = entries.length;
  const completed = entries.filter((entry) => entry.status === "COMPLETED").length;
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
          <Link href="/entries/new" className={styles.primaryButton}>
            Neuer Eintrag
          </Link>
          <Link href="/stats" className={styles.secondaryButton}>
            Statistiken
          </Link>
          <Link href="/import" className={styles.secondaryButton}>
            Import
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
          <small>Ø Punkte</small>
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
          <span>{entries.length} sichtbare Einträge</span>
        </div>

        <div className={styles.entryGrid}>
          {entries.map((entry) => (
            <Link key={entry.id} href={`/entries/${entry.id}`} className={styles.entryCardLink}>
              <article className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <span className={styles.typeBadge}>{typeLabels[entry.type] ?? entry.type}</span>
                  <span className={styles.statusBadge}>{statusLabels[entry.status] ?? entry.status}</span>
                </div>

                {entry.coverUrl ? (
                  <img src={entry.coverUrl} alt={entry.title} className={styles.coverImage} />
                ) : (
                  <div className={styles.coverPlaceholder}>Kein Cover</div>
                )}

                <h3>{entry.title}</h3>

                <p className={styles.meta}>
                  {entry.platform ?? "Kein Gerät hinterlegt"}
                  {entry.playtimeMinutes ? ` • ${Math.round(entry.playtimeMinutes / 60)}h` : ""}
                  {entry.season ? ` • S${entry.season}` : ""}
                  {entry.episode ? `E${entry.episode}` : ""}
                </p>

                <p className={styles.notes}>{entry.description || entry.notes || "Keine Beschreibung oder Notiz hinterlegt."}</p>

                <div className={styles.entryFooter}>
                  <span>{entry.rating ? `★ ${entry.rating}/10` : "Noch keine Bewertung"}</span>
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
