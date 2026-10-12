import Link from "next/link";

import { prisma } from "@/lib/prisma";
import styles from "@/app/page.module.css";

export default async function StatsPage() {
  const entries = await prisma.mediaEntry.findMany();

  const total = entries.length;
  const completed = entries.filter(
    (entry) => entry.status === "COMPLETED" || (entry.type === "MOVIE" && entry.status === "WATCHING"),
  ).length;
  const inProgress = entries.filter((entry) => entry.status === "WATCHING" && entry.type !== "MOVIE").length;
  const ratedEntries = entries.filter((entry) => entry.rating !== null);
  const avgRating =
    ratedEntries.reduce((sum, entry) => sum + (entry.rating ?? 0), 0) / Math.max(ratedEntries.length, 1);

  const typeCounts = Object.fromEntries(
    ["MOVIE", "SERIES", "GAME"].map((type) => [type, entries.filter((entry) => entry.type === type).length]),
  );

  const statusCounts = Object.fromEntries(
    ["PLANNED", "WATCHING", "COMPLETED", "ABANDONED"].map((status) => [
      status,
      entries.filter(
        (entry) =>
          (status === "COMPLETED" && entry.type === "MOVIE" && entry.status === "WATCHING") ||
          (entry.status === status && !(status === "WATCHING" && entry.type === "MOVIE")),
      ).length,
    ]),
  );

  return (
    <main className={styles.formShell}>
      <div className={styles.formHeader}>
        <h1>Statistiken</h1>
        <Link href="/" className={styles.secondaryButton}>
          Zurück zur Liste
        </Link>
      </div>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Gesamt</span>
          <strong>{total}</strong>
          <small>Medien</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Abgeschlossen</span>
          <strong>{completed}</strong>
          <small>fertig</small>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Ø Bewertung</span>
          <strong>{avgRating.toFixed(1)}</strong>
          <small>von 5 Sternen</small>
        </article>
      </section>

      <div className={styles.formGrid}>
        <div className={styles.formCard}>
          <h2>Nach Typ</h2>
          <ul className={styles.detailList}>
            <li><strong>Filme</strong><span>{typeCounts.MOVIE ?? 0}</span></li>
            <li><strong>Serien</strong><span>{typeCounts.SERIES ?? 0}</span></li>
            <li><strong>Spiele</strong><span>{typeCounts.GAME ?? 0}</span></li>
          </ul>
        </div>

        <div className={styles.formCard}>
          <h2>Nach Status</h2>
          <ul className={styles.detailList}>
            <li><strong>Geplant</strong><span>{statusCounts.PLANNED ?? 0}</span></li>
            <li><strong>In Bearbeitung</strong><span>{statusCounts.WATCHING ?? 0}</span></li>
            <li><strong>Abgeschlossen</strong><span>{statusCounts.COMPLETED ?? 0}</span></li>
            <li><strong>Abgebrochen</strong><span>{statusCounts.ABANDONED ?? 0}</span></li>
          </ul>
        </div>
      </div>

      <div className={styles.formCard} style={{ marginTop: "24px" }}>
        <h2>Übersicht</h2>
        <ul className={styles.detailList}>
          <li><strong>In Bearbeitung</strong><span>{inProgress}</span></li>
          <li><strong>Bewertete Einträge</strong><span>{ratedEntries.length}</span></li>
        </ul>
      </div>
    </main>
  );
}
