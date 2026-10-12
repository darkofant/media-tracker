"use client";

import { useEffect, useState } from "react";
import { ImdbRatingBadge } from "@/components/ImdbRatingBadge";

type ImdbRatingProps = {
  entryId: string;
};

type ImdbRatingResponse = {
  rating?: number | null;
  error?: string;
};

export function ImdbRating({ entryId }: ImdbRatingProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/entries/${entryId}/imdb-rating`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as ImdbRatingResponse;
        if (!response.ok) {
          throw new Error(data.error ?? "IMDb-Bewertung konnte nicht geladen werden.");
        }
        setRating(data.rating ?? null);
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : "IMDb-Bewertung konnte nicht geladen werden.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, [entryId]);

  if (isLoading) {
    return <ImdbRatingBadge rating={null} />;
  }

  if (error) {
    return <span role="status">IMDb-Bewertung nicht verfügbar: {error}</span>;
  }

  return <ImdbRatingBadge rating={rating} />;
}
