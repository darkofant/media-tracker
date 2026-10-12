import { getApiCredential } from "@/lib/api-credentials";

type OmdbEpisode = {
  Episode: string;
  imdbRating: string;
};

type OmdbResponse = {
  Response: "True" | "False";
  Error?: string;
  imdbRating?: string;
  Episodes?: OmdbEpisode[];
};

function parseRating(value: string | undefined): number | null {
  if (!value || value === "N/A") {
    return null;
  }

  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 0 && rating <= 10 ? rating : null;
}

async function fetchOmdb(params: Record<string, string>): Promise<OmdbResponse> {
  const apiKey = await getApiCredential("OMDB");

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", apiKey);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, { next: { revalidate: 86400 } });
  if (!response.ok) {
    throw new Error("OMDb-Abfrage fehlgeschlagen.");
  }

  const data = (await response.json()) as OmdbResponse;
  if (data.Response !== "True") {
    throw new Error(data.Error ?? "OMDb hat keine Bewertung zurückgegeben.");
  }

  return data;
}

export async function fetchOmdbMovieRating(imdbId: string | null, title: string): Promise<number | null> {
  const data = await fetchOmdb(imdbId ? { i: imdbId } : { t: title });
  return parseRating(data.imdbRating);
}

export async function fetchOmdbSeasonRatings(
  seriesImdbId: string,
  seasonNumber: number,
): Promise<Map<number, number | null>> {
  const data = await fetchOmdb({ i: seriesImdbId, Season: String(seasonNumber) });
  return new Map((data.Episodes ?? []).map((episode) => [Number(episode.Episode), parseRating(episode.imdbRating)]));
}
