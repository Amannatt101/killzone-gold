import {
  buildDominanceFromComponents,
  type DominanceForce,
} from "../score-utils";

export function Battlefield({
  score,
  dominanceModes,
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
  };
}) {
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
  const model = macroModel;
  const totalFlow = Math.max(1, model.bullSum + model.bearSum);
  const bullPctExact = (model.bullSum / totalFlow) * 100;
  const bearPctExact = 100 - bullPctExact;
  const bullSum = model.bullSum;
  const bearSum = model.bearSum;
  const BULL_FORCES: DominanceForce[] = model.bullForces;
  const BEAR_FORCES: DominanceForce[] = model.bearForces;
  const motionStrength = 0.5;

  return (
    <div className="w-card accent">
      <div className="w-head">
        <div className="title">Bull vs Bear · Dominance</div>
        <div className="meta">MACRO VS INTRADAY</div>
      </div>
      {[{ key: "macro", label: "Macro", m: macroModel }, { key: "intraday", label: "Intraday", m: intradayModel }].map(({ key, label, m }) => {
        const mBull = Number(m.bullPct.toFixed(1));
        const mBear = Number((100 - mBull).toFixed(1));
        const mEdge = Number((mBull - mBear).toFixed(1));
        const mLeaning = mEdge > 0 ? "bull" : mEdge < 0 ? "bear" : "neutral";
        const mLeaningLabel =
          mLeaning === "bull" ? "LEANING BULLISH" : mLeaning === "bear" ? "LEANING BEARISH" : "BALANCED";
        return (
          <div key={key} className="bf-hero" style={{ ["--bf-motion" as string]: motionStrength, marginBottom: 10 }}>
            <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>
              {label}
            </div>
            <div className="bf-hero-top">
              <div className="bf-hero-side bull">
                <div className="bf-hero-lbl">Supporting Gold</div>
                <div className="bf-hero-pct mono">{mBull.toFixed(1)}%</div>
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
                <div className="bf-hero-pct mono">{mBear.toFixed(1)}%</div>
              </div>
            </div>
            <div className="bf-hero-bar">
              <div className="bull bf-live-fill" style={{ width: `${mBull}%` }}>
                <span className="bf-hero-bar-lbl">{mBull.toFixed(1)}%</span>
              </div>
              <div className="bear bf-live-fill" style={{ width: `${mBear}%` }}>
                <span className="bf-hero-bar-lbl">{mBear.toFixed(1)}%</span>
              </div>
              <div className="bf-hero-bar-center" />
            </div>
          </div>
        );
      })}

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
