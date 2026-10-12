import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { isPlatformAllowed } from "@/lib/platforms";

const optionalRatingSchema = z
  .union([z.coerce.number().int().min(1).max(5), z.literal(""), z.null()])
  .optional();

const optionalNumberSchema = z
  .union([z.coerce.number().int().min(0), z.literal(""), z.null()])
  .optional();

const optionalPositiveNumberSchema = z
  .union([z.coerce.number().int().min(1), z.literal(""), z.null()])
  .optional();

const optionalTmdbIdSchema = z.number().int().positive().nullable().optional();

const entrySchema = z.object({
  title: z.string().trim().min(1, "Titel ist erforderlich."),
  type: z.enum(["MOVIE", "SERIES", "GAME"]),
  status: z.enum(["PLANNED", "WATCHING", "COMPLETED", "ABANDONED"]),
  rating: optionalRatingSchema,
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  watchedAt: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  playtimeMinutes: optionalNumberSchema,
  season: optionalPositiveNumberSchema,
  episode: optionalPositiveNumberSchema,
  tmdbId: optionalTmdbIdSchema,
});

const quickUpdateSchema = entrySchema
  .pick({
    status: true,
    rating: true,
    playtimeMinutes: true,
    tmdbId: true,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, "Mindestens ein Feld muss angegeben werden.");

const toNullableInt = (value: number | string | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const entry = await prisma.mediaEntry.findUnique({ where: { id } });

  if (!entry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.json();
  const parsed = entrySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validierung fehlgeschlagen",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (!isPlatformAllowed(parsed.data.type, parsed.data.platform)) {
    return NextResponse.json(
      { error: "Bitte wähle eine Plattform, die zum Medientyp passt." },
      { status: 400 },
    );
  }

  if (parsed.data.type === "GAME" && parsed.data.status === "WATCHING") {
    return NextResponse.json(
      { error: "Spiele können nicht den Status „Gesehen, nicht abgeschlossen“ haben." },
      { status: 400 },
    );
  }

  const currentEntry = await prisma.mediaEntry.findUnique({ where: { id } });

  if (!currentEntry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  const isSameSeries = currentEntry.type === "SERIES" && parsed.data.type === "SERIES";
  const preservesTmdbLink =
    currentEntry.type === parsed.data.type && ["MOVIE", "SERIES"].includes(parsed.data.type);
  const status = isSameSeries
    ? currentEntry.status
    : parsed.data.type === "SERIES"
      ? "PLANNED"
      : parsed.data.type === "MOVIE" && parsed.data.status === "WATCHING"
        ? "COMPLETED"
        : parsed.data.status;

  const updatedEntry = await prisma.mediaEntry.update({
    where: { id },
    data: {
      ...parsed.data,
      status,
      rating: toNullableInt(parsed.data.rating),
      playtimeMinutes: toNullableInt(parsed.data.playtimeMinutes),
      season: toNullableInt(parsed.data.season),
      episode: toNullableInt(parsed.data.episode),
      watchedAt: parsed.data.watchedAt ? new Date(parsed.data.watchedAt) : null,
      ...(!preservesTmdbLink && { tmdbId: null, watchedEpisodeKeys: "[]" }),
    },
  });

  return NextResponse.json(updatedEntry);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await request.json();
  const parsed = quickUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validierung fehlgeschlagen",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const currentEntry = await prisma.mediaEntry.findUnique({ where: { id } });

  if (!currentEntry) {
    return NextResponse.json({ error: "Eintrag nicht gefunden." }, { status: 404 });
  }

  if (parsed.data.tmdbId !== undefined && !["MOVIE", "SERIES"].includes(currentEntry.type)) {
    return NextResponse.json({ error: "Nur Filme und Serien können mit TMDB verknüpft werden." }, { status: 400 });
  }

  if (currentEntry.type === "SERIES" && parsed.data.status !== undefined) {
    return NextResponse.json(
      { error: "Der Serienstatus wird automatisch aus den abgehakten Folgen berechnet." },
      { status: 400 },
    );
  }

  if (currentEntry.type === "GAME" && parsed.data.status === "WATCHING") {
    return NextResponse.json(
      { error: "Spiele können nicht den Status „Gesehen, nicht abgeschlossen“ haben." },
      { status: 400 },
    );
  }

  const isRelinkingSeries =
    currentEntry.type === "SERIES" &&
    parsed.data.tmdbId !== undefined &&
    parsed.data.tmdbId !== currentEntry.tmdbId;

  const entry = await prisma.mediaEntry.update({
    where: { id },
    data: {
      ...(parsed.data.status !== undefined && {
        status: currentEntry.type === "MOVIE" && parsed.data.status === "WATCHING" ? "COMPLETED" : parsed.data.status,
      }),
      ...(parsed.data.tmdbId !== undefined && { tmdbId: parsed.data.tmdbId }),
      ...(isRelinkingSeries && { status: "PLANNED", watchedEpisodeKeys: "[]" }),
      ...(Object.hasOwn(parsed.data, "rating") && { rating: toNullableInt(parsed.data.rating) }),
      ...(Object.hasOwn(parsed.data, "playtimeMinutes") && {
        playtimeMinutes: toNullableInt(parsed.data.playtimeMinutes),
      }),
    },
  });

  return NextResponse.json(entry);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.mediaEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
