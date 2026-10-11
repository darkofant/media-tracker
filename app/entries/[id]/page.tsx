import Link from "next/link";
import { notFound, redirect } from "next/navigation";

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

async function deleteEntry(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");

  if (!id) {
    redirect("/");
  }

  await prisma.mediaEntry.delete({ where: { id } });
  redirect("/");
}

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
        <h1>{entry.title}</h1>
        <div className={styles.heroActions}>
          <Link href={`/entries/${id}/edit`} className={styles.primaryButton}>
            Bearbeiten
          </Link>
          <form action={deleteEntry}>
            <input type="hidden" name="id" value={id} />
            <button type="submit" className={styles.secondaryButton}>
              Löschen
            </button>
          </form>
          <Link href="/" className={styles.secondaryButton}>
            Zurück zur Liste
          </Link>
        </div>
      </div>

      <div className={styles.detailCard}>
        {entry.coverUrl ? <img src={entry.coverUrl} alt={entry.title} className={styles.coverImageLarge} /> : null}

        <ul className={styles.detailList}>
          <li>
            <strong>Typ</strong>
            <span>{typeLabels[entry.type] ?? entry.type}</span>
          </li>
          <li>
            <strong>Status</strong>
            <span>{statusLabels[entry.status] ?? entry.status}</span>
          </li>
          <li>
            <strong>Bewertung</strong>
            <span>{entry.rating ? `${entry.rating}/10` : "Noch keine Bewertung"}</span>
          </li>
          <li>
            <strong>Datum</strong>
            <span>{entry.watchedAt ? new Date(entry.watchedAt).toLocaleDateString("de-DE") : "Noch kein Datum"}</span>
          </li>
          <li>
            <strong>Plattform</strong>
            <span>{entry.platform ?? "Keine Plattform angegeben"}</span>
          </li>
          <li>
            <strong>Spielzeit</strong>
            <span>{entry.playtimeMinutes ? `${entry.playtimeMinutes} Minuten` : "Keine Angabe"}</span>
          </li>
          <li>
            <strong>Staffel / Folge</strong>
            <span>
              {entry.season || entry.episode
                ? `S${entry.season ?? "?"} / E${entry.episode ?? "?"}`
                : "Keine Angaben"}
            </span>
          </li>
          <li>
            <strong>Beschreibung</strong>
            <span>{entry.description || "Keine Beschreibung hinterlegt."}</span>
          </li>
          <li>
            <strong>Notiz</strong>
            <span>{entry.notes || "Keine Notiz hinterlegt."}</span>
          </li>
        </ul>
      </div>
    </main>
  );
}
