import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider") ?? "tmdb";
  const query = searchParams.get("q") ?? "";

  if (!query.trim()) {
    return NextResponse.json({ results: [] });
  }

  if (provider === "tmdb") {
    const apiKey = process.env.TMDB_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "TMDB_API_KEY ist nicht gesetzt. Füge sie in .env hinzu." },
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

    const data = await response.json();
    const results = (data.results ?? [])
      .filter((item: { media_type?: string }) => ["movie", "tv", "person"].includes(item.media_type ?? ""))
      .slice(0, 6)
      .map((item: any) => ({
        id: item.id,
        title: item.title ?? item.name,
        type: item.media_type === "movie" ? "MOVIE" : item.media_type === "tv" ? "SERIES" : "MOVIE",
        description: item.overview ?? "",
        coverUrl: item.poster_path
          ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
          : item.backdrop_path
            ? `https://image.tmdb.org/t/p/w500${item.backdrop_path}`
            : "",
        releaseDate: item.release_date ?? item.first_air_date,
      }));

    return NextResponse.json({ results });
  }

  if (provider === "rawg") {
    const apiKey = process.env.RAWG_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "RAWG_API_KEY ist nicht gesetzt." },
        { status: 400 },
      );
    }

    const response = await fetch(
      `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(query)}&page_size=6`,
    );

    if (!response.ok) {
      return NextResponse.json({ error: "RAWG-Abfrage fehlgeschlagen." }, { status: 500 });
    }

    const data = await response.json();
    const results = (data.results ?? []).slice(0, 6).map((item: any) => ({
      id: item.id,
      title: item.name,
      type: "GAME",
      description: item.description_raw ?? item.description ?? "",
      coverUrl: item.background_image ?? item.image_background ?? "",
      releaseDate: item.released,
    }));

    return NextResponse.json({ results });
  }

  return NextResponse.json({ error: "Unbekannter Provider." }, { status: 400 });
}
