import { NextResponse } from "next/server";
import { z } from "zod";

import { fetchOmdbSeasonRatings } from "@/lib/omdb";
import { fetchTmdbSeriesEpisodes, fetchTmdbSeriesImdbId } from "@/lib/tmdb";
import { prisma } from "@/lib/prisma";

const episodeUpdateSchema = z.object({
  episodeKey: z.string().regex(/^S[1-9]\d*E[1-9]\d*$/),
  watched: z.boolean(),
  markPreviousAsWatched: z.boolean().optional(),
});

const watchedKeysSchema = z.array(z.string().regex(/^S[1-9]\d*E[1-9]\d*$/)).max(10_000);

function tmdbErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "TMDB-Abfrage fehlgeschlagen.";
  const status = message.startsWith("TMDB_API_KEY") || message.startsWith("SETTINGS_ENCRYPTION_KEY") ? 400 : 502;
  return NextResponse.json({ error: message }, { status });
}

function parseStoredWatchedKeys(value: string) {
  try {
    const parsed = watchedKeysSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

function getProgressStatus(totalEpisodes: number, watchedEpisodeKeys: string[], statusWhenNoEpisodes: string) {
  if (totalEpisodes > 0 && watchedEpisodeKeys.length === totalEpisodes) {
    return "COMPLETED";
  }
  if (watchedEpisodeKeys.length > 0) {
    return "WATCHING";
  }
  return statusWhenNoEpisodes === "COMPLETED" ? "PLANNED" : statusWhenNoEpisodes;
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.mediaEntry.findUnique({ where: { id } });

  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  if (entry.type !== "SERIES" || entry.tmdbId === null) {
    return NextResponse.json({ error: "Diese Serie ist nicht mit TMDB verknüpft." }, { status: 400 });
  }

  const storedKeys = parseStoredWatchedKeys(entry.watchedEpisodeKeys);
  if (storedKeys === null) {
    return NextResponse.json({ error: "Der gespeicherte Folgenfortschritt ist ungültig." }, { status: 500 });
  }

  let episodes;
  try {
    episodes = await fetchTmdbSeriesEpisodes(entry.tmdbId);
  } catch (error) {
    return tmdbErrorResponse(error);
  }

  const availableKeys = new Set(episodes.map((episode) => episode.key));
  const watchedEpisodeKeys = storedKeys.filter((key) => availableKeys.has(key));
  const status = getProgressStatus(episodes.length, watchedEpisodeKeys, entry.status);
  const needsSync = status !== entry.status || watchedEpisodeKeys.length !== storedKeys.length;
  if (needsSync) {
    await prisma.mediaEntry.update({
      where: { id },
      data: { status, watchedEpisodeKeys: JSON.stringify(watchedEpisodeKeys) },
    });
  }

  const imdbRatings = new Map<string, number | null>();
  let imdbRatingError: string | undefined;
  try {
    const seriesImdbId = await fetchTmdbSeriesImdbId(entry.tmdbId);
    if (!seriesImdbId) {
      throw new Error("Für diese Serie wurde keine IMDb-ID bei TMDB gefunden.");
    }

    const seasonNumbers = [...new Set(episodes.map((episode) => episode.seasonNumber))];
    await Promise.all(
      seasonNumbers.map(async (seasonNumber) => {
        const seasonRatings = await fetchOmdbSeasonRatings(seriesImdbId, seasonNumber);
        for (const [episodeNumber, rating] of seasonRatings) {
          imdbRatings.set(`S${seasonNumber}E${episodeNumber}`, rating);
        }
      }),
    );
  } catch (error) {
    imdbRatingError = error instanceof Error ? error.message : "IMDb-Folgenbewertungen konnten nicht geladen werden.";
  }

  return NextResponse.json({
    episodes: episodes.map((episode) => ({ ...episode, imdbRating: imdbRatings.get(episode.key) ?? null })),
    watchedEpisodeKeys,
    status,
    imdbRatingError,
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.json();
  const parsed = episodeUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige Folge.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const entry = await prisma.mediaEntry.findUnique({ where: { id } });

  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  if (entry.type !== "SERIES" || entry.tmdbId === null) {
    return NextResponse.json({ error: "Diese Serie ist nicht mit TMDB verknüpft." }, { status: 400 });
  }

  const storedKeys = parseStoredWatchedKeys(entry.watchedEpisodeKeys);
  if (storedKeys === null) {
    return NextResponse.json({ error: "Der gespeicherte Folgenfortschritt ist ungültig." }, { status: 500 });
  }

  let episodes;
  try {
    episodes = await fetchTmdbSeriesEpisodes(entry.tmdbId);
  } catch (error) {
    return tmdbErrorResponse(error);
  }

  if (!episodes.some((episode) => episode.key === parsed.data.episodeKey)) {
    return NextResponse.json({ error: "Die Folge gehört nicht zur aktuellen TMDB-Serienliste." }, { status: 400 });
  }

  const availableKeys = new Set(episodes.map((episode) => episode.key));
  const watchedKeys = new Set(storedKeys.filter((key) => availableKeys.has(key)));
  if (parsed.data.watched) {
    if (parsed.data.markPreviousAsWatched) {
      const episodeIndex = episodes.findIndex((episode) => episode.key === parsed.data.episodeKey);
      for (const episode of episodes.slice(0, episodeIndex)) {
        watchedKeys.add(episode.key);
      }
    }
    watchedKeys.add(parsed.data.episodeKey);
  } else {
    watchedKeys.delete(parsed.data.episodeKey);
  }

  const watchedEpisodeKeys = [...watchedKeys];
  const status = getProgressStatus(episodes.length, watchedEpisodeKeys, "PLANNED");

  const updatedEntry = await prisma.mediaEntry.update({
    where: { id },
    data: { watchedEpisodeKeys: JSON.stringify(watchedEpisodeKeys), status },
  });

  return NextResponse.json({
    watchedEpisodeKeys,
    status: updatedEntry.status,
    totalEpisodes: episodes.length,
  });
}
