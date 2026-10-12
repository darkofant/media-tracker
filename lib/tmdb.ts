import { getApiCredential } from "@/lib/api-credentials";

export type TmdbEpisode = {
  key: string;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  airDate: string | null;
};

type TmdbSeriesDetails = {
  seasons?: Array<{ season_number: number }>;
};

type TmdbMovieDetails = {
  imdb_id?: string | null;
};

type TmdbExternalIds = {
  imdb_id?: string | null;
};

type TmdbSeasonDetails = {
  episodes?: Array<{
    episode_number: number;
    name: string;
    air_date?: string | null;
  }>;
};

async function fetchTmdbJson<T>(url: string): Promise<T> {
  const apiKey = await getApiCredential("TMDB");

  const response = await fetch(url, {
    next: { revalidate: 3600 },
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("TMDB-Abfrage fehlgeschlagen.");
  }

  return response.json() as Promise<T>;
}

export async function fetchTmdbMovieImdbId(tmdbId: number): Promise<string | null> {
  const movie = await fetchTmdbJson<TmdbMovieDetails>(`https://api.themoviedb.org/3/movie/${tmdbId}`);
  return movie.imdb_id ?? null;
}

export async function fetchTmdbSeriesImdbId(tmdbId: number): Promise<string | null> {
  const externalIds = await fetchTmdbJson<TmdbExternalIds>(`https://api.themoviedb.org/3/tv/${tmdbId}/external_ids`);
  return externalIds.imdb_id ?? null;
}

export async function fetchTmdbSeriesEpisodes(tmdbId: number): Promise<TmdbEpisode[]> {
  const series = await fetchTmdbJson<TmdbSeriesDetails>(
    `https://api.themoviedb.org/3/tv/${tmdbId}?language=de-DE`,
  );
  const seasons = (series.seasons ?? []).filter((season) => season.season_number > 0);
  const today = new Date().toISOString().slice(0, 10);

  const episodesBySeason = await Promise.all(
    seasons.map(async ({ season_number: seasonNumber }) => {
      const season = await fetchTmdbJson<TmdbSeasonDetails>(
        `https://api.themoviedb.org/3/tv/${tmdbId}/season/${seasonNumber}?language=de-DE`,
      );

      return (season.episodes ?? [])
        .filter((episode) => !episode.air_date || episode.air_date <= today)
        .map((episode) => ({
          key: `S${seasonNumber}E${episode.episode_number}`,
          seasonNumber,
          episodeNumber: episode.episode_number,
          name: episode.name,
          airDate: episode.air_date ?? null,
        }));
    }),
  );

  return episodesBySeason
    .flat()
    .sort((a, b) => a.seasonNumber - b.seasonNumber || a.episodeNumber - b.episodeNumber);
}
