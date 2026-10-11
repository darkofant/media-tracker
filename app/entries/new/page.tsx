import Link from "next/link";

import { EntryForm } from "@/components/EntryForm";
import styles from "@/app/page.module.css";

export default function NewEntryPage() {
  return (
    <main className={styles.formShell}>
      <div className={styles.formHeader}>
        <h1>Neuer Eintrag</h1>
        <Link href="/" className={styles.secondaryButton}>
          Zurück zur Liste
        </Link>
      </div>

      <div className={styles.formCard}>
        <EntryForm mode="create" />
      </div>
    </main>
  );
}
