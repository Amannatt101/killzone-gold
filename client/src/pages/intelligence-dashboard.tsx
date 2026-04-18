import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { IntelligenceDashboard } from "@/components/killzone-v2/IntelligenceDashboard";
import type { SignalData } from "@/components/killzone-v2/signal-types";
import { scoreLabel } from "@/components/killzone-v2/score-utils";
import bakedSignal from "@/data/signal-data.json";

type ScoreApi = {
  regime: string;
  compositeScore?: number;
  lastFetched?: string;
  nextRefresh?: string | null;
};

type HistoryApi = {
  data: { date: string; goldSafeHavenScore: number }[];
};

function safeFixed(v: unknown, d = 2): string {
  if (v != null && typeof v === "number" && !Number.isNaN(v)) return v.toFixed(d);
  return "—";
}

function regimeChipFromString(regime: string): string {
  const r = regime.trim();
  if (r.length <= 24) return r.toUpperCase();
  const words = r.split(/\s+/).slice(0, 3).join(" ");
  return words.toUpperCase();
}

export default function IntelligenceDashboardPage() {
  const { data: liveSignal } = useQuery<SignalData>({
    queryKey: ["/api/signal"],
    refetchInterval: 30 * 60 * 1000,
    staleTime: 60 * 1000,
    retry: false,
  });

  const { data: scoreApi } = useQuery<ScoreApi>({
    queryKey: ["/api/score"],
    refetchInterval: 30 * 60 * 1000,
    staleTime: 60 * 1000,
    retry: false,
  });

  const { data: historyApi } = useQuery<HistoryApi>({
    queryKey: ["/api/history"],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const signal: SignalData = (liveSignal ?? (bakedSignal as SignalData)) as SignalData;

  const scoreSeries = useMemo(() => {
    const rows = historyApi?.data;
    if (!rows?.length) return undefined;
    return rows.slice(-14).map((row) => ({
      d: new Date(row.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      s: Math.round(row.goldSafeHavenScore),
    }));
  }, [historyApi]);

  const regimeLabel = scoreApi?.regime ?? "Neutral — macro context loading";

  const narrative = useMemo(() => {
    const sc = signal.score;
    const sorted = [...signal.reasons]
      .filter((r) => r.impact !== "neutral")
      .sort((a, b) => {
        const as = (a as { score?: number }).score ?? (a.impact === "bullish" ? 75 : 20);
        const bs = (b as { score?: number }).score ?? (b.impact === "bullish" ? 75 : 20);
        return bs - as;
      });
    const topBull = sorted.filter((r) => r.impact === "bullish")[0];
    const topBear = sorted.filter((r) => r.impact === "bearish")[0];

    const primaryTitle = topBull?.factor ?? "Balanced macro";
    const primaryDesc =
      topBull?.detail ??
      "No single bullish factor dominates — conditions are mixed across the model.";
    const opposingTitle = topBear?.factor ?? "Balanced macro";
    const opposingDesc =
      topBear?.detail ??
      "No single bearish factor dominates — watch yields and the dollar for the next swing.";

    const statement =
      sc >= 65 ? (
        <>
          Conditions favour gold on a <span className="em">macro basis</span> — score reflects{" "}
          <span className="em">supportive safe-haven demand</span> with {signal.meta.bullishCount} of 5
          factors leaning your way.
        </>
      ) : sc >= 50 ? (
        <>
          Gold is in a <span className="em">mixed regime</span> — opposing forces are roughly balanced
          and <span className="em">conviction is moderate</span> at {sc.toFixed(0)}%.
        </>
      ) : (
        <>
          The macro backdrop is <span className="em">challenging for gold</span> today —{" "}
          {signal.meta.bearishCount} of 5 factors are working against the safe-haven bid.
        </>
      );

    const sub = `XAU/USD ${safeFixed(signal.gold)} · ${signal.tradeZone}. ${signal.continuation.slice(0, 220)}${signal.continuation.length > 220 ? "…" : ""}`;

    const updatedTs =
      new Date(signal.meta.lastFetched).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      }) + " UTC";

    return {
      updatedTs,
      statement,
      sub,
      primaryTitle,
      primaryDesc,
      opposingTitle,
      opposingDesc,
    };
  }, [signal]);

  const positioning = useMemo(() => {
    const sc = signal.score;
    const title =
      sc >= 65
        ? "Lean long on structure — but size for volatility."
        : sc >= 50
          ? "Stand aside — wait for structure."
          : "Defensive framing — respect the headwinds.";
    const body =
      sc >= 65 ? (
        <>
          The score sits above 65 — macro is{" "}
          <span style={{ color: "var(--bull)" }}>constructive for gold</span>. Define invalidation
          before adding exposure; geopolitical headlines can gap price.
        </>
      ) : sc >= 50 ? (
        <>
          The score sits in the <span style={{ color: "var(--warn)" }}>neutral zone</span>. Opposing
          forces are approximately balanced; conviction here is low-value for directional exposure.
        </>
      ) : (
        <>
          The score is below 50 — treat rallies as{" "}
          <span style={{ color: "var(--bear)" }}>fragile</span> until yields or the dollar turn.
        </>
      );
    return { title, body };
  }, [signal]);

  const topbar = useMemo(() => {
    const priceDisplay = `$${safeFixed(signal.gold)}`;
    const liveLine = `LIVE · ${new Date(signal.meta.lastFetched).toISOString().slice(11, 19)} UTC`;
    return {
      priceDisplay,
      chgClass: "bear" as const,
      chgDisplay: "—",
      score: signal.score,
      scoreTag: `${signal.bias} · ${scoreLabel(signal.score)}`,
      liveLine,
      regimeChip: regimeChipFromString(regimeLabel),
      biasChip: signal.bias,
    };
  }, [signal, regimeLabel]);

  return (
    <IntelligenceDashboard
      signal={signal}
      regimeLabel={regimeLabel}
      nextRefreshIso={scoreApi?.nextRefresh}
      scoreSeries={scoreSeries}
      narrative={narrative}
      positioning={positioning}
      topbar={topbar}
    />
  );
}
