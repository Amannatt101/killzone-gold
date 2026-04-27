import { useEffect, useRef, useState, type ReactNode } from "react";
import { TWEAK_DEFAULTS_V2, V2_ACCENTS, type AccentKey } from "./accent";
import { formatNextRefresh } from "./score-utils";
import { Battlefield } from "./widgets/Battlefield";
import { Invalidation } from "./widgets/Invalidation";
import { KillzoneTiming } from "./widgets/KillzoneTiming";
import { LiveMarketNarrativeCarousel, type MarketNarrativeSlide } from "./widgets/LiveMarketNarrativeCarousel";
import { MarketRegime } from "./widgets/MarketRegime";
import { PositioningBias } from "./widgets/PositioningBias";
import { ScoreHistory } from "./widgets/ScoreHistory";
import type { SignalData } from "./signal-types";

export type IntelligenceDashboardProps = {
  signal: SignalData;
  regimeLabel: string;
  nextRefreshIso?: string | null;
  hourlySentimentDays?: {
    date: string;
    label: string;
    points: {
      time: string;
      bullishPct: number | null;
      bearishPct: number | null;
      macroScore: number | null;
      intradayScore: number | null;
      capturedAt: string | null;
    }[];
  }[];
  invalidationRows?: {
    trigger: ReactNode;
    exp: string;
    status: "near" | "armed" | "remote";
    statusLbl: string;
  }[];
  sessionStats?: Record<string, string>;
  regimeMetrics?: { label: string; value: string; sub: string }[];
  narrativeSlides?: MarketNarrativeSlide[];
  positioning: {
    title: string;
    body: ReactNode;
  };
  scoreLastChangedIso?: string;
  dominanceModes?: {
    macro: {
      components: {
        name: string;
        score: number;
        weight: number;
        contribution: number;
      }[];
    };
    intraday: {
      components: {
        name: string;
        score: number;
        weight: number;
        contribution: number;
      }[];
      window: "15m/1h";
      lastSampleAt: string;
    };
    intraday2h?: {
      components: {
        name: string;
        score: number;
        weight: number;
        contribution: number;
      }[];
      window: "2h";
      lastSampleAt: string;
    };
    intraday4h?: {
      components: {
        name: string;
        score: number;
        weight: number;
        contribution: number;
      }[];
      window: "4h";
      lastSampleAt: string;
    };
  };
  macroLastFetched?: string;
  topbar: {
    priceDisplay: string;
    chgClass: "bull" | "bear";
    chgDisplay: string;
    score: number;
    scoreTag: string;
    liveLine: string;
    regimeChip: string;
    biasChip: string;
  };
  topbarExtra?: ReactNode;
};

export function IntelligenceDashboard({
  signal,
  regimeLabel,
  nextRefreshIso,
  hourlySentimentDays,
  invalidationRows,
  sessionStats,
  regimeMetrics,
  narrativeSlides,
  positioning,
  scoreLastChangedIso,
  dominanceModes,
  macroLastFetched,
  topbar,
  topbarExtra,
}: IntelligenceDashboardProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS_V2);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const vars = V2_ACCENTS[tweaks.accent as AccentKey] || V2_ACCENTS.gold;
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
  }, [tweaks.accent]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onMsg = (e: MessageEvent) => {
      if (e?.data?.type === "__activate_edit_mode") setTweaksOpen(true);
      if (e?.data?.type === "__deactivate_edit_mode") setTweaksOpen(false);
    };
    window.addEventListener("message", onMsg);
    try {
      window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    } catch {
      /* ignore */
    }
    return () => window.removeEventListener("message", onMsg);
  }, []);

  const updateTweak = (key: "accent" | "density", val: string) => {
    setTweaks((t) => {
      const next = { ...t, [key]: val };
      if (import.meta.env.DEV) {
        try {
          window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [key]: val } }, "*");
        } catch {
          /* ignore */
        }
      }
      return next;
    });
  };

  const nextUp = formatNextRefresh(nextRefreshIso);

  return (
    <div
      ref={shellRef}
      className="kz-v2 kz-v2-shell"
      data-density={tweaks.density}
    >
      <div className="app">
        <div className="topbar">
          <div className="brand">
            <div className="brand-mark">K</div>
            <div>
              <div className="brand-name">KILLZONE</div>
              <div className="brand-sub">Gold Intelligence</div>
            </div>
          </div>

          <div className="tkr">
            <span className="tkr-sym">XAU / USD</span>
            <span className="tkr-tf mono">1D</span>
            <span className="tkr-price mono">{topbar.priceDisplay}</span>
            <span className={`tkr-chg ${topbar.chgClass} mono`}>{topbar.chgDisplay}</span>
          </div>

          <div className="tkr-score">
            <span className="lbl">SCORE</span>
            <span className="val mono">{Math.round(topbar.score)}</span>
            <span className="tag">{topbar.scoreTag}</span>
          </div>

          <div className="topbar-spacer" />

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                border: "1px solid var(--line-1)",
                borderRadius: 4,
                background: "var(--bg-2)",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                }}
              >
                Regime
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--gold-bright)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {topbar.regimeChip}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 10px",
                border: "1px solid var(--line-1)",
                borderRadius: 4,
                background: "var(--bg-2)",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: "0.18em",
                  color: "var(--text-3)",
                  textTransform: "uppercase",
                }}
              >
                Bias
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "var(--warn)",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              >
                {topbar.biasChip}
              </span>
            </div>
            <div className="topbar-meta">
              <span className="status-dot" />
              <span className="mono" style={{ fontSize: 11, color: "var(--text-3)" }}>
                {topbar.liveLine}
              </span>
            </div>
            {topbarExtra}
          </div>
        </div>

        <div className="v2-workspace">
          <div className="v2-main">
            <div className="v2-scroll">
              <div className="v2-inner">
                <Battlefield
                  score={topbar.score}
                  dominanceModes={dominanceModes}
                  macroLastFetched={macroLastFetched}
                  showMacroBar={false}
                  showIntradayBars={true}
                  showForces={true}
                />
                <LiveMarketNarrativeCarousel slides={narrativeSlides ?? []} />
                <ScoreHistory days={hourlySentimentDays} />
                <Invalidation rows={invalidationRows} />
              </div>
            </div>
          </div>
          <div className="v2-right">
            <div className="v2-scroll">
              <div className="v2-inner">
                <KillzoneTiming stats={sessionStats} />
                <PositioningBias
                  bias={signal.bias}
                  score={signal.score}
                  title={positioning.title}
                  body={positioning.body}
                />
                <Battlefield
                  score={topbar.score}
                  dominanceModes={dominanceModes}
                  macroLastFetched={macroLastFetched}
                  title="Macro Regime Dominance"
                  showMacroBar={true}
                  showIntradayBars={false}
                  showForces={false}
                />
                <MarketRegime regimeLabel={regimeLabel} metrics={regimeMetrics} />

                <div
                  style={{
                    marginTop: 8,
                    padding: "14px 4px 0",
                    borderTop: "1px solid var(--line-1)",
                    display: "flex",
                    justifyContent: "space-between",
                    fontFamily: "Geist Mono, monospace",
                    fontSize: 10,
                    color: "var(--text-3)",
                    letterSpacing: "0.04em",
                  }}
                >
                  <span>DATA · REUTERS · CME · ICE · FRED · GPR</span>
                  <span>NEXT UPDATE · {nextUp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`tweaks ${tweaksOpen ? "open" : ""}`}>
          <h4>
            <span>Tweaks</span>
            <span className="close" onClick={() => setTweaksOpen(false)}>
              {"\u00D7"}
            </span>
          </h4>
          <div className="row">
            <div className="row-lbl">Accent</div>
            <div className="swatches">
              {(Object.keys(V2_ACCENTS) as AccentKey[]).map((k) => (
                <div
                  key={k}
                  className={`sw ${tweaks.accent === k ? "active" : ""}`}
                  style={{ background: V2_ACCENTS[k]["--gold-bright"] }}
                  onClick={() => updateTweak("accent", k)}
                  onKeyDown={(e) => e.key === "Enter" && updateTweak("accent", k)}
                  role="button"
                  tabIndex={0}
                />
              ))}
            </div>
          </div>
          <div className="row">
            <div className="row-lbl">Density</div>
            <div className="seg">
              {(["compact", "comfortable", "spacious"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  className={tweaks.density === d ? "active" : ""}
                  onClick={() => updateTweak("density", d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
