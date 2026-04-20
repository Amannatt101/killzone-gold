import { formatGmtPlus1DateTime, GMT_PLUS_ONE_LABEL } from "@/lib/timezone";

export function scoreLabel(s: number): string {
  if (s >= 75) return "STRONG CONVICTION";
  if (s >= 65) return "HIGH";
  if (s >= 50) return "NEUTRAL";
  if (s >= 35) return "LOW";
  return "WEAK";
}

export function formatUtcShort(iso: string): string {
  try {
    return `${formatGmtPlus1DateTime(iso, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })} ${GMT_PLUS_ONE_LABEL}`;
  } catch {
    return "—";
  }
}

export function formatNextRefresh(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const now = Date.now();
    const ms = Math.max(0, d.getTime() - now);
    const m = Math.floor(ms / 60000);
    const h = Math.floor(m / 60);
    const mm = m % 60;
    if (h > 0) return `${h}h ${mm}m`;
    return `${mm}m`;
  } catch {
    return "—";
  }
}
