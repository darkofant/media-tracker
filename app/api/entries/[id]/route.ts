import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const optionalRatingSchema = z
  .union([z.coerce.number().int().min(1).max(10), z.literal(""), z.null()])
  .optional();

const optionalNumberSchema = z
  .union([z.coerce.number().int().min(0), z.literal(""), z.null()])
  .optional();

const optionalPositiveNumberSchema = z
  .union([z.coerce.number().int().min(1), z.literal(""), z.null()])
  .optional();

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
});

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

  const data = {
    ...parsed.data,
    rating: toNullableInt(parsed.data.rating),
    playtimeMinutes: toNullableInt(parsed.data.playtimeMinutes),
    season: toNullableInt(parsed.data.season),
    episode: toNullableInt(parsed.data.episode),
    watchedAt: parsed.data.watchedAt ? new Date(parsed.data.watchedAt) : null,
  };

  const entry = await prisma.mediaEntry.update({
    where: { id },
    data,
  });

  return NextResponse.json(entry);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await prisma.mediaEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
