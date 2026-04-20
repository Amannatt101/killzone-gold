import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { IntelligenceDashboard } from "@/components/killzone-v2/IntelligenceDashboard";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { SignalData } from "@/components/killzone-v2/signal-types";
import { buildDominanceFromComponents, scoreLabel } from "@/components/killzone-v2/score-utils";
import bakedSignal from "@/data/signal-data.json";
import { apiRequest } from "@/lib/queryClient";
import { REACTIVE_REFRESH_MS } from "@/lib/refresh";
import { formatGmtPlus1DateTime, formatGmtPlus1Time, GMT_PLUS_ONE_LABEL } from "@/lib/timezone";
import { RefreshCw } from "lucide-react";

type ScoreApi = {
  regime: string;
  compositeScore?: number;
  lastFetched?: string;
  nextRefresh?: string | null;
  components?: {
    name: string;
    score: number;
    weight: number;
    contribution: number;
  }[];
  current?: {
    realYield?: number;
    vix?: number;
    usdBroad?: number;
    gpr?: number;
    goldSafeHavenScore?: number;
  };
  sources?: {
    fred?: boolean;
    yahoo?: boolean;
    gpr?: boolean;
  };
};

type HistoryApi = {
  data: { date: string; goldSafeHavenScore: number }[];
};

type ScoreLogApi = {
  entries: {
    timestamp: string;
    score: number;
    goldClose: number;
    delta: number;
  }[];
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
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const { data: liveSignal } = useQuery<SignalData>({
    queryKey: ["/api/signal"],
    refetchInterval: REACTIVE_REFRESH_MS,
    staleTime: 60 * 1000,
    retry: false,
  });

  const { data: scoreApi } = useQuery<ScoreApi>({
    queryKey: ["/api/score"],
    refetchInterval: REACTIVE_REFRESH_MS,
    staleTime: 60 * 1000,
    retry: false,
  });

  const { data: historyApi } = useQuery<HistoryApi>({
    queryKey: ["/api/history"],
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const { data: scoreLogApi } = useQuery<ScoreLogApi>({
    queryKey: ["/api/score-log"],
    refetchInterval: REACTIVE_REFRESH_MS,
    staleTime: 60 * 1000,
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

  const scoreShifts = useMemo(() => {
    if (!scoreSeries?.length || scoreSeries.length < 4) return undefined;
    const window = Math.max(2, Math.floor(scoreSeries.length / 4));
    const shifts: { from: string; to: string; chg: number; kind: "up" | "down" | "flat"; reason: string }[] =
      [];
    for (let i = 0; i < scoreSeries.length - 1; i += window) {
      const start = scoreSeries[i];
      const end = scoreSeries[Math.min(scoreSeries.length - 1, i + window)];
      if (!start || !end || start === end) continue;
      const chg = Math.round((end.s - start.s) * 10) / 10;
      shifts.push({
        from: start.d,
        to: end.d,
        chg,
        kind: chg > 0 ? "up" : chg < 0 ? "down" : "flat",
        reason:
          chg > 0
            ? "Composite score strengthened through this window as supportive factors gained weight."
            : chg < 0
              ? "Composite score weakened through this window as headwinds outweighed support."
              : "Composite score stayed broadly flat with no dominant macro shift.",
      });
    }
    return shifts.slice(-4);
  }, [scoreSeries]);

  const regimeLabel = scoreApi?.regime ?? "Neutral — macro context loading";

  const regimeMetrics = useMemo(() => {
    const c = scoreApi?.current;
    return [
      {
        label: "Real Yield",
        value: c?.realYield != null ? `${c.realYield.toFixed(2)}%` : "—",
        sub: "live macro feed",
      },
      {
        label: "VIX",
        value: c?.vix != null ? c.vix.toFixed(1) : "—",
        sub: "risk proxy",
      },
      {
        label: "USD Broad",
        value: c?.usdBroad != null ? c.usdBroad.toFixed(1) : "—",
        sub: "dollar pressure",
      },
    ];
  }, [scoreApi]);

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

    const updatedTs = `${formatGmtPlus1DateTime(signal.meta.lastFetched, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })} ${GMT_PLUS_ONE_LABEL}`;

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

  const invalidationRows = useMemo(() => {
    const c = scoreApi?.current;
    const rows: {
      trigger: ReactNode;
      exp: string;
      status: "near" | "armed" | "remote";
      statusLbl: string;
    }[] = [
      {
        trigger: (
          <>
            Real yields rise above <span className="num">2.00%</span> from current{" "}
            <span className="num">{c?.realYield != null ? `${c.realYield.toFixed(2)}%` : "—"}</span>
          </>
        ),
        exp: "Higher real yields increase carry pressure on non-yielding gold and weaken safe-haven score.",
        status: c?.realYield != null && c.realYield >= 1.9 ? "near" : "armed",
        statusLbl: c?.realYield != null && c.realYield >= 1.9 ? "NEAR" : "ARMED",
      },
      {
        trigger: (
          <>
            USD broad index pushes above <span className="num">108.50</span> from{" "}
            <span className="num">{c?.usdBroad != null ? c.usdBroad.toFixed(2) : "—"}</span>
          </>
        ),
        exp: "Dollar strength typically tightens financial conditions and caps upside in gold.",
        status: c?.usdBroad != null && c.usdBroad >= 107.8 ? "near" : "armed",
        statusLbl: c?.usdBroad != null && c.usdBroad >= 107.8 ? "NEAR" : "ARMED",
      },
      {
        trigger: (
          <>
            VIX drops under <span className="num">16</span> from{" "}
            <span className="num">{c?.vix != null ? c.vix.toFixed(1) : "—"}</span>
          </>
        ),
        exp: "If fear premium fades, safe-haven demand for gold can compress quickly.",
        status: c?.vix != null && c.vix <= 17 ? "near" : "remote",
        statusLbl: c?.vix != null && c.vix <= 17 ? "NEAR" : "REMOTE",
      },
    ];
    return rows;
  }, [scoreApi]);

  const sessionStats = useMemo(() => {
    const entries = scoreLogApi?.entries;
    if (!entries || entries.length < 3) return undefined;
    const windows = [
      { name: "Asia", start: 0, end: 8 },
      { name: "London", start: 7, end: 15 },
      { name: "New York", start: 13, end: 21 },
    ];
    const out: Record<string, string> = {};
    for (const w of windows) {
      const moves: number[] = [];
      for (let i = 1; i < entries.length; i++) {
        const prev = entries[i - 1];
        const cur = entries[i];
        const h = new Date(cur.timestamp).getUTCHours();
        if (h >= w.start && h < w.end && prev.goldClose > 0) {
          moves.push(Math.abs(((cur.goldClose - prev.goldClose) / prev.goldClose) * 100));
        }
      }
      const avg = moves.length
        ? moves.reduce((s, v) => s + v, 0) / moves.length
        : 0;
      out[w.name] = `Avg range · ${avg.toFixed(2)}%`;
    }
    return out;
  }, [scoreLogApi]);

  const topbar = useMemo(() => {
    const priceDisplay = `$${safeFixed(signal.gold)}`;
    const liveLine = `LIVE · ${formatGmtPlus1Time(signal.meta.lastFetched, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })} ${GMT_PLUS_ONE_LABEL}`;
    const entries = scoreLogApi?.entries;
    let chgDisplay = "—";
    let chgClass: "bull" | "bear" = "bear";
    if (entries && entries.length >= 2) {
      const prev = entries[entries.length - 2].goldClose;
      const cur = entries[entries.length - 1].goldClose;
      if (prev > 0) {
        const pct = ((cur - prev) / prev) * 100;
        chgDisplay = `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`;
        chgClass = pct >= 0 ? "bull" : "bear";
      }
    }
    return {
      priceDisplay,
      chgClass,
      chgDisplay,
      score: signal.score,
      scoreTag: `${signal.bias} · ${scoreLabel(signal.score)}`,
      liveLine,
      regimeChip: regimeChipFromString(regimeLabel),
      biasChip: signal.bias,
    };
  }, [signal, regimeLabel, scoreLogApi]);

  const dominance = useMemo(
    () =>
      buildDominanceFromComponents({
        score: signal.score,
        components: scoreApi?.components,
      }),
    [signal.score, scoreApi?.components],
  );

  const scoreLastChangedIso = useMemo(() => {
    const entries = scoreLogApi?.entries;
    if (!entries?.length) return signal.meta.lastFetched;
    const current = entries[entries.length - 1]?.score;
    if (typeof current !== "number") return signal.meta.lastFetched;

    const epsilon = 0.05;
    let startOfCurrentRun = entries.length - 1;
    for (let i = entries.length - 2; i >= 0; i--) {
      const v = entries[i]?.score;
      if (typeof v !== "number") continue;
      if (Math.abs(v - current) <= epsilon) {
        startOfCurrentRun = i;
      } else {
        break;
      }
    }
    return entries[startOfCurrentRun]?.timestamp ?? signal.meta.lastFetched;
  }, [scoreLogApi, signal.meta.lastFetched]);

  async function refreshAllData(): Promise<void> {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await apiRequest("POST", "/api/refresh");
      await queryClient.invalidateQueries();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <IntelligenceDashboard
      signal={signal}
      regimeLabel={regimeLabel}
      nextRefreshIso={scoreApi?.nextRefresh}
      scoreSeries={scoreSeries}
      scoreShifts={scoreShifts}
      invalidationRows={invalidationRows}
      sessionStats={sessionStats}
      regimeMetrics={regimeMetrics}
      narrative={narrative}
      positioning={positioning}
      scoreLastChangedIso={scoreLastChangedIso}
      dominance={dominance}
      topbar={topbar}
      topbarExtra={
        <>
          <button
            type="button"
            onClick={refreshAllData}
            disabled={refreshing}
            className="inline-flex items-center gap-1 rounded border border-[var(--line-1)] bg-[var(--bg-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-2)] hover:bg-[var(--bg-3)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing..." : "Refresh"}
          </button>
          <LogoutButton />
        </>
      }
    />
  );
}
