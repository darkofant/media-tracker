import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

export type ApiProvider = "TMDB" | "RAWG" | "OMDB";

const environmentVariableByProvider: Record<ApiProvider, string> = {
  TMDB: "TMDB_API_KEY",
  RAWG: "RAWG_API_KEY",
  OMDB: "OMDB_API_KEY",
};

function getEncryptionKey(): Buffer {
  const configuredKey = process.env.SETTINGS_ENCRYPTION_KEY;
  if (!configuredKey) {
    throw new Error("SETTINGS_ENCRYPTION_KEY ist nicht gesetzt. Folge der Anleitung auf der Einstellungsseite.");
  }

  const key = Buffer.from(configuredKey, "base64");
  if (key.length !== 32) {
    throw new Error("SETTINGS_ENCRYPTION_KEY muss ein Base64-kodierter 32-Byte-Schlüssel sein.");
  }

  return key;
}

export function isEncryptionKeyConfigured(): boolean {
  const configuredKey = process.env.SETTINGS_ENCRYPTION_KEY;
  return Boolean(configuredKey && Buffer.from(configuredKey, "base64").length === 32);
}

export function encryptApiCredential(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64")).join(".");
}

function decryptApiCredential(value: string): string {
  const [encodedIv, encodedTag, encodedValue] = value.split(".");
  if (!encodedIv || !encodedTag || encodedValue === undefined) {
    throw new Error("Gespeicherte API-Zugangsdaten sind ungültig.");
  }

  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(encodedIv, "base64"));
  decipher.setAuthTag(Buffer.from(encodedTag, "base64"));

  try {
    return Buffer.concat([
      decipher.update(Buffer.from(encodedValue, "base64")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new Error("API-Zugangsdaten können nicht entschlüsselt werden. Prüfe SETTINGS_ENCRYPTION_KEY.");
  }
}

export async function getApiCredential(provider: ApiProvider): Promise<string> {
  const storedCredential = await prisma.apiCredential.findUnique({ where: { provider } });
  if (storedCredential) {
    return decryptApiCredential(storedCredential.encryptedValue);
  }

  const value = process.env[environmentVariableByProvider[provider]];
  if (!value) {
    throw new Error(`${environmentVariableByProvider[provider]} ist nicht eingerichtet.`);
  }

  return value;
}

export async function getApiCredentialStatuses() {
  const storedCredentials = await prisma.apiCredential.findMany({
    select: { provider: true },
  });
  const storedProviders = new Set(storedCredentials.map(({ provider }) => provider));

  return {
    encryptionKeyConfigured: isEncryptionKeyConfigured(),
    providers: Object.fromEntries(
      (Object.keys(environmentVariableByProvider) as ApiProvider[]).map((provider) => [
        provider,
        {
          stored: storedProviders.has(provider),
          environment: Boolean(process.env[environmentVariableByProvider[provider]]),
        },
      ]),
    ) as Record<ApiProvider, { stored: boolean; environment: boolean }>,
  };
}
