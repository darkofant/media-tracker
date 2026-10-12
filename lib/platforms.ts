export const platformOptionsByType = {
  MOVIE: ["Netflix", "Prime Video", "Disney+", "Apple TV+", "Sky", "Max", "YouTube", "Kino"],
  SERIES: ["Netflix", "Prime Video", "Disney+", "Apple TV+", "Sky", "Max", "YouTube", "Kino"],
  GAME: ["Steam", "PlayStation", "Xbox", "Nintendo Switch"],
} as const;

export type MediaType = keyof typeof platformOptionsByType;

export function isPlatformAllowed(type: string, platform: string | null | undefined): boolean {
  if (!platform) {
    return true;
  }

  return type in platformOptionsByType &&
    (platformOptionsByType[type as MediaType] as readonly string[]).includes(platform);
}

export function getExclusiveTmdbPlatform(providerIds: number[] | undefined): string | null {
  if (providerIds?.length !== 1) {
    return null;
  }

  const platformsByProviderId: Record<number, string> = {
    8: "Netflix",
    9: "Prime Video",
    29: "Sky",
    30: "Sky",
    188: "YouTube",
    337: "Disney+",
    350: "Apple TV+",
    1899: "Max",
  };

  return platformsByProviderId[providerIds[0]] ?? null;
}

export function getExclusiveRawgPlatform(platformNames: string[] | undefined): string | null {
  if (!platformNames?.length) {
    return null;
  }

  const platforms = platformNames.map((name) => {
    if (/^(pc|windows|linux|macos)$/i.test(name)) {
      return "Steam";
    }
    if (/^playstation\b/i.test(name)) {
      return "PlayStation";
    }
    if (/^xbox\b/i.test(name)) {
      return "Xbox";
    }
    if (/^(nintendo switch|switch)$/i.test(name)) {
      return "Nintendo Switch";
    }
    return null;
  });

  if (platforms.some((platform) => platform === null)) {
    return null;
  }

  const uniquePlatforms = new Set(platforms);
  return uniquePlatforms.size === 1 ? platforms[0] : null;
}

export function getPlatformMark(platform: string): string {
  const marks: Record<string, string> = {
    Netflix: "N",
    "Prime Video": "prime",
    "Disney+": "D+",
    "Apple TV+": "tv+",
    Sky: "sky",
    Max: "max",
    YouTube: "▶",
    Kino: "▶",
    Steam: "S",
    PlayStation: "PS",
    Xbox: "X",
    "Nintendo Switch": "NS",
  };

  return marks[platform] ?? platform.slice(0, 2).toUpperCase();
}
