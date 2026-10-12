const playtimeHoursPattern = /^\d+(?:[.,]\d{1,2})?$/;

export function isValidPlaytimeHours(value: string) {
  return value === "" || playtimeHoursPattern.test(value);
}

export function playtimeHoursToMinutes(value: string) {
  if (value === "") {
    return null;
  }
  if (!isValidPlaytimeHours(value)) {
    throw new Error("Bitte die Spielzeit in Stunden eingeben, zum Beispiel 2,5.");
  }

  return Math.round(Number(value.replace(",", ".")) * 60);
}

export function formatPlaytimeHours(minutes: number) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 }).format(minutes / 60);
}
