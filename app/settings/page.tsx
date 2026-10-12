import Link from "next/link";

import { ApiCredentialSettings } from "@/components/ApiCredentialSettings";
import styles from "@/app/page.module.css";

export default function SettingsPage() {
  return (
    <main className={styles.formShell}>
      <div className={styles.formHeader}>
        <h1>Einstellungen</h1>
        <Link href="/" className={styles.secondaryButton}>Zurück zur Liste</Link>
      </div>
      <section className={styles.formCard}>
        <h2>API-Schlüssel</h2>
        <p>Hinterlege Zugangsdaten für Medien-Suche und IMDb-Bewertungen.</p>
        <ApiCredentialSettings />
      </section>
    </main>
  );
}
