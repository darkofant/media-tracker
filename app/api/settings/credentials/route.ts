import { NextResponse } from "next/server";
import { z } from "zod";

import {
  encryptApiCredential,
  getApiCredentialStatuses,
  type ApiProvider,
} from "@/lib/api-credentials";
import { prisma } from "@/lib/prisma";

const credentialFields = ["TMDB", "RAWG", "OMDB"] as const;
const credentialsSchema = z.object({
  TMDB: z.string().trim().max(4096).optional(),
  RAWG: z.string().trim().max(4096).optional(),
  OMDB: z.string().trim().max(4096).optional(),
}).strict();
const providerSchema = z.enum(credentialFields);

function rejectCrossOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  let isSameOrigin = false;
  try {
    isSameOrigin = Boolean(origin && new URL(origin).origin === new URL(request.url).origin);
  } catch {
    isSameOrigin = false;
  }

  if (!isSameOrigin) {
    return NextResponse.json({ error: "Ungültige Herkunft der Anfrage." }, { status: 403 });
  }

  return null;
}

export async function GET() {
  return NextResponse.json(await getApiCredentialStatuses(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) {
    return originError;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Anfragetext." }, { status: 400 });
  }

  const parsed = credentialsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Ungültige API-Schlüssel.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const credentials = Object.entries(parsed.data).filter(([, value]) => Boolean(value)) as [ApiProvider, string][];
  if (credentials.length === 0) {
    return NextResponse.json({ error: "Gib mindestens einen API-Schlüssel ein." }, { status: 400 });
  }

  try {
    await prisma.$transaction(
      credentials.map(([provider, value]) => {
        const encryptedValue = encryptApiCredential(value);
        return prisma.apiCredential.upsert({
          where: { provider },
          create: { provider, encryptedValue },
          update: { encryptedValue },
        });
      }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "API-Schlüssel konnten nicht gespeichert werden.";
    const status = message.startsWith("SETTINGS_ENCRYPTION_KEY") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }

  return NextResponse.json(await getApiCredentialStatuses(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function DELETE(request: Request) {
  const originError = rejectCrossOriginRequest(request);
  if (originError) {
    return originError;
  }

  const parsed = providerSchema.safeParse(new URL(request.url).searchParams.get("provider"));
  if (!parsed.success) {
    return NextResponse.json({ error: "Ungültiger API-Anbieter." }, { status: 400 });
  }

  await prisma.apiCredential.deleteMany({ where: { provider: parsed.data } });
  return NextResponse.json(await getApiCredentialStatuses(), {
    headers: { "Cache-Control": "no-store" },
  });
}
