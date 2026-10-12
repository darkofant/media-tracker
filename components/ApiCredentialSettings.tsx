"use client";

import { useEffect, useState } from "react";

import styles from "@/app/page.module.css";

type Provider = "TMDB" | "RAWG" | "OMDB";
type SettingsStatus = {
  encryptionKeyConfigured: boolean;
  providers: Record<Provider, { stored: boolean; environment: boolean }>;
};

const providers: Array<{ id: Provider; label: string; description: string }> = [
  { id: "TMDB", label: "TMDB", description: "Filmsuche, Serien und Episodenfortschritt" },
  { id: "RAWG", label: "RAWG", description: "Spiele-Suche und Import" },
  { id: "OMDB", label: "OMDb", description: "IMDb-Bewertungen für Filme und Serienfolgen" },
];

export function ApiCredentialSettings() {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [values, setValues] = useState<Record<Provider, string>>({ TMDB: "", RAWG: "", OMDB: "" });
  const [busyProvider, setBusyProvider] = useState<Provider | "all" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/settings/credentials", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const result = (await response.json()) as SettingsStatus & { error?: string };
        if (!response.ok) {
          throw new Error(result.error ?? "Einstellungen konnten nicht geladen werden.");
        }
        return result;
      })
      .then(setStatus)
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "Einstellungen konnten nicht geladen werden.");
        }
      });

    return () => controller.abort();
  }, []);

  const save = async () => {
    setBusyProvider("all");
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/settings/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = (await response.json()) as SettingsStatus & { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "API-Schlüssel konnten nicht gespeichert werden.");
      }

      setStatus(result);
      setValues({ TMDB: "", RAWG: "", OMDB: "" });
      setMessage("API-Schlüssel wurden verschlüsselt gespeichert.");
    } catch (saveError: unknown) {
      setError(saveError instanceof Error ? saveError.message : "API-Schlüssel konnten nicht gespeichert werden.");
    } finally {
      setBusyProvider(null);
    }
  };

  const remove = async (provider: Provider) => {
    setBusyProvider(provider);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/settings/credentials?provider=${provider}`, { method: "DELETE" });
      const result = (await response.json()) as SettingsStatus & { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "API-Schlüssel konnten nicht entfernt werden.");
      }

      setStatus(result);
      setMessage(`${provider} wurde aus der Datenbank entfernt.`);
    } catch (removeError: unknown) {
      setError(removeError instanceof Error ? removeError.message : "API-Schlüssel konnten nicht entfernt werden.");
    } finally {
      setBusyProvider(null);
    }
  };

  return (
    <div className={styles.settingsContent}>
      <p className={styles.settingsNotice}>
        Schlüssel werden serverseitig mit AES-256-GCM verschlüsselt gespeichert. Sie werden beim Speichern nicht
        erneut angezeigt. Diese App hat keine Anmeldung; nutze sie nur in einem vertrauenswürdigen Netzwerk.
      </p>

      {!status?.encryptionKeyConfigured ? (
        <section className={styles.settingsNotice}>
          <strong>Verschlüsselungsschlüssel erforderlich</strong>
          <p>
            Erzeuge einen Schlüssel mit
            {" "}
            <code>node -e &quot;console.log(require(&apos;node:crypto&apos;).randomBytes(32).toString(&apos;base64&apos;))&quot;</code>,
            trage ihn in `.env` als `SETTINGS_ENCRYPTION_KEY=&quot;...&quot;` ein und starte die App neu.
          </p>
        </section>
      ) : null}

      {providers.map((provider) => {
        const configured = status?.providers[provider.id];
        const source = configured?.stored
          ? "Verschlüsselt in der Datenbank gespeichert"
          : configured?.environment
            ? "Über .env eingerichtet"
            : "Nicht eingerichtet";

        return (
          <section key={provider.id} className={styles.settingsProvider}>
            <div>
              <h2>{provider.label}</h2>
              <p>{provider.description}</p>
              <span>{source}</span>
            </div>
            <label className={styles.settingsKeyField} htmlFor={`key-${provider.id}`}>
              API-Schlüssel
              <input
                id={`key-${provider.id}`}
                type="password"
                autoComplete="new-password"
                value={values[provider.id]}
                onChange={(event) =>
                  setValues((current) => ({ ...current, [provider.id]: event.target.value }))
                }
                placeholder="Einfügen, um zu speichern"
                disabled={!status?.encryptionKeyConfigured || busyProvider !== null}
              />
            </label>
            {configured?.stored ? (
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => void remove(provider.id)}
                disabled={busyProvider !== null}
              >
                {busyProvider === provider.id ? "Entfernen..." : "Gespeicherten Schlüssel entfernen"}
              </button>
            ) : null}
          </section>
        );
      })}

      <button
        type="button"
        className={styles.primaryButton}
        onClick={() => void save()}
        disabled={!status?.encryptionKeyConfigured || busyProvider !== null || !Object.values(values).some(Boolean)}
      >
        {busyProvider === "all" ? "Speichern..." : "API-Schlüssel speichern"}
      </button>
      {message ? <p role="status" className={styles.successMessage}>{message}</p> : null}
      {error ? <p role="alert" className={styles.errorBanner}>{error}</p> : null}
    </div>
  );
}
