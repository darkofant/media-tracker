import { NextResponse } from "next/server";

import { fetchOmdbMovieRating } from "@/lib/omdb";
import { fetchTmdbMovieImdbId } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.mediaEntry.findUnique({ where: { id } });

  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  if (entry.type !== "MOVIE") {
    return NextResponse.json({ error: "IMDb-Filmbewertungen sind nur für Filme verfügbar." }, { status: 400 });
  }

  try {
    const imdbId = entry.tmdbId === null ? null : await fetchTmdbMovieImdbId(entry.tmdbId);
    const rating = await fetchOmdbMovieRating(imdbId, entry.title);
    return NextResponse.json({ rating });
  } catch (error) {
    const message = error instanceof Error ? error.message : "IMDb-Bewertung konnte nicht geladen werden.";
    const status =
      message.startsWith("OMDB_API_KEY") || message.startsWith("SETTINGS_ENCRYPTION_KEY") ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
