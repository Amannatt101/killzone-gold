import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";
import { IntelligenceDashboard } from "@/components/killzone-v2/IntelligenceDashboard";
import { LogoutButton } from "@/components/auth/LogoutButton";
import type { MarketNarrativeSlide } from "@/components/killzone-v2/widgets/LiveMarketNarrativeCarousel";
import type { SignalData } from "@/components/killzone-v2/signal-types";
import { buildDominanceFromComponents, scoreLabel } from "@/components/killzone-v2/score-utils";
import bakedSignal from "@/data/signal-data.json";
import { apiRequest } from "@/lib/queryClient";
import { REACTIVE_REFRESH_MS } from "@/lib/refresh";
import { formatGmtPlus1Time, GMT_PLUS_ONE_LABEL } from "@/lib/timezone";
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

type HourlySentimentApi = {
  timezone: "Europe/London";
  generatedAt: string;
  days: {
    date: string;
    label: string;
    points: {
      time: string;
      bullishPct: number | null;
      bearishPct: number | null;
      score: number | null;
      capturedAt: string | null;
    }[];
  }[];
};

type ScoreLogApi = {
  entries: {
    timestamp: string;
    score: number;
    goldClose: number;
    delta: number;
  }[];
};

type MarketNarrativesApi = {
  updatedAt: string;
  changed: boolean;
  slides: MarketNarrativeSlide[];
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

function buildFallbackNarrativeSlides(
  signal: SignalData,
  scoreApi?: ScoreApi
): MarketNarrativeSlide[] {
  const reasons = signal.reasons ?? [];
  const bullish = reasons.filter((r) => r.impact === "bullish").length;
  const bearish = reasons.filter((r) => r.impact === "bearish").length;
  const neutral = reasons.filter((r) => r.impact === "neutral").length;
  const topBull = reasons.find((r) => r.impact === "bullish");
  const topBear = reasons.find((r) => r.impact === "bearish");
  const bias: "Bullish" | "Bearish" | "Neutral" =
    signal.score >= 65 ? "Bullish" : signal.score <= 35 ? "Bearish" : "Neutral";

  const macroText =
    bias === "Bullish"
      ? "Gold is holding with a constructive macro tilt as defensive flows remain active. Dollar and yield pressure are not dominant enough to break the bid."
      : bias === "Bearish"
      ? "Gold is facing macro headwinds as opportunity-cost pressure remains elevated. Without softer yields or dollar relief, upside is likely to stay capped."
      : "Macro inputs are mixed and conviction is moderate. Gold remains sensitive to the next directional move in rates and broad dollar trend.";

  return [
    {
      id: "gold",
      title: "BREAKING: Gold price flow update",
      metrics: [
        { label: "Gold", value: `$${safeFixed(signal.gold)}` },
        { label: "Real Yield", value: scoreApi?.current?.realYield != null ? `${scoreApi.current.realYield.toFixed(2)}%` : "—" },
      ],
      text: macroText,
      updatedLabel: `Updated ${signal.meta.updatedAgo}`,
      bias,
      impact: "Medium impact",
      tags: [bias === "Bullish" ? "Bullish for gold" : bias === "Bearish" ? "Bearish for gold" : "Neutral"],
      imageUrl:
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Macro market chart screen",
      freshness: { market: signal.meta.updatedAgo, news: "n/a" },
    },
    {
      id: "yields",
      title: "YIELDS WATCH: Live rates pulse",
      metrics: [
        { label: "Drivers", value: `${bullish} bull / ${bearish} bear` },
        { label: "Neutral", value: String(neutral) },
      ],
      text: topBull
        ? `Headline-style flow still leans toward ${topBull.factor.toLowerCase()}. Keep watching for confirmation from rates and dollar reaction before extending risk.`
        : "No single headline catalyst is dominating right now. Market reaction remains more data-driven than event-driven in this cycle.",
      updatedLabel: `Updated ${signal.meta.updatedAgo}`,
      bias,
      impact: "Medium impact",
      tags: [bias === "Bullish" ? "Bullish for gold" : bias === "Bearish" ? "Bearish for gold" : "Neutral"],
      imageUrl:
        "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Financial news desk and headlines",
      freshness: { market: signal.meta.updatedAgo, news: "n/a" },
    },
    {
      id: "dollar",
      title: "DOLLAR TRACKER: FX pressure check",
      metrics: [
        { label: "Score", value: signal.score.toFixed(1) },
        { label: "Trade Zone", value: signal.tradeZone },
      ],
      text: topBear
        ? `Positioning reflects pressure from ${topBear.factor.toLowerCase()} while support remains selective. The current score suggests tactical rather than trend conviction.`
        : "Positioning remains balanced without a dominant opposing force. Score structure favors selective setups over aggressive directional positioning.",
      updatedLabel: `Updated ${signal.meta.updatedAgo}`,
      bias,
      impact: "Medium impact",
      tags: [bias === "Bullish" ? "Bullish for gold" : bias === "Bearish" ? "Bearish for gold" : "Neutral"],
      imageUrl:
        "https://images.unsplash.com/photo-1642790551116-18e150f248e3?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Technical trading chart analysis",
      freshness: { market: signal.meta.updatedAgo, news: "n/a" },
    },
    {
      id: "risk",
      title: "MACRO ALERT: Risk and event flow",
      metrics: [
        { label: "Bias", value: bias },
        { label: "Next", value: signal.tradeZone },
      ],
      text: signal.continuation,
      updatedLabel: `Updated ${signal.meta.updatedAgo}`,
      bias,
      impact: "Medium impact",
      tags: [bias === "Bullish" ? "Bullish for gold" : bias === "Bearish" ? "Bearish for gold" : "Neutral"],
      imageUrl:
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
      imageAlt: "Strategic planning and market outlook",
      freshness: { market: signal.meta.updatedAgo, news: "n/a" },
    },
  ];
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

  const { data: hourlySentimentApi } = useQuery<HourlySentimentApi>({
    queryKey: ["/api/hourly-sentiment?days=7"],
    refetchInterval: REACTIVE_REFRESH_MS,
    staleTime: 60 * 1000,
    retry: false,
  });
  const { data: scoreLogApi } = useQuery<ScoreLogApi>({
    queryKey: ["/api/score-log"],
    refetchInterval: REACTIVE_REFRESH_MS,
    staleTime: 60 * 1000,
    retry: false,
  });
  const { data: narrativeApi } = useQuery<MarketNarrativesApi>({
    queryKey: ["/api/market-narratives"],
    refetchInterval: 90 * 1000,
    staleTime: 60 * 1000,
    retry: false,
  });

  const signal: SignalData = (liveSignal ?? (bakedSignal as SignalData)) as SignalData;

  const hourlySentimentDays = useMemo(
    () =>
      hourlySentimentApi?.days?.map((day) => ({
        date: day.date,
        label: day.label,
        points: [...day.points].sort((a, b) => a.time.localeCompare(b.time)),
      })),
    [hourlySentimentApi?.days],
  );

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

  const narrativeSlides = useMemo(() => {
    const liveSlides = narrativeApi?.slides?.slice(0, 4);
    if (liveSlides && liveSlides.length > 0) return liveSlides;
    return buildFallbackNarrativeSlides(signal, scoreApi);
  }, [narrativeApi?.slides, signal, scoreApi]);

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
      hourlySentimentDays={hourlySentimentDays}
      invalidationRows={invalidationRows}
      sessionStats={sessionStats}
      regimeMetrics={regimeMetrics}
      narrativeSlides={narrativeSlides}
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
