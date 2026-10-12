"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";
import { ImdbRatingBadge } from "@/components/ImdbRatingBadge";

type TmdbEpisode = {
  key: string;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  airDate: string | null;
  imdbRating: number | null;
};

type SeriesSearchResult = {
  id: number;
  title: string;
  type: string;
};

type EpisodeResponse = {
  episodes: TmdbEpisode[];
  watchedEpisodeKeys: string[];
  status: string;
  imdbRatingError?: string;
};

type SeriesEpisodeTrackerProps = {
  entryId: string;
  title: string;
  tmdbId: number | null;
};

export function SeriesEpisodeTracker({ entryId, title, tmdbId }: SeriesEpisodeTrackerProps) {
  const router = useRouter();
  const [linkedTmdbId, setLinkedTmdbId] = useState(tmdbId);
  const [episodes, setEpisodes] = useState<TmdbEpisode[]>([]);
  const [watchedEpisodeKeys, setWatchedEpisodeKeys] = useState<string[]>([]);
  const [query, setQuery] = useState(title);
  const [results, setResults] = useState<SeriesSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(tmdbId !== null);
  const [isSearching, setIsSearching] = useState(false);
  const [savingEpisodeKey, setSavingEpisodeKey] = useState("");
  const [error, setError] = useState("");
  const [imdbRatingError, setImdbRatingError] = useState("");

  useEffect(() => {
    if (linkedTmdbId === null) {
      return;
    }

    const controller = new AbortController();

    fetch(`/api/entries/${entryId}/episodes`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as EpisodeResponse & { error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "Folgenliste konnte nicht geladen werden.");
        }
        setEpisodes(data.episodes);
        setWatchedEpisodeKeys(data.watchedEpisodeKeys);
        if (data.imdbRatingError) {
          setImdbRatingError(data.imdbRatingError);
        }
        router.refresh();
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Folgenliste konnte nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [entryId, linkedTmdbId, router]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSearching(true);
    setError("");

    try {
      const response = await fetch(`/api/media-search?provider=tmdb&q=${encodeURIComponent(query)}`);
      const data = (await response.json()) as { results?: SeriesSearchResult[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "TMDB-Suche fehlgeschlagen.");
      }
      setResults((data.results ?? []).filter((result) => result.type === "SERIES"));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "TMDB-Suche fehlgeschlagen.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLink = async (result: SeriesSearchResult) => {
    setError("");

    try {
      const response = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdbId: result.id }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Serie konnte nicht verknüpft werden.");
      }
      setResults([]);
      setError("");
      setIsLoading(true);
      setLinkedTmdbId(result.id);
      router.refresh();
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Serie konnte nicht verknüpft werden.");
    }
  };

  const handleEpisodeChange = async (episode: TmdbEpisode, watched: boolean) => {
    let markPreviousAsWatched = false;
    if (watched) {
      const episodeIndex = episodes.findIndex((item) => item.key === episode.key);
      const hasUnwatchedPreviousEpisode = episodes
        .slice(0, episodeIndex)
        .some((item) => !watchedEpisodeKeys.includes(item.key));

      markPreviousAsWatched =
        hasUnwatchedPreviousEpisode &&
        window.confirm(
          `Sollen alle Folgen vor Staffel ${episode.seasonNumber}, Folge ${episode.episodeNumber} ebenfalls als gesehen markiert werden?`,
        );
    }

    setSavingEpisodeKey(episode.key);
    setError("");

    try {
      const response = await fetch(`/api/entries/${entryId}/episodes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episodeKey: episode.key, watched, markPreviousAsWatched }),
      });
      const data = (await response.json()) as { watchedEpisodeKeys?: string[]; error?: string };
      if (!response.ok || !data.watchedEpisodeKeys) {
        throw new Error(data.error ?? "Folgenfortschritt konnte nicht gespeichert werden.");
      }
      setWatchedEpisodeKeys(data.watchedEpisodeKeys);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Folgenfortschritt konnte nicht gespeichert werden.");
    } finally {
      setSavingEpisodeKey("");
    }
  };

  if (linkedTmdbId === null) {
    return (
      <section className={styles.seriesTracker} aria-labelledby="series-tracker-heading">
        <h2 id="series-tracker-heading">Staffeln und Folgen</h2>
        <p>Verknüpfe diese Serie mit TMDB, um die Staffeln und Folgen zu laden.</p>
        <form className={styles.seriesSearchForm} onSubmit={handleSearch}>
          <input
            aria-label="Serie bei TMDB suchen"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Serientitel suchen"
            required
          />
          <button type="submit" className={styles.secondaryButton} disabled={isSearching}>
            {isSearching ? "Suche läuft..." : "TMDB durchsuchen"}
          </button>
        </form>
        {results.length > 0 ? (
          <ul className={styles.seriesSearchResults}>
            {results.map((result) => (
              <li key={result.id}>
                <span>{result.title}</span>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => void handleLink(result)}
                >
                  Verknüpfen
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {error ? <p className={styles.errorText} role="alert">{error}</p> : null}
      </section>
    );
  }

  const seasons = [...new Set(episodes.map((episode) => episode.seasonNumber))];
  const watchedCount = watchedEpisodeKeys.length;

  return (
    <section className={styles.seriesTracker} aria-labelledby="series-tracker-heading">
      <h2 id="series-tracker-heading">Staffeln und Folgen</h2>
      {isLoading ? <p role="status">Folgenliste wird geladen...</p> : null}
      {error ? <p className={styles.errorText} role="alert">{error}</p> : null}
      {imdbRatingError ? (
        <p className={styles.errorText} role="alert">
          IMDb-Bewertungen nicht verfügbar: {imdbRatingError}
        </p>
      ) : null}
      {!isLoading && !error && episodes.length === 0 ? <p>TMDB enthält noch keine Folgen für diese Serie.</p> : null}
      {!isLoading && episodes.length > 0 ? (
        <>
          <p className={styles.episodeProgress} role="status">
            {watchedCount} von {episodes.length} Folgen gesehen
          </p>
          {seasons.map((seasonNumber) => {
            const seasonEpisodes = episodes.filter((episode) => episode.seasonNumber === seasonNumber);
            const seasonWatchedCount = seasonEpisodes.filter((episode) =>
              watchedEpisodeKeys.includes(episode.key),
            ).length;

            return (
              <details
                className={styles.seriesSeason}
                key={seasonNumber}
                open={seasonWatchedCount < seasonEpisodes.length}
              >
                <summary>
                  Staffel {seasonNumber} · {seasonWatchedCount}/{seasonEpisodes.length} Folgen
                </summary>
                <ul className={styles.episodeList}>
                  {seasonEpisodes.map((episode) => (
                    <li key={episode.key}>
                      <label>
                        <input
                          type="checkbox"
                          checked={watchedEpisodeKeys.includes(episode.key)}
                          disabled={savingEpisodeKey !== ""}
                          onChange={(event) => void handleEpisodeChange(episode, event.target.checked)}
                        />
                        <span className={styles.episodeTitle}>
                          <strong>Folge {episode.episodeNumber}</strong>
                          {episode.name ? ` · ${episode.name}` : ""}
                        </span>
                        <ImdbRatingBadge rating={episode.imdbRating} />
                      </label>
                    </li>
                  ))}
                </ul>
              </details>
            );
          })}
        </>
      ) : null}
    </section>
  );
}
