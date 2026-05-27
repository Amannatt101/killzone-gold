import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { TWEAK_DEFAULTS_V2, V2_ACCENTS, type AccentKey } from "./accent";
import { buildGoldDecisionBrief } from "./decision-brief";
import {
  buildDominanceModels,
  type DominanceModesInput,
} from "./dominance-models";
import { GoldDecisionBrief } from "./GoldDecisionBrief";
import { GoldRadar } from "./GoldRadar";
import { GoldStatusBar } from "./GoldStatusBar";
import { ForcesCompactPanel } from "./widgets/ForcesCompactPanel";
import { Invalidation } from "./widgets/Invalidation";
import { KillzoneTiming } from "./widgets/KillzoneTiming";
import type { MarketNarrativeSlide } from "./widgets/LiveMarketNarrativeCarousel";
import { MacroDominancePanel } from "./widgets/MacroDominancePanel";
import { MarketNarrativeFeed } from "./widgets/MarketNarrativeFeed";
import { MarketRegime } from "./widgets/MarketRegime";
import { NextPulseCard } from "./widgets/NextPulseCard";
import { PositioningBias } from "./widgets/PositioningBias";
import { RegimeScorePanel } from "./widgets/RegimeScorePanel";
import type { SignalData } from "./signal-types";

export type IntelligenceDashboardProps = {
  signal: SignalData;
  regimeLabel: string;
  nextRefreshIso?: string | null;
  invalidationRows?: {
    trigger: ReactNode;
    exp: string;
    status: "near" | "armed" | "remote";
    statusLbl: string;
  }[];
  sessionStats?: Record<string, string>;
  regimeMetrics?: { label: string; value: string; sub: string }[];
  narrativeSlides?: MarketNarrativeSlide[];
  narrativeChanged?: boolean;
  positioning: {
    title: string;
    body: ReactNode;
  };
  scoreLastChangedIso?: string;
  scoreDelta?: number | null;
  dominanceModes?: DominanceModesInput;
  macroLastFetched?: string;
  scoreApiCurrent?: {
    realYield?: number;
    vix?: number;
    usdBroad?: number;
  };
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
  invalidationRows,
  sessionStats,
  regimeMetrics,
  narrativeSlides,
  narrativeChanged,
  positioning,
  scoreLastChangedIso,
  scoreDelta,
  dominanceModes,
  macroLastFetched,
  scoreApiCurrent,
  topbar,
  topbarExtra,
}: IntelligenceDashboardProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [tweaks, setTweaks] = useState(TWEAK_DEFAULTS_V2);
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const models = useMemo(
    () => buildDominanceModels(topbar.score, dominanceModes),
    [topbar.score, dominanceModes],
  );

  const brief = useMemo(
    () =>
      buildGoldDecisionBrief(signal, models, regimeLabel, positioning.title, {
        scoreLastChangedIso,
        narrativeChanged,
        scoreDelta,
      }),
    [
      signal,
      models,
      regimeLabel,
      positioning.title,
      scoreLastChangedIso,
      narrativeChanged,
      scoreDelta,
    ],
  );

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

  return (
    <div
      ref={shellRef}
      className="kz-v2 kz-v2-shell gold-radar-workspace"
      data-density={tweaks.density}
    >
      <div className="gold-radar-bg" aria-hidden />
      <div className="gold-radar-inner">
        <GoldStatusBar
          priceDisplay={topbar.priceDisplay}
          chgDisplay={topbar.chgDisplay}
          chgClass={topbar.chgClass}
          score={topbar.score}
          scoreTag={topbar.scoreTag}
          regimeChip={topbar.regimeChip}
          biasChip={topbar.biasChip}
          liveLine={topbar.liveLine}
          extra={topbarExtra}
        />

        <GoldDecisionBrief brief={brief} />

        <div className="b-grid">
          <div className="b-stack">
            <RegimeScorePanel
              score={topbar.score}
              regimeLabel={regimeLabel}
              intradayModel={models.intraday}
            />
            <MacroDominancePanel
              macroModel={models.macro}
              metrics={regimeMetrics}
              macroLastFetched={macroLastFetched}
            />
            <MarketRegime regimeLabel={regimeLabel} metrics={regimeMetrics} />
            <ForcesCompactPanel model={models.intraday} />
          </div>

          <GoldRadar
            score={topbar.score}
            models={models}
            dominanceModes={dominanceModes}
            current={scoreApiCurrent}
            macroLastFetched={macroLastFetched}
          />

          <div className="b-stack">
            <PositioningBias
              bias={signal.bias}
              score={signal.score}
              title={positioning.title}
              body={positioning.body}
            />
            <KillzoneTiming stats={sessionStats} />
            <NextPulseCard nextRefreshIso={nextRefreshIso} />
          </div>
        </div>

        <div className="b-bottom">
          <MarketNarrativeFeed
            slides={narrativeSlides ?? []}
            narrativeChanged={narrativeChanged}
          />
          <Invalidation rows={invalidationRows} />
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
  );
}
