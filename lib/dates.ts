export function parseDateInput(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }

  return date;
}

export function formatDateInput(value: Date | string | null | undefined): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

export function formatDateDisplay(value: Date | string | null | undefined): string {
  const dateInput = formatDateInput(value);
  if (!dateInput) {
    return "Noch kein Datum";
  }

  const date = parseDateInput(dateInput);
  return date?.toLocaleDateString("de-DE", { timeZone: "UTC" }) ?? "Noch kein Datum";
}

export function todayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
