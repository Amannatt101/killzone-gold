import {
  buildDominanceFromComponents,
  type DominanceForce,
} from "../score-utils";

export function Battlefield({
  score,
  dominanceModes,
  macroLastFetched,
}: {
  score?: number;
  dominanceModes?: {
    macro?: {
      components?: { name: string; score: number; weight: number; contribution?: number }[];
    };
    intraday?: {
      components?: { name: string; score: number; weight: number; contribution?: number }[];
      window?: string;
      lastSampleAt?: string;
    };
    intraday2h?: {
      components?: { name: string; score: number; weight: number; contribution?: number }[];
      window?: string;
      lastSampleAt?: string;
    };
    intraday4h?: {
      components?: { name: string; score: number; weight: number; contribution?: number }[];
      window?: string;
      lastSampleAt?: string;
    };
  };
  macroLastFetched?: string;
}) {
  function minsAgo(iso?: string): string {
    if (!iso) return "n/a";
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms) || ms < 0) return "n/a";
    const mins = Math.floor(ms / 60000);
    if (mins < 1) return "<1m ago";
    if (mins < 60) return `${mins}m ago`;
    const h = Math.floor(mins / 60);
    return `${h}h ago`;
  }

  function normalizeForceName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }

  function forceExplanation(name: string, side: "bull" | "bear"): string {
    const n = normalizeForceName(name);

    if (n.includes("geopolitical") || n.includes("gpr")) {
      return "GPR tracks geopolitical stress. Rising readings usually strengthen safe-haven demand for gold, while easing risk can fade that support.";
    }
    if (n.includes("central bank")) {
      return "Central bank buying removes physical supply from the market. Stronger accumulation tends to support price floors over time.";
    }
    if (n.includes("etf")) {
      return "ETF flows reflect investment appetite for gold exposure. Net inflows suggest fresh demand, while outflows often signal weaker conviction.";
    }
    if (n.includes("dollar")) {
      return "Gold often trades inversely to the U.S. dollar. A softer dollar can make gold relatively cheaper globally, while dollar strength can pressure it.";
    }
    if (n.includes("real yield")) {
      return "Real yields are a key opportunity-cost signal for gold. Rising real yields typically pressure non-yielding assets, while falling yields are supportive.";
    }
    if (n.includes("risk on") || n.includes("risk sentiment")) {
      return "Risk-on conditions shift capital toward growth and cyclical assets. That rotation can reduce defensive allocation into gold.";
    }
    if (n.includes("inflation")) {
      return "Inflation direction shapes rate expectations and hedging demand. Cooling inflation can ease urgency for defensive gold positioning.";
    }
    if (n.includes("momentum")) {
      return "Momentum captures trend persistence in price behavior. Weakening momentum often reduces follow-through buying and can limit upside extension.";
    }

    return side === "bull"
      ? "This factor is currently adding to supportive flow for gold, helping reinforce the broader bullish side of the balance."
      : "This factor is currently contributing to pressure on gold, adding weight to the opposing side of the balance.";
  }

  const macroModel = buildDominanceFromComponents({
    score,
    components: dominanceModes?.macro?.components,
  });
  const intradayModel = buildDominanceFromComponents({
    score,
    components: dominanceModes?.intraday?.components,
  });
  const intraday2hModel = buildDominanceFromComponents({
    score,
    components: dominanceModes?.intraday2h?.components,
  });
  const intraday4hModel = buildDominanceFromComponents({
    score,
    components: dominanceModes?.intraday4h?.components,
  });
  const model = macroModel;
  const totalFlow = Math.max(1, model.bullSum + model.bearSum);
  const bullPctExact = (model.bullSum / totalFlow) * 100;
  const bearPctExact = 100 - bullPctExact;
  const bullSum = model.bullSum;
  const bearSum = model.bearSum;
  const BULL_FORCES: DominanceForce[] = model.bullForces;
  const BEAR_FORCES: DominanceForce[] = model.bearForces;
  const motionStrength = 0.5;
  const macroBull = macroModel.bullPct;
  const intraBull = intradayModel.bullPct;
  const macroBear = 100 - macroBull;
  const intraBear = 100 - intraBull;
  const macroStrongBull = macroBull >= 65;
  const macroStrongBear = macroBull <= 35;
  const intraStrongBull = intraBull >= 65;
  const intraStrongBear = intraBull <= 35;
  const splitRegime = (macroStrongBull && intraStrongBear) || (macroStrongBear && intraStrongBull);

  const interpretation = (() => {
    if (macroStrongBull && intraStrongBull) {
      return "Aligned Bullish: trend and timing are both supportive for long setups.";
    }
    if (macroStrongBear && intraStrongBear) {
      return "Aligned Bearish: trend and timing both favor defensive or short bias.";
    }
    if (macroStrongBull && intraStrongBear) {
      return "Macro Bull, Intraday Pullback: broader uptrend with short-term pressure.";
    }
    if (macroStrongBear && intraStrongBull) {
      return "Macro Bear, Intraday Bounce: broader downtrend with short-term relief rally.";
    }
    return "Mixed / No Edge: wait for clearer alignment between regime and execution.";
  })();

  return (
    <div className="w-card accent">
      <div className="w-head">
        <div className="title">Bull vs Bear · Dominance</div>
        <div className="meta">MACRO = DIRECTIONAL BIAS · INTRADAY = TIMING LAYER</div>
      </div>
      {splitRegime && (
        <div
          style={{
            marginBottom: 10,
            border: "1px solid var(--line-1)",
            borderRadius: 6,
            padding: "6px 10px",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--warn)",
            background: "var(--bg-2)",
          }}
        >
          Split Regime
        </div>
      )}
      {[
        { key: "macro", label: "Macro Regime (24h+ context)", m: macroModel, freshness: minsAgo(macroLastFetched) },
        {
          key: "intraday-fast",
          label: "Fast Intraday Flow (15m/1h)",
          m: intradayModel,
          freshness: minsAgo(dominanceModes?.intraday?.lastSampleAt),
        },
        {
          key: "intraday-2h",
          label: "Intraday Flow (2h)",
          m: intraday2hModel,
          freshness: minsAgo(dominanceModes?.intraday2h?.lastSampleAt),
        },
        {
          key: "intraday-4h",
          label: "Intraday Flow (4h)",
          m: intraday4hModel,
          freshness: minsAgo(dominanceModes?.intraday4h?.lastSampleAt),
        },
      ].map(({ key, label, m, freshness }) => {
        const mBull = Number(m.bullPct.toFixed(1));
        const mBear = Number((100 - mBull).toFixed(1));
        const mEdge = Number((mBull - mBear).toFixed(1));
        const mLeaning = mEdge > 0 ? "bull" : mEdge < 0 ? "bear" : "neutral";
        const mLeaningLabel =
          mLeaning === "bull" ? "LEANING BULLISH" : mLeaning === "bear" ? "LEANING BEARISH" : "BALANCED";
        return (
          <div key={key} className="bf-hero" style={{ ["--bf-motion" as string]: motionStrength, marginBottom: 6, padding: "7px 9px" }}>
            <div style={{ fontSize: 8, letterSpacing: "0.06em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 2 }}>
              {label}
            </div>
            <div className="mono" style={{ fontSize: 8, color: "var(--text-3)", marginBottom: 2 }}>
              Updated {freshness}
            </div>
            <div className="bf-hero-top" style={{ marginBottom: 4 }}>
              <div className="bf-hero-side bull">
                <div className="bf-hero-lbl">Supporting Gold</div>
                <div className="bf-hero-pct mono" style={{ fontSize: 20 }}>{mBull.toFixed(1)}%</div>
              </div>
              <div className={`bf-hero-verdict ${mLeaning} bf-live-verdict`}>
                <div className="bf-hero-verdict-text">
                  <div className="bf-hero-verdict-lbl">{mLeaningLabel}</div>
                  <div className="bf-hero-verdict-edge mono">
                    {mEdge > 0 ? "+" : ""}
                    {mEdge.toFixed(1)} pt edge · {m.magnitude}
                  </div>
                </div>
              </div>
              <div className="bf-hero-side bear">
                <div className="bf-hero-lbl">Opposing Gold</div>
                <div className="bf-hero-pct mono" style={{ fontSize: 20 }}>{mBear.toFixed(1)}%</div>
              </div>
            </div>
            <div className="bf-hero-bar" style={{ height: 12 }}>
              <div className="bull bf-live-fill" style={{ width: `${mBull}%`, fontSize: 9 }}>
                <span className="bf-hero-bar-lbl">{mBull.toFixed(1)}%</span>
              </div>
              <div className="bear bf-live-fill" style={{ width: `${mBear}%`, fontSize: 9 }}>
                <span className="bf-hero-bar-lbl">{mBear.toFixed(1)}%</span>
              </div>
              <div className="bf-hero-bar-center" />
            </div>
          </div>
        );
      })}
      <div
        style={{
          marginBottom: 12,
          borderTop: "1px solid var(--line-1)",
          paddingTop: 10,
          fontSize: 13,
          color: "var(--text-2)",
        }}
      >
        {interpretation}
      </div>

      <div className="battlefield-grid">
        <div className="bf-side bull">
          <div className="bf-head">
            <div className="bf-label bull">Supporting Forces</div>
            <div className="bf-dom bull mono">+{bullSum.toFixed(2)}</div>
          </div>
          <div className="bf-forces">
            {BULL_FORCES.map((f, i) => (
              <div key={i} className={`bf-force ${f.strong ? "strong" : ""}`}>
                <div className="bf-force-main">
                  <div className="bf-force-name">{f.name}</div>
                  <div className="bf-force-desc">{forceExplanation(f.name, "bull")}</div>
                </div>
                <div className="bf-force-wt bull">+{f.weight.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="bf-side bear">
          <div className="bf-head">
            <div className="bf-label bear">Opposing Forces</div>
            <div className="bf-dom bear mono">−{bearSum.toFixed(2)}</div>
          </div>
          <div className="bf-forces">
            {BEAR_FORCES.map((f, i) => (
              <div key={i} className={`bf-force ${f.strong ? "strong" : ""}`}>
                <div className="bf-force-main">
                  <div className="bf-force-name">{f.name}</div>
                  <div className="bf-force-desc">{forceExplanation(f.name, "bear")}</div>
                </div>
                <div className="bf-force-wt bear">−{f.weight.toFixed(3)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
