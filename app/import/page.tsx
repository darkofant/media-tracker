"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { PlatformBadge } from "@/components/PlatformBadge";
import styles from "@/app/page.module.css";

export default function ImportPage() {
  const router = useRouter();
  const [provider, setProvider] = useState("tmdb");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{
      id: number;
      tmdbId?: number | null;
      title: string;
      type: string;
      description: string;
      coverUrl?: string;
      releaseDate?: string;
      platform?: string | null;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch(`/api/media-search?provider=${provider}&q=${encodeURIComponent(query)}`);
    const data = await response.json().catch(() => ({}));

    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Suche fehlgeschlagen.");
      setResults([]);
      return;
    }

    setResults(data.results ?? []);
  };

  return (
    <main className={styles.formShell}>
      <div className={styles.formHeader}>
        <h1>Medien importieren</h1>
        <Link href="/" className={styles.secondaryButton}>
          Zurück zur Liste
        </Link>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSearch} className={styles.filterForm}>
          <div className={styles.fieldGroup}>
            <label htmlFor="provider">Anbieter</label>
            <select id="provider" value={provider} onChange={(event) => setProvider(event.target.value)}>
              <option value="tmdb">TMDB</option>
              <option value="rawg">RAWG</option>
            </select>
          </div>

          <div className={styles.fieldGroup}>
            <label htmlFor="query">Suchbegriff</label>
            <input
              id="query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="z. B. Dune, Stardew Valley"
            />
          </div>

          <div className={styles.formActions}>
            <button type="submit" className={styles.primaryButton} disabled={loading}>
              {loading ? "Suche läuft..." : "Suchen"}
            </button>
          </div>
        </form>

        {error ? <div className={styles.errorBanner}>{error}</div> : null}

        <div style={{ marginTop: "24px" }} className={styles.entryGrid}>
          {results.map((result) => (
            <div key={`${result.id}-${result.type}`} className={styles.entryCard}>
              {result.coverUrl ? (
                <img src={result.coverUrl} alt={result.title} className={styles.coverImage} />
              ) : (
                <div className={styles.coverPlaceholder}>Kein Cover</div>
              )}

              <div className={styles.entryHeader}>
                <span className={styles.typeBadge}>{result.type === "GAME" ? "Spiel" : result.type === "SERIES" ? "Serie" : "Film"}</span>
                {result.platform ? <PlatformBadge platform={result.platform} /> : null}
              </div>
              <h3>{result.title}</h3>
              <p className={`${styles.notes} ${styles.cardDescription}`}>
                {result.description || "Keine Beschreibung verfügbar."}
              </p>
              <div className={styles.entryFooter}>
                <span>{result.releaseDate ? `Veröffentlichung ${result.releaseDate}` : "Veröffentlichungsdatum unbekannt"}</span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={async () => {
                    const response = await fetch("/api/entries", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        title: result.title,
                        type: result.type,
                        status: "PLANNED",
                        ...(result.type !== "GAME" && result.tmdbId !== undefined && {
                          tmdbId: result.tmdbId,
                        }),
                        ...(result.platform && { platform: result.platform }),
                        description: result.description,
                        notes: "",
                        coverUrl: result.coverUrl ?? "",
                        releaseDate: result.releaseDate ?? null,
                      }),
                    });

                    if (response.ok) {
                      router.push("/");
                      router.refresh();
                    }
                  }}
                >
                  Importieren
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
