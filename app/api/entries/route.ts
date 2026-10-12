import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { isPlatformAllowed } from "@/lib/platforms";

const mediaTypeSchema = z.enum(["MOVIE", "SERIES", "GAME"]);
const mediaStatusSchema = z.enum(["PLANNED", "WATCHING", "COMPLETED", "ABANDONED"]);

const optionalRatingSchema = z
  .union([z.coerce.number().int().min(1).max(5), z.literal(""), z.null()])
  .optional();

const optionalNumberSchema = z
  .union([z.coerce.number().int().min(0), z.literal(""), z.null()])
  .optional();

const optionalPositiveNumberSchema = z
  .union([z.coerce.number().int().min(1), z.literal(""), z.null()])
  .optional();

const entrySchema = z.object({
  title: z.string().trim().min(1, "Titel ist erforderlich."),
  type: mediaTypeSchema,
  status: mediaStatusSchema,
  rating: optionalRatingSchema,
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  coverUrl: z.string().optional().nullable(),
  watchedAt: z.string().optional().nullable(),
  platform: z.string().optional().nullable(),
  playtimeMinutes: optionalNumberSchema,
  season: optionalPositiveNumberSchema,
  episode: optionalPositiveNumberSchema,
  tmdbId: z.number().int().positive().optional().nullable(),
});

const toNullableInt = (value: number | string | null | undefined) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export async function GET() {
  const entries = await prisma.mediaEntry.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = entrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (parsed.data.type === "SERIES" && parsed.data.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Serien werden über die abgehakten Folgen abgeschlossen." },
      { status: 400 },
    );
  }

  if (parsed.data.type === "GAME" && parsed.data.status === "WATCHING") {
    return NextResponse.json(
      { error: "Spiele können nicht den Status „Gesehen, nicht abgeschlossen“ haben." },
      { status: 400 },
    );
  }

  if (!isPlatformAllowed(parsed.data.type, parsed.data.platform)) {
    return NextResponse.json(
      { error: "Bitte wähle eine Plattform, die zum Medientyp passt." },
      { status: 400 },
    );
  }

  const entry = await prisma.mediaEntry.create({
    data: {
      ...parsed.data,
      status: parsed.data.type === "MOVIE" && parsed.data.status === "WATCHING" ? "COMPLETED" : parsed.data.status,
      rating: toNullableInt(parsed.data.rating),
      playtimeMinutes: toNullableInt(parsed.data.playtimeMinutes),
      season: toNullableInt(parsed.data.season),
      episode: toNullableInt(parsed.data.episode),
      watchedAt: parsed.data.watchedAt ? new Date(parsed.data.watchedAt) : null,
    },
  });

  return NextResponse.json(entry, { status: 201 });
}
