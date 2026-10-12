import { NextResponse } from "next/server";
import { getApiCredential } from "@/lib/api-credentials";
import { getExclusiveRawgPlatform, getExclusiveTmdbPlatform } from "@/lib/platforms";

type TmdbSearchResult = {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
};

type TmdbProvider = {
  provider_id: number;
};

type TmdbWatchProviders = {
  results?: {
    DE?: {
      flatrate?: TmdbProvider[];
    };
  };
};

type RawgSearchResult = {
  id: number;
  name: string;
  description_raw?: string;
  description?: string;
  background_image?: string | null;
  image_background?: string | null;
  released?: string;
  platforms?: Array<{
    platform?: {
      name?: string;
    };
  }>;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") ?? "tmdb";
  const query = searchParams.get("q") ?? "";

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  if (provider === "tmdb") {
    let apiKey: string;
    try {
      apiKey = await getApiCredential("TMDB");
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "TMDB_API_KEY ist nicht eingerichtet." },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&include_adult=false&language=de-DE&page=1`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      return NextResponse.json({ error: "TMDB-Abfrage fehlgeschlagen." }, { status: 500 });
    }

    const data = (await response.json()) as { results?: TmdbSearchResult[] };
    const results = await Promise.all(
      (data.results ?? [])
        .filter((item) => ["movie", "tv"].includes(item.media_type ?? ""))
        .slice(0, 6)
        .map(async (item) => {
          let platform: string | null = null;

          if (item.media_type === "tv") {
            const providersResponse = await fetch(
              `https://api.themoviedb.org/3/tv/${item.id}/watch/providers`,
              {
                next: { revalidate: 3600 },
                headers: {
                Authorization: `Bearer ${apiKey}`,
                  "Content-Type": "application/json",
                },
              },
            );

            if (!providersResponse.ok) {
              throw new Error(`TMDB-Plattformen konnten nicht abgerufen werden (HTTP ${providersResponse.status}).`);
            }

            const providers = (await providersResponse.json()) as TmdbWatchProviders;
            platform = getExclusiveTmdbPlatform(
              providers.results?.DE?.flatrate?.map((provider) => provider.provider_id),
            );
          }

          return {
            id: item.id,
            tmdbId: item.media_type === "movie" || item.media_type === "tv" ? item.id : null,
            title: item.title ?? item.name,
            type: item.media_type === "movie" ? "MOVIE" : "SERIES",
            description: item.overview ?? "",
            coverUrl: item.poster_path
              ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
              : item.backdrop_path
                ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
                : "",
            releaseDate: item.release_date ?? item.first_air_date,
            platform,
          };
        }),
    );

    return NextResponse.json({ results });
  }

  if (provider === "rawg") {
    let apiKey: string;
    try {
      apiKey = await getApiCredential("RAWG");
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "RAWG_API_KEY ist nicht eingerichtet." },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=6`,
    );

    if (!response.ok) {
      return NextResponse.json({ error: "RAWG-Abfrage fehlgeschlagen." }, { status: 500 });
    }

    const data = (await response.json()) as { results?: RawgSearchResult[] };
    const results = (data.results ?? []).slice(0, 6).map((item) => ({
      id: item.id,
      title: item.name,
      type: "GAME",
      description: item.description_raw ?? item.description ?? "",
      coverUrl: item.background_image ?? item.image_background ?? "",
      releaseDate: item.released,
      platform: getExclusiveRawgPlatform(
        item.platforms?.map((itemPlatform) => itemPlatform.platform?.name ?? ""),
      ),
    }));

    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: "Unbekannter Provider." }, { status: 400 });
}
