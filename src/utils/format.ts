const MONTHS_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agt",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function truncate(text: string, max = 200): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function formatRelativeDate(iso: string, now = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = now.getTime() - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "Baru saja";
  if (diffMs < hour) {
    const n = Math.floor(diffMs / minute);
    return `${n} menit lalu`;
  }
  if (diffMs < day) {
    const n = Math.floor(diffMs / hour);
    return `${n} jam lalu`;
  }
  if (diffMs < 7 * day) {
    const n = Math.floor(diffMs / day);
    return `${n} hari lalu`;
  }

  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  waitMs: number,
): (...args: Parameters<T>) => void {
  let timer = 0;
  return (...args: Parameters<T>) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn(...args);
    }, waitMs);
  };
}
