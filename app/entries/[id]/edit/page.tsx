import Link from "next/link";
import { notFound } from "next/navigation";

import { EntryForm } from "@/components/EntryForm";
import { formatDateInput } from "@/lib/dates";
import { formatPlaytimeHours } from "@/lib/playtime";
import { prisma } from "@/lib/prisma";
import styles from "@/app/page.module.css";

export default async function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.mediaEntry.findUnique({ where: { id } });

  if (!entry) {
    notFound();
  }

  return (
    <main className={styles.formShell}>
      <div className={styles.formHeader}>
        <h1>Eintrag bearbeiten</h1>
        <Link href={`/entries/${id}`} className={styles.secondaryButton}>
          Zurück zur Detailansicht
        </Link>
      </div>

      <div className={styles.formCard}>
        <EntryForm
          mode="edit"
          entryId={entry.id}
          initialValues={{
            title: entry.title,
            type: entry.type,
            status: entry.status,
            rating: entry.rating ? String(entry.rating) : "",
            description: entry.description ?? "",
            notes: entry.notes ?? "",
            coverUrl: entry.coverUrl ?? "",
            releaseDate: formatDateInput(entry.releaseDate),
            completedAt: formatDateInput(entry.completedAt),
            platform: entry.platform ?? "",
            playtimeMinutes: entry.playtimeMinutes !== null ? formatPlaytimeHours(entry.playtimeMinutes) : "",
          }}
        />
      </div>
    </main>
  );
}
